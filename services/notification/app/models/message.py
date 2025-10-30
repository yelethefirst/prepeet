from __future__ import annotations

import uuid
from typing import TYPE_CHECKING
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import String, text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Message(Base):
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()")
    )
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenant.id"), nullable=True
    )

    channel: Mapped[str] = mapped_column(String(24), index=True)  # email|sms|push|...
    template_id: Mapped[str] = mapped_column(String(120), index=True)
    locale: Mapped[str | None]

    to_: Mapped[dict] = mapped_column("to", JSONB, default=dict)  # keep DB column as "to"
    variables: Mapped[dict] = mapped_column(JSONB, default=dict)

    # 🚫 rename attribute away from "metadata" (reserved) — keep DB column as "metadata" if you like
    meta: Mapped[dict] = mapped_column("metadata", JSONB, default=dict)

    priority: Mapped[str] = mapped_column(String(12), default="normal")
    schedule_at: Mapped[str | None] = mapped_column(nullable=True)
    ttl_seconds: Mapped[int | None] = mapped_column(nullable=True)
    idempotency_key: Mapped[str | None] = mapped_column(String(128), index=True)

    status: Mapped[str] = mapped_column(String(24), default="queued", index=True)
    provider: Mapped[str | None] = mapped_column(String(64))
    provider_message_id: Mapped[str | None] = mapped_column(String(128))

    created_at: Mapped[str] = mapped_column(server_default=text("CURRENT_TIMESTAMP"))
    updated_at: Mapped[str] = mapped_column(server_default=text("CURRENT_TIMESTAMP"))

    # relationships
    events: Mapped[list["Event"]] = relationship(
        back_populates="message", cascade="all, delete-orphan"
    )
    attachments: Mapped[list["Attachment"]] = relationship(
        back_populates="message", cascade="all, delete-orphan"
    )

if TYPE_CHECKING:
    from app.models.event import Event
    from app.models.attachment import Attachment
