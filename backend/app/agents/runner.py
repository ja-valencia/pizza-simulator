import asyncio
import logging
import random
import uuid
from datetime import datetime

from app.agents.cliente import cliente_narrate, generate_order
from app.agents.graph import build_graph
from app.agents.state import PizzaState
from app.db.postgres import AsyncSessionLocal
from app.models.event import AgentType, EventType
from app.models.order import OrderRow, OrderStatus
from app.sim.clock import SimClock
from app.sim.event_bus import EventBus

logger = logging.getLogger(__name__)


class SimRunner:
    """Loop principal que conecta el SimClock con los agentes LangGraph."""

    def __init__(self) -> None:
        self.running = False
        self._loop_task: asyncio.Task | None = None
        self._active_orders: set[str] = set()
        self._bg_tasks: set[asyncio.Task] = set()  # evita GC de tareas en background
        self.clock: SimClock | None = None
        self.event_bus: EventBus | None = None
        self._auto_order_probability = 0.0  # desactivado hasta Fase 5 (control desde frontend)

    async def start(self, clock: SimClock, event_bus: EventBus) -> None:
        if self.running:
            return
        self.clock = clock
        self.event_bus = event_bus
        self.running = True
        self._loop_task = asyncio.create_task(self._loop())
        logger.info("[Runner] Iniciado")

    async def stop(self) -> None:
        self.running = False
        if self._loop_task:
            self._loop_task.cancel()
            try:
                await self._loop_task
            except asyncio.CancelledError:
                pass

    def _spawn(self, coro) -> None:
        """Crea una tarea background guardando referencia para evitar GC."""
        task = asyncio.create_task(coro)
        self._bg_tasks.add(task)
        task.add_done_callback(self._bg_tasks.discard)

    async def process_order(
        self,
        order_id: str,
        items: list[str],
        clock: SimClock,
        event_bus: EventBus,
    ) -> None:
        """Procesa un pedido a través del grafo LangGraph."""
        if order_id in self._active_orders:
            logger.warning(f"[Runner] Orden {order_id[:8]} ya en proceso, ignorando")
            return
        self._active_orders.add(order_id)
        logger.info(f"[Runner] Procesando orden {order_id[:8]}: {items}")

        try:
            async with AsyncSessionLocal() as session:
                graph = build_graph(session, event_bus)
                initial_state: PizzaState = {
                    "order_id": order_id,
                    "items": items,
                    "status": OrderStatus.PENDING.value,
                    "sim_time_created": clock.sim_time,
                    "current_sim_time": clock.sim_time,
                    "agent_messages": [],
                    "is_free": False,
                    "batch_wait_start": 0.0,
                    "delivery_load": 0,
                    "pizzas_since_clean": 0,
                    "minutes_since_clean": 0.0,
                }
                await graph.ainvoke(initial_state)
                logger.info(f"[Runner] Orden {order_id[:8]} completada ✓")
        except Exception as e:
            logger.error(f"[Runner] Error en orden {order_id[:8]}: {e}", exc_info=True)
        finally:
            self._active_orders.discard(order_id)

    async def create_auto_order(self) -> None:
        """El agente Cliente genera un pedido automático."""
        if not self.clock or not self.event_bus:
            return
        items = await generate_order()
        order_id = str(uuid.uuid4())
        logger.info(f"[Cliente] Generando pedido automático: {items}")

        async with AsyncSessionLocal() as session:
            row = OrderRow(
                id=uuid.UUID(order_id),
                status=OrderStatus.PENDING.value,
                items=items,
                created_at=datetime.utcnow(),
                sim_time_created=self.clock.sim_time,
            )
            session.add(row)
            await session.commit()

            msg = await cliente_narrate(items)
            await self.event_bus.publish(
                EventType.ORDER_CREATED, AgentType.CLIENTE,
                {"order_id": order_id, "items": items, "message": msg},
                self.clock.sim_time, session,
            )

        self._spawn(self.process_order(order_id, items, self.clock, self.event_bus))

    async def _loop(self) -> None:
        while self.running:
            await asyncio.sleep(2.5)
            if not self.clock or not self.clock.running:
                continue
            if random.random() < self._auto_order_probability:
                self._spawn(self.create_auto_order())
