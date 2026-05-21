from fastapi import APIRouter, HTTPException, Request

from app.models.sim_config import SimConfig

router = APIRouter()


def _get_clock(request: Request):
    return request.app.state.clock


@router.get("/status")
async def sim_status(request: Request):
    """Estado actual del reloj de simulación."""
    return _get_clock(request).get_status()


@router.post("/start")
async def sim_start(request: Request):
    """Inicia el reloj. Lee la velocidad actual de SimConfig en Redis."""
    from app.db.redis import get_redis
    from app.models.sim_config import REDIS_CONFIG_KEY
    import json

    redis = await get_redis()
    raw = await redis.get(REDIS_CONFIG_KEY)
    config = SimConfig(**json.loads(raw)) if raw else SimConfig()

    clock = _get_clock(request)
    clock.set_speed(config.sim_speed_multiplier)
    await clock.start()
    return clock.get_status()


@router.post("/stop")
async def sim_stop(request: Request):
    """Detiene el reloj."""
    clock = _get_clock(request)
    await clock.stop()
    return clock.get_status()


@router.post("/reset")
async def sim_reset(request: Request):
    """Reinicia sim_time a 0. Solo funciona si el reloj está detenido."""
    clock = _get_clock(request)
    if clock.running:
        raise HTTPException(status_code=400, detail="Detén la simulación antes de resetear")
    await clock.reset()
    return clock.get_status()
