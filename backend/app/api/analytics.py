"""
Analytics API — métricas agregadas desde PostgreSQL.

Por qué un endpoint separado en vez de calcular en el frontend:
- Las agregaciones (AVG, COUNT) son más eficientes en SQL que en JS
- El frontend solo necesita los números finales, no todos los registros
- Permite cachear resultados en Redis si el volume crece (Fase 6)
"""
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_session
from app.models.order import OrderRow, OrderStatus

router = APIRouter()


@router.get("/summary")
async def analytics_summary(session: AsyncSession = Depends(get_session)):
    """
    Métricas agregadas del estado actual de la simulación.
    Consulta la tabla orders en PostgreSQL para garantizar datos persistentes.
    """
    # Total de pedidos
    total_result = await session.execute(select(func.count(OrderRow.id)))
    total = total_result.scalar() or 0

    # Pedidos completados (PAID + FREE)
    completed_result = await session.execute(
        select(func.count(OrderRow.id)).where(
            OrderRow.status.in_([OrderStatus.PAID.value, OrderStatus.FREE.value])
        )
    )
    completed = completed_result.scalar() or 0

    # Entregas gratuitas (pizzas gratis por SLA)
    free_result = await session.execute(
        select(func.count(OrderRow.id)).where(OrderRow.is_free == True)  # noqa: E712
    )
    free_deliveries = free_result.scalar() or 0

    # En proceso (cualquier estado que no sea terminal)
    terminal_states = [OrderStatus.PAID.value, OrderStatus.FREE.value]
    in_progress = total - completed

    # Tiempo promedio de entrega en sim_time
    # Aproximación: usamos sim_time_created como inicio y asumimos ~20s promedio
    # En Fase 6 se puede calcular con el event PAYMENT_RECEIVED vs ORDER_CREATED
    avg_result = await session.execute(
        select(func.avg(OrderRow.sim_time_created)).where(
            OrderRow.status.in_(terminal_states)
        )
    )
    # Por ahora devolvemos un placeholder — en Fase 6 se mejora con join a events
    avg_delivery = 25.0  # segundos de simulación (valor aproximado)

    on_time_rate = (
        round((completed - free_deliveries) / completed, 2)
        if completed > 0 else 1.0
    )

    return {
        "total_orders": total,
        "completed": completed,
        "in_progress": in_progress,
        "free_deliveries": free_deliveries,
        "avg_delivery_sim_seconds": avg_delivery,
        "on_time_rate": on_time_rate,
    }


@router.get("/timeline")
async def analytics_timeline(session: AsyncSession = Depends(get_session)):
    """
    Distribución de pedidos completados por ventana de tiempo de simulación.
    Usado por el LineChart del Dashboard para mostrar la curva de actividad.

    Agrupa por ventanas de 30 segundos de simulación.
    Por qué 30s: a velocidad 1x son 30s reales, visible en la gráfica sin
    demasiados puntos. A 5x son 6s reales por bucket.
    """
    BUCKET_SIZE = 30.0  # segundos de simulación por bucket

    result = await session.execute(
        select(OrderRow.sim_time_created, OrderRow.status).where(
            OrderRow.status.in_([OrderStatus.PAID.value, OrderStatus.FREE.value])
        ).order_by(OrderRow.sim_time_created)
    )
    rows = result.all()

    if not rows:
        return []

    # Agrupar en buckets
    buckets: dict[int, int] = {}
    for sim_time, status in rows:
        bucket = int(sim_time // BUCKET_SIZE) * int(BUCKET_SIZE)
        buckets[bucket] = buckets.get(bucket, 0) + 1

    return [
        {"sim_time": k, "orders": v}
        for k, v in sorted(buckets.items())
    ]


@router.get("/orders-by-status")
async def orders_by_status(session: AsyncSession = Depends(get_session)):
    """
    Conteo de pedidos agrupados por status.
    Usado por el PieChart del Dashboard.
    """
    result = await session.execute(
        select(OrderRow.status, func.count(OrderRow.id)).group_by(OrderRow.status)
    )
    return [{"status": status, "count": count} for status, count in result.all()]
