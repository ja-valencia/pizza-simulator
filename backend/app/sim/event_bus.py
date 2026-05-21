import uuid
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import AgentType, Event, EventRow, EventType
from app.ws.manager import ws_manager


class EventBus:
    """Punto único para publicar eventos: persiste en Postgres y broadcast por WebSocket."""

    async def publish(
        self,
        event_type: EventType,
        agent: AgentType,
        payload: dict,
        sim_time: float,
        session: AsyncSession,
    ) -> Event:
        row = EventRow(
            id=uuid.uuid4(),
            timestamp=datetime.utcnow(),
            sim_time=sim_time,
            type=event_type.value,
            agent=agent.value,
            payload=payload,
        )
        session.add(row)
        await session.commit()
        await session.refresh(row)

        event = Event(
            id=row.id,
            timestamp=row.timestamp,
            sim_time=row.sim_time,
            type=event_type,
            agent=agent,
            payload=payload,
        )

        await ws_manager.broadcast({
            "type": event_type.value,
            "agent": agent.value,
            "sim_time": sim_time,
            "payload": payload,
        })

        return event
