import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field
from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class OrderStatus(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    COOKING = "COOKING"
    BAKED = "BAKED"
    PACKED = "PACKED"
    IN_DELIVERY = "IN_DELIVERY"
    DELIVERED = "DELIVERED"
    PAID = "PAID"
    FREE = "FREE"
    FAILED = "FAILED"


# --- SQLAlchemy table ---

class Base(DeclarativeBase):
    pass


class OrderRow(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    status: Mapped[str] = mapped_column(String, default=OrderStatus.PENDING)
    items: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    sim_time_created: Mapped[float] = mapped_column(default=0.0)
    is_free: Mapped[bool] = mapped_column(Boolean, default=False)


# --- Pydantic schemas ---

class OrderCreate(BaseModel):
    items: list[str] = Field(min_length=1)


class Order(BaseModel):
    id: uuid.UUID
    status: OrderStatus
    items: list[str]
    created_at: datetime
    sim_time_created: float
    is_free: bool

    model_config = {"from_attributes": True}
