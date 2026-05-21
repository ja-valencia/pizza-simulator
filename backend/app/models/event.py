import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel
from sqlalchemy import DateTime, String
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.order import Base


class EventType(str, Enum):
    ORDER_CREATED = "ORDER_CREATED"
    ORDER_ACCEPTED = "ORDER_ACCEPTED"
    COMANDA_SENT = "COMANDA_SENT"
    PIZZA_COOKING = "PIZZA_COOKING"
    PIZZA_BAKED = "PIZZA_BAKED"
    PIZZA_PACKED = "PIZZA_PACKED"
    DELIVERY_DISPATCHED = "DELIVERY_DISPATCHED"
    DELIVERED = "DELIVERED"
    PAYMENT_RECEIVED = "PAYMENT_RECEIVED"
    PAYMENT_FREE = "PAYMENT_FREE"
    DELIVERY_RETURNED = "DELIVERY_RETURNED"
    STATION_CLEANING = "STATION_CLEANING"


class AgentType(str, Enum):
    MANAGER = "manager"
    CHEF = "chef"
    DELIVERY = "delivery"
    CLIENTE = "cliente"
    SYSTEM = "system"


# --- SQLAlchemy table ---

class EventRow(Base):
    __tablename__ = "events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    sim_time: Mapped[float] = mapped_column(default=0.0)
    type: Mapped[str] = mapped_column(String)
    agent: Mapped[str] = mapped_column(String)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)


# --- Pydantic schema ---

class Event(BaseModel):
    id: uuid.UUID
    timestamp: datetime
    sim_time: float
    type: EventType
    agent: AgentType
    payload: dict = {}

    model_config = {"from_attributes": True}
