import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import String, Text, Boolean, Integer, DateTime, ForeignKey, Enum as SAEnum, UniqueConstraint, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.infrastructure.db.base import Base
from app.domain.templates.models import ChannelType, TemplateStatus


class Template(Base):
    __tablename__ = "templates"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[Optional[str]] = mapped_column(String, index=True, nullable=True)
    key: Mapped[str] = mapped_column(String, index=True)
    name: Mapped[str] = mapped_column(String)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    channel: Mapped[ChannelType] = mapped_column(SAEnum(ChannelType, native_enum=False), nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    versions: Mapped[List["TemplateVersion"]] = relationship("TemplateVersion", back_populates="template", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('tenant_id', 'key', name='uq_template_tenant_key'),
    )


class TemplateVersion(Base):
    __tablename__ = "template_versions"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("templates.id"), nullable=False, index=True)
    
    language: Mapped[str] = mapped_column(String, nullable=False) # e.g. "en-US"
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    
    subject: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    body_html: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    body_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    status: Mapped[TemplateStatus] = mapped_column(SAEnum(TemplateStatus, native_enum=False), default=TemplateStatus.DRAFT)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False) # Helper to quickly find latest published
    
    placeholders_schema: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    template: Mapped["Template"] = relationship("Template", back_populates="versions")

    __table_args__ = (
        UniqueConstraint('template_id', 'language', 'version', name='uq_items'),
    )
