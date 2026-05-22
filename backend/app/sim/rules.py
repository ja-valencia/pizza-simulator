from app.models.sim_config import SimConfig


class BusinessRulesEngine:
    """Evaluación pura de reglas de negocio. Sin estado propio ni efectos secundarios."""

    @staticmethod
    def is_delivery_free(
        order_sim_time_created: float,
        current_sim_time: float,
        config: SimConfig,
    ) -> bool:
        """True si el pedido superó el tiempo límite de entrega."""
        elapsed_minutes = (current_sim_time - order_sim_time_created) / 60.0
        return elapsed_minutes > config.free_delivery_after_minutes

    @staticmethod
    def needs_station_cleaning(
        pizzas_since_last_clean: int,
        minutes_since_last_clean: float,
        config: SimConfig,
    ) -> bool:
        """True si el chef debe limpiar la estación antes de continuar."""
        return (
            pizzas_since_last_clean >= config.station_clean_every_n_pizzas
            or minutes_since_last_clean >= config.station_clean_every_minutes
        )

    @staticmethod
    def can_accept_delivery(current_load: int, config: SimConfig) -> bool:
        """True si el delivery puede cargar más pizzas."""
        return current_load < config.max_delivery_capacity

    @staticmethod
    def oven_is_full(active_cooking: int, config: SimConfig) -> bool:
        """True si el horno ya alcanzó su capacidad máxima de pedidos simultáneos."""
        return active_cooking >= config.oven_capacity

    @staticmethod
    def queue_is_full(queued: int, config: SimConfig) -> bool:
        """True si la cola de comandas del chef está llena."""
        return queued >= config.comanda_queue_size

    @staticmethod
    def should_batch_more(
        waiting_orders: int,
        batch_wait_start: float,
        current_sim_time: float,
        config: SimConfig,
    ) -> bool:
        """True si el chef debería esperar más pedidos antes de hornear."""
        if waiting_orders == 0:
            return False
        elapsed = current_sim_time - batch_wait_start
        return elapsed < config.chef_batch_wait_seconds
