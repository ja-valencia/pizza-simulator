from pydantic import BaseModel, Field

REDIS_CONFIG_KEY = "sim:config"


class SimConfig(BaseModel):
    """Reglas de negocio de la pizzería. Todas configurables en runtime."""

    # ── MOSTRADOR (Manager) ────────────────────────────────────────────────────
    manager_accept_time_seconds: float = Field(default=3.0, ge=0,
        description="Tiempo que tarda el Manager en tomar un pedido (seg)")
    manager_comanda_time_seconds: float = Field(default=1.0, ge=0,
        description="Tiempo de entrega de comanda al Chef (seg)")
    comanda_queue_size: int = Field(default=3, ge=1, le=20,
        description="Máx. comandas encoladas esperando al chef")
    free_delivery_after_minutes: float = Field(default=0.75, gt=0,
        description="Entrega gratis si supera X minutos (0.75 = 45 seg)")
    max_pizzas_per_order: int = Field(default=5, ge=1, le=20,
        description="Máximo de pizzas por pedido")

    # ── COCINA (Chef) ──────────────────────────────────────────────────────────
    oven_capacity: int = Field(default=4, ge=1, le=8,
        description="Máx. pizzas cocinándose simultáneamente")
    cooking_time_sim_seconds: float = Field(default=10.0, gt=0,
        description="Tiempo de cocción por pizza (seg de simulación)")
    packing_time_per_pizza_seconds: float = Field(default=1.0, ge=0,
        description="Tiempo de empacado por pizza (seg)")
    shelf_rest_seconds: float = Field(default=1.0, ge=0,
        description="Tiempo mínimo de reposo en área de entregas (seg)")
    station_clean_every_n_pizzas: int = Field(default=50, ge=1,
        description="Limpiar estación cada N pizzas")
    station_clean_every_minutes: float = Field(default=30.0, gt=0,
        description="Limpiar estación cada X minutos de simulación")
    station_cleaning_time_seconds: float = Field(default=4.0, ge=0,
        description="Duración de la limpieza de cocina (seg)")
    chef_batch_wait_seconds: float = Field(default=0.0, ge=0,
        description="Segundos que espera el chef para acumular pedidos (0=deshabilitado)")

    # ── ENTREGA (Delivery) ─────────────────────────────────────────────────────
    max_delivery_capacity: int = Field(default=5, ge=1,
        description="Máx. pizzas por viaje de delivery")
    max_orders_per_delivery: int = Field(default=5, ge=1, le=10,
        description="Máx. pedidos (no pizzas) por viaje de delivery")

    # ── SIMULACIÓN ─────────────────────────────────────────────────────────────
    sim_speed_multiplier: float = Field(default=1.0, gt=0,
        description="Velocidad del tiempo (1=real, 2=doble, 0.5=mitad)")

    # ── AUTO-PEDIDOS ───────────────────────────────────────────────────────────
    auto_order_enabled: bool = Field(default=False,
        description="Generar pedidos automáticos")
    auto_order_interval_seconds: float = Field(default=10.0, gt=0,
        description="Segundos entre pedidos automáticos")
