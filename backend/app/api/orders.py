import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_session
from app.models.event import AgentType, EventType
from app.models.order import Order, OrderCreate, OrderRow, OrderStatus

router = APIRouter()


@router.post("", response_model=Order, status_code=201)
async def create_order(
    body: OrderCreate,
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    """Crea un pedido manual y lo procesa a través del grafo de agentes."""
    clock = request.app.state.clock
    event_bus = request.app.state.event_bus
    runner = request.app.state.runner

    order_id = str(uuid.uuid4())
    row = OrderRow(
        id=uuid.UUID(order_id),
        status=OrderStatus.PENDING.value,
        items=body.items,
        created_at=datetime.utcnow(),
        sim_time_created=clock.sim_time,
    )
    session.add(row)
    await session.commit()
    await session.refresh(row)

    await event_bus.publish(
        EventType.ORDER_CREATED, AgentType.CLIENTE,
        {"order_id": order_id, "items": body.items},
        clock.sim_time, session,
    )

    # Procesar en background — pasamos clock y event_bus directamente
    runner._spawn(runner.process_order(order_id, body.items, clock, event_bus))

    return Order.model_validate(row)


@router.get("", response_model=list[Order])
async def list_orders(session: AsyncSession = Depends(get_session)):
    """Lista todos los pedidos ordenados por fecha de creación."""
    result = await session.execute(select(OrderRow).order_by(OrderRow.created_at.desc()))
    return [Order.model_validate(r) for r in result.scalars().all()]


@router.get("/{order_id}", response_model=Order)
async def get_order(order_id: str, session: AsyncSession = Depends(get_session)):
    """Detalle de un pedido."""
    row = await session.get(OrderRow, uuid.UUID(order_id))
    if not row:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return Order.model_validate(row)
