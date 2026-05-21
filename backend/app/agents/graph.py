import asyncio
import uuid
from datetime import datetime

from langgraph.graph import END, StateGraph
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.chef import chef_narrate
from app.agents.delivery import delivery_narrate
from app.agents.manager import manager_narrate
from app.agents.state import PizzaState
from app.models.event import AgentType, EventType
from app.models.order import OrderRow, OrderStatus
from app.sim.event_bus import EventBus
from app.sim.rules import BusinessRulesEngine

rules = BusinessRulesEngine()


def _add_message(state: PizzaState, agent: str, message: str) -> list[dict]:
    return state["agent_messages"] + [{"agent": agent, "message": message}]


# ── Nodos ──────────────────────────────────────────────────────────────────────

async def accept_order(state: PizzaState, session: AsyncSession, event_bus: EventBus) -> PizzaState:
    msg = await manager_narrate("aceptar pedido y enviar comanda a cocina", state)
    new_status = OrderStatus.ACCEPTED.value

    # Persistir en DB
    row = await session.get(OrderRow, uuid.UUID(state["order_id"]))
    if row:
        row.status = new_status
        await session.commit()

    await event_bus.publish(
        EventType.ORDER_ACCEPTED, AgentType.MANAGER,
        {"order_id": state["order_id"], "items": state["items"], "message": msg},
        state["current_sim_time"], session,
    )
    await asyncio.sleep(0.5)  # tiempo de procesamiento simulado

    await event_bus.publish(
        EventType.COMANDA_SENT, AgentType.MANAGER,
        {"order_id": state["order_id"], "message": f"Comanda enviada a cocina"},
        state["current_sim_time"], session,
    )

    return {**state, "status": new_status, "agent_messages": _add_message(state, "manager", msg)}


async def check_batch(state: PizzaState, session: AsyncSession, event_bus: EventBus) -> PizzaState:
    from app.db.redis import get_redis
    from app.models.sim_config import REDIS_CONFIG_KEY, SimConfig
    import json

    redis = await get_redis()
    raw = await redis.get(REDIS_CONFIG_KEY)
    config = SimConfig(**json.loads(raw)) if raw else SimConfig()

    if state["batch_wait_start"] == 0.0:
        # Primera vez: registrar inicio de espera
        return {**state, "batch_wait_start": state["current_sim_time"]}

    should_wait = rules.should_batch_more(1, state["batch_wait_start"], state["current_sim_time"], config)
    if should_wait:
        msg = await chef_narrate("esperar más pedidos para optimizar el horno", state)
        return {**state, "agent_messages": _add_message(state, "chef", msg), "status": "WAITING_BATCH"}

    return state


async def check_station(state: PizzaState, session: AsyncSession, event_bus: EventBus) -> PizzaState:
    from app.db.redis import get_redis
    from app.models.sim_config import REDIS_CONFIG_KEY, SimConfig
    import json

    redis = await get_redis()
    raw = await redis.get(REDIS_CONFIG_KEY)
    config = SimConfig(**json.loads(raw)) if raw else SimConfig()

    needs_clean = rules.needs_station_cleaning(
        state["pizzas_since_clean"], state["minutes_since_clean"], config
    )
    return {**state, "_needs_clean": needs_clean}


async def clean_station(state: PizzaState, session: AsyncSession, event_bus: EventBus) -> PizzaState:
    msg = await chef_narrate("limpiar la estación de trabajo antes de hornear", state)
    await event_bus.publish(
        EventType.STATION_CLEANING, AgentType.CHEF,
        {"message": msg}, state["current_sim_time"], session,
    )
    await asyncio.sleep(1.0)  # tiempo de limpieza
    return {
        **state,
        "pizzas_since_clean": 0,
        "minutes_since_clean": 0.0,
        "agent_messages": _add_message(state, "chef", msg),
    }


async def cook(state: PizzaState, session: AsyncSession, event_bus: EventBus) -> PizzaState:
    msg_cooking = await chef_narrate(f"meter al horno las pizzas: {state['items']}", state)
    new_status = OrderStatus.COOKING.value

    row = await session.get(OrderRow, uuid.UUID(state["order_id"]))
    if row:
        row.status = new_status
        await session.commit()

    await event_bus.publish(
        EventType.PIZZA_COOKING, AgentType.CHEF,
        {"order_id": state["order_id"], "items": state["items"], "message": msg_cooking},
        state["current_sim_time"], session,
    )
    await asyncio.sleep(2.0)  # tiempo de horneado

    msg_baked = await chef_narrate(f"sacar las pizzas del horno perfectamente doradas", state)
    new_status = OrderStatus.BAKED.value

    if row:
        row.status = new_status
        await session.commit()

    await event_bus.publish(
        EventType.PIZZA_BAKED, AgentType.CHEF,
        {"order_id": state["order_id"], "message": msg_baked},
        state["current_sim_time"], session,
    )

    return {
        **state,
        "status": new_status,
        "pizzas_since_clean": state["pizzas_since_clean"] + len(state["items"]),
        "agent_messages": _add_message(state, "chef", msg_baked),
    }


async def pack(state: PizzaState, session: AsyncSession, event_bus: EventBus) -> PizzaState:
    msg = await chef_narrate("empacar las pizzas y dejarlas en la zona de embarque", state)
    new_status = OrderStatus.PACKED.value

    row = await session.get(OrderRow, uuid.UUID(state["order_id"]))
    if row:
        row.status = new_status
        await session.commit()

    await event_bus.publish(
        EventType.PIZZA_PACKED, AgentType.CHEF,
        {"order_id": state["order_id"], "message": msg},
        state["current_sim_time"], session,
    )
    await asyncio.sleep(0.5)

    return {**state, "status": new_status, "agent_messages": _add_message(state, "chef", msg)}


async def dispatch(state: PizzaState, session: AsyncSession, event_bus: EventBus) -> PizzaState:
    msg = await delivery_narrate("recoger las pizzas y salir a entregar", state)
    new_status = OrderStatus.IN_DELIVERY.value

    row = await session.get(OrderRow, uuid.UUID(state["order_id"]))
    if row:
        row.status = new_status
        await session.commit()

    await event_bus.publish(
        EventType.DELIVERY_DISPATCHED, AgentType.DELIVERY,
        {"order_id": state["order_id"], "items": state["items"], "message": msg},
        state["current_sim_time"], session,
    )
    await asyncio.sleep(1.5)  # tiempo en ruta

    return {
        **state,
        "status": new_status,
        "delivery_load": state["delivery_load"] + len(state["items"]),
        "agent_messages": _add_message(state, "delivery", msg),
    }


async def deliver(state: PizzaState, session: AsyncSession, event_bus: EventBus) -> PizzaState:
    from app.db.redis import get_redis
    from app.models.sim_config import REDIS_CONFIG_KEY, SimConfig
    import json

    redis = await get_redis()
    raw = await redis.get(REDIS_CONFIG_KEY)
    config = SimConfig(**json.loads(raw)) if raw else SimConfig()

    is_free = rules.is_delivery_free(state["sim_time_created"], state["current_sim_time"], config)
    msg = await delivery_narrate(
        f"entregar las pizzas al cliente {'(¡entrega gratis por tardanza!)' if is_free else ''}", state
    )
    new_status = OrderStatus.DELIVERED.value

    row = await session.get(OrderRow, uuid.UUID(state["order_id"]))
    if row:
        row.status = new_status
        row.is_free = is_free
        await session.commit()

    await event_bus.publish(
        EventType.DELIVERED, AgentType.DELIVERY,
        {"order_id": state["order_id"], "is_free": is_free, "message": msg},
        state["current_sim_time"], session,
    )

    return {
        **state,
        "status": new_status,
        "is_free": is_free,
        "agent_messages": _add_message(state, "delivery", msg),
    }


async def close_order(state: PizzaState, session: AsyncSession, event_bus: EventBus) -> PizzaState:
    is_free = state["is_free"]
    event_type = EventType.PAYMENT_FREE if is_free else EventType.PAYMENT_RECEIVED
    new_status = OrderStatus.FREE.value if is_free else OrderStatus.PAID.value

    msg = await manager_narrate(
        f"{'registrar entrega gratuita' if is_free else 'recibir pago'} y cerrar pedido", state
    )

    row = await session.get(OrderRow, uuid.UUID(state["order_id"]))
    if row:
        row.status = new_status
        await session.commit()

    await event_bus.publish(
        event_type, AgentType.MANAGER,
        {"order_id": state["order_id"], "is_free": is_free, "message": msg},
        state["current_sim_time"], session,
    )

    await asyncio.sleep(0.3)
    await event_bus.publish(
        EventType.DELIVERY_RETURNED, AgentType.DELIVERY,
        {"order_id": state["order_id"]},
        state["current_sim_time"], session,
    )

    return {
        **state,
        "status": new_status,
        "delivery_load": max(0, state["delivery_load"] - len(state["items"])),
        "agent_messages": _add_message(state, "manager", msg),
    }


# ── Routing ────────────────────────────────────────────────────────────────────

def route_batch(state: PizzaState) -> str:
    if state.get("status") == "WAITING_BATCH":
        return END
    return "check_station"


def route_station(state: PizzaState) -> str:
    return "clean_station" if state.get("_needs_clean") else "cook"


# ── Compilar el grafo ──────────────────────────────────────────────────────────

def build_graph(session: AsyncSession, event_bus: EventBus):
    """Construye el grafo LangGraph para procesar un pedido."""

    def wrap(fn):
        async def node(state: PizzaState) -> PizzaState:
            return await fn(state, session, event_bus)
        return node

    graph = StateGraph(PizzaState)
    graph.add_node("accept_order", wrap(accept_order))
    graph.add_node("check_batch", wrap(check_batch))
    graph.add_node("check_station", wrap(check_station))
    graph.add_node("clean_station", wrap(clean_station))
    graph.add_node("cook", wrap(cook))
    graph.add_node("pack", wrap(pack))
    graph.add_node("dispatch", wrap(dispatch))
    graph.add_node("deliver", wrap(deliver))
    graph.add_node("close_order", wrap(close_order))

    graph.set_entry_point("accept_order")
    graph.add_edge("accept_order", "check_batch")
    graph.add_conditional_edges("check_batch", route_batch, {"check_station": "check_station", END: END})
    graph.add_conditional_edges("check_station", route_station, {"clean_station": "clean_station", "cook": "cook"})
    graph.add_edge("clean_station", "cook")
    graph.add_edge("cook", "pack")
    graph.add_edge("pack", "dispatch")
    graph.add_edge("dispatch", "deliver")
    graph.add_edge("deliver", "close_order")
    graph.add_edge("close_order", END)

    return graph.compile()
