from __future__ import annotations

import uuid
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import String, text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class Suppression(Base):
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()")
    )
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    kind: Mapped[str] = mapped_column(String(24))  # unsubscribe|bounce|complaint
    address: Mapped[str] = mapped_column(String(256), index=True)  # email or phone
    created_at: Mapped[str] = mapped_column(server_default=text("CURRENT_TIMESTAMP"))
