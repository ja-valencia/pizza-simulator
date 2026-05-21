from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.models.order import Base  # Base compartida por todos los modelos
from app.models.event import EventRow  # noqa: F401 — necesario para que create_all conozca la tabla

engine = create_async_engine(settings.database_url, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def init_db() -> None:
    """Crea todas las tablas si no existen."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncSession:
    """Dependency de FastAPI para inyectar sesión de DB."""
    async with AsyncSessionLocal() as session:
        yield session
