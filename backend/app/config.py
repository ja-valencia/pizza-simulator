from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://pizza:pizza123@localhost:5432/pizza_simulator"
    redis_url: str = "redis://localhost:6379"
    host: str = "0.0.0.0"
    port: int = 8000
    google_api_key: str = ""
    groq_api_key: str = ""

    model_config = {"env_file": ".env"}


settings = Settings()
