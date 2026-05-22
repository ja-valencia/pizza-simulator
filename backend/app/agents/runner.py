import asyncio
import logging
import time
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

# Watchdog: si una orden no completa en 120s reales, se cancela.
# Protege contra LLM calls colgadas que bloquean _active_orders.
ORDER_TIMEOUT_SECONDS = 120.0


async def _mark_order_failed(order_id: str, event_bus: EventBus, clock: SimClock) -> None:
    """Marca la orden como FAILED en BD y notifica al frontend via WebSocket."""
    try:
        async with AsyncSessionLocal() as session:
            row = await session.get(OrderRow, uuid.UUID(order_id))
            if row and row.status not in (OrderStatus.PAID.value, OrderStatus.FREE.value):
                row.status = OrderStatus.FAILED.value
                await session.commit()
            await event_bus.publish(
                EventType.ORDER_FAILED, AgentType.MANAGER,
                {"order_id": order_id, "message": "Pedido cancelado: timeout del pipeline"},
                clock.sim_time, session,
            )
    except Exception as e:
        logger.error(f"[Runner] Error marcando orden {order_id[:8]} como FAILED: {e}")


class SimRunner:
    """Loop principal que conecta el SimClock con los agentes LangGraph."""

    def __init__(self) -> None:
        self.running = False
        self._loop_task: asyncio.Task | None = None
        self._active_orders: set[str] = set()
        self._bg_tasks: set[asyncio.Task] = set()  # evita GC de tareas en background
        self.clock: SimClock | None = None
        self.event_bus: EventBus | None = None

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
        """Procesa un pedido a través del grafo LangGraph.

        Protecciones anti-cuelgue:
        1. request_timeout=30 en cada cliente LLM (cada llamada individualmente)
        2. asyncio.wait_for con ORDER_TIMEOUT_SECONDS (toda la cadena)
        3. _active_orders siempre se limpia en finally (incluso si cuelga o falla)
        """
        if order_id in self._active_orders:
            logger.warning(f"[Runner] Orden {order_id[:8]} ya en proceso, ignorando")
            return

        # Respetar oven_capacity — espera si el horno está lleno
        # Cap de espera: oven_capacity * 120s para no bloquear indefinidamente
        try:
            from app.db.redis import get_redis
            from app.models.sim_config import REDIS_CONFIG_KEY, SimConfig
            import json
            _redis = await get_redis()
            _raw = await _redis.get(REDIS_CONFIG_KEY)
            _config = SimConfig(**json.loads(_raw)) if _raw else SimConfig()
            wait_count = 0
            max_wait_cycles = int(_config.oven_capacity * ORDER_TIMEOUT_SECONDS / 0.5)
            while len(self._active_orders) >= _config.oven_capacity:
                if wait_count == 0:
                    logger.info(f"[Runner] Horno lleno ({len(self._active_orders)}/{_config.oven_capacity}), orden {order_id[:8]} en cola")
                if wait_count >= max_wait_cycles:
                    logger.error(f"[Runner] Orden {order_id[:8]} desistió de esperar (horno nunca liberó slot)")
                    return
                await asyncio.sleep(0.5)
                wait_count += 1
        except Exception:
            pass  # Si falla la lectura de config, continúa sin restricción

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
                    "_needs_clean": False,
                }
                # Watchdog: si el grafo no termina en ORDER_TIMEOUT_SECONDS, cancela
                await asyncio.wait_for(
                    graph.ainvoke(initial_state),
                    timeout=ORDER_TIMEOUT_SECONDS,
                )
                logger.info(f"[Runner] Orden {order_id[:8]} completada ✓")

        except asyncio.TimeoutError:
            logger.error(f"[Runner] Orden {order_id[:8]} TIMEOUT ({ORDER_TIMEOUT_SECONDS}s). Marcando FAILED.")
            await _mark_order_failed(order_id, event_bus, clock)

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
        _last_auto_order_real_time = 0.0
        while self.running:
            await asyncio.sleep(2.5)
            if not self.clock or not self.clock.running:
                continue

            try:
                from app.db.redis import get_redis
                from app.models.sim_config import REDIS_CONFIG_KEY, SimConfig
                import json
                redis = await get_redis()
                raw = await redis.get(REDIS_CONFIG_KEY)
                config = SimConfig(**json.loads(raw)) if raw else SimConfig()
            except Exception:
                config = SimConfig()

            if not config.auto_order_enabled:
                continue

            now = time.monotonic()
            if now - _last_auto_order_real_time >= config.auto_order_interval_seconds:
                _last_auto_order_real_time = now
                self._spawn(self.create_auto_order())
