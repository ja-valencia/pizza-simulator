from typing import TypedDict


class PizzaState(TypedDict):
    order_id: str
    items: list[str]
    status: str                 # OrderStatus value
    sim_time_created: float
    current_sim_time: float
    agent_messages: list[dict]  # narrativa: [{"agent": "chef", "message": "..."}]
    is_free: bool
    batch_wait_start: float     # sim_time en que el chef empezó a esperar batch
    delivery_load: int          # pizzas que carga el delivery actualmente
    pizzas_since_clean: int     # pizzas horneadas desde la última limpieza
    minutes_since_clean: float  # minutos de sim desde la última limpieza
    _needs_clean: bool          # set by check_station, read by route_station
