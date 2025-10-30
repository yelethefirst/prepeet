from __future__ import annotations

import uuid
from typing import TYPE_CHECKING
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import String, ForeignKey, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Event(Base):
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()")
    )
    message_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("message.id", ondelete="CASCADE"), index=True
    )
    type: Mapped[str] = mapped_column(String(32), index=True)  # Sent|Failed|Delivered|Opened|Clicked|Bounced
    meta: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[str] = mapped_column(server_default=text("CURRENT_TIMESTAMP"))

    message: Mapped["Message"] = relationship(back_populates="events")

if TYPE_CHECKING:
    from app.models.message import Message
