from __future__ import annotations

import uuid
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class Tenant(Base):
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()")
    )
    name: Mapped[str] = mapped_column(index=True)
    config: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[str] = mapped_column(server_default=text("CURRENT_TIMESTAMP"))
