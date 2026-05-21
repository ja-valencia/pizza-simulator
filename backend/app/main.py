import asyncio
import json
import logging
from contextlib import asynccontextmanager

logging.basicConfig(level=logging.INFO)

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.agents.runner import SimRunner
from app.api.analytics import router as analytics_router
from app.api.orders import router as orders_router
from app.api.sim import router as sim_router
from app.db.postgres import init_db
from app.db.redis import close_redis, get_redis, ping_redis
from app.models.sim_config import REDIS_CONFIG_KEY, SimConfig
from app.sim.clock import SimClock
from app.sim.event_bus import EventBus
from app.ws.manager import ws_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    app.state.clock = SimClock()
    app.state.event_bus = EventBus()
    app.state.runner = SimRunner()
    asyncio.create_task(
        app.state.runner.start(app.state.clock, app.state.event_bus)
    )
    yield
    # Shutdown
    await app.state.runner.stop()
    await app.state.clock.stop()
    await close_redis()


app = FastAPI(title="Pizza Simulator API", version="0.1.0", lifespan=lifespan)
app.include_router(sim_router, prefix="/sim", tags=["simulation"])
app.include_router(orders_router, prefix="/orders", tags=["orders"])
app.include_router(analytics_router, prefix="/analytics", tags=["analytics"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Endpoints ---

@app.get("/health")
async def health():
    redis_ok = await ping_redis()
    return {
        "status": "ok",
        "redis": "ok" if redis_ok else "error",
        "postgres": "ok",  # Si llegamos aquí, init_db() no falló
    }


@app.get("/config", response_model=SimConfig)
async def get_config():
    """Devuelve la configuración actual de la simulación."""
    redis = await get_redis()
    raw = await redis.get(REDIS_CONFIG_KEY)
    if raw:
        return SimConfig(**json.loads(raw))
    return SimConfig()  # defaults


@app.put("/config", response_model=SimConfig)
async def update_config(request: Request, config: SimConfig):
    """Actualiza la configuración de la simulación en Redis."""
    redis = await get_redis()
    await redis.set(REDIS_CONFIG_KEY, config.model_dump_json())
    # Propaga velocidad al reloj en tiempo real
    request.app.state.clock.set_speed(config.sim_speed_multiplier)
    await ws_manager.broadcast({"type": "CONFIG_UPDATED", "payload": config.model_dump()})
    return config


# --- WebSocket ---

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        # Enviar config actual al conectarse
        redis = await get_redis()
        raw = await redis.get(REDIS_CONFIG_KEY)
        config = SimConfig(**json.loads(raw)) if raw else SimConfig()
        await websocket.send_text(json.dumps({
            "type": "CONNECTED",
            "payload": config.model_dump(),
        }))
        # Mantener conexión abierta
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
