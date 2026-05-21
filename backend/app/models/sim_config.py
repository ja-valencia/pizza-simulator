from pydantic import BaseModel, Field

REDIS_CONFIG_KEY = "sim:config"


class SimConfig(BaseModel):
    """Reglas de negocio de la pizzería. Todas configurables en runtime."""

    # Delivery
    max_delivery_capacity: int = Field(default=5, ge=1, description="Máx. pizzas por viaje")

    # Chef / Estación
    station_clean_every_n_pizzas: int = Field(default=10, ge=1, description="Limpiar estación cada N pizzas")
    station_clean_every_minutes: float = Field(default=30.0, gt=0, description="Limpiar estación cada X minutos")
    chef_batch_wait_seconds: float = Field(default=30.0, ge=0, description="Segundos que espera el chef para acumular pedidos")

    # SLA / pizzas gratis
    free_delivery_after_minutes: float = Field(default=45.0, gt=0, description="Entrega gratis si supera X minutos")

    # Simulación
    sim_speed_multiplier: float = Field(default=1.0, gt=0, description="Velocidad del tiempo (1=real, 2=doble, 0.5=mitad)")
