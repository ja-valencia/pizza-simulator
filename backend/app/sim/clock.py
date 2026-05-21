import asyncio

from app.db.redis import get_redis
from app.ws.manager import ws_manager

TICK_INTERVAL = 0.5  # segundos reales entre cada tick


class SimClock:
    """Reloj de simulación. Avanza el tiempo según sim_speed_multiplier."""

    def __init__(self) -> None:
        self.sim_time: float = 0.0
        self.running: bool = False
        self._task: asyncio.Task | None = None
        self._speed: float = 1.0

    async def start(self, speed: float | None = None) -> None:
        if self.running:
            return
        if speed is not None:
            self._speed = speed
        self.running = True
        await self._persist_state()
        self._task = asyncio.create_task(self._loop())

    async def stop(self) -> None:
        self.running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None
        await self._persist_state()

    async def reset(self) -> None:
        if self.running:
            return
        self.sim_time = 0.0
        await self._persist_state()

    def set_speed(self, speed: float) -> None:
        self._speed = speed

    def get_status(self) -> dict:
        return {
            "running": self.running,
            "sim_time": round(self.sim_time, 2),
            "speed": self._speed,
        }

    async def _loop(self) -> None:
        while self.running:
            await asyncio.sleep(TICK_INTERVAL)
            self.sim_time += TICK_INTERVAL * self._speed
            await self._persist_state()
            await ws_manager.broadcast({
                "type": "CLOCK_TICK",
                "payload": self.get_status(),
            })

    async def _persist_state(self) -> None:
        try:
            redis = await get_redis()
            await redis.set("sim:clock:time", self.sim_time)
            await redis.set("sim:clock:running", "1" if self.running else "0")
        except Exception:
            pass  # No romper la simulación si Redis falla momentáneamente
