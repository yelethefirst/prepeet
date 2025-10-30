from __future__ import annotations
import uuid
from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import String, Integer, ForeignKey, text
from app.db.base import Base

class Attachment(Base):
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    message_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("message.id", ondelete="CASCADE"),
        index=True,
    )
    storage: Mapped[str] = mapped_column(String(512))
    filename: Mapped[str] = mapped_column(String(256))
    size_bytes: Mapped[int] = mapped_column(Integer)

    message: Mapped["Message"] = relationship(back_populates="attachments")

if TYPE_CHECKING:
    from app.models.message import Message
