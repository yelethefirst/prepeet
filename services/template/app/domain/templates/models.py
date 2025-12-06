from datetime import datetime
from enum import Enum
from typing import Optional, Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.domain.templates.renderer import TemplateRenderer


class ChannelType(str, Enum):
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"


class TemplateStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


# Properties shared by models stored in DB
class TemplateBase(BaseModel):
    key: str
    name: str
    description: Optional[str] = None
    channel: ChannelType
    tenant_id: Optional[str] = None
    category: Optional[str] = None


class TemplateCreate(TemplateBase):
    pass


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None


class TemplateInDBBase(TemplateBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class Template(TemplateInDBBase):
    pass


# Version models
class TemplateVersionBase(BaseModel):
    language: str
    subject: Optional[str] = None
    body_html: Optional[str] = None
    body_text: Optional[str] = None
    placeholders_schema: Optional[dict[str, Any]] = None


class TemplateVersionCreate(TemplateVersionBase):
    @field_validator("body_html", "body_text", "subject")
    @classmethod
    def validate_jinja2(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        renderer = TemplateRenderer()
        err = renderer.validate_syntax(v)
        if err:
            raise ValueError(f"Invalid template syntax: {err}")
        return v


class TemplateVersionUpdate(BaseModel):
    subject: Optional[str] = None
    body_html: Optional[str] = None
    body_text: Optional[str] = None
    placeholders_schema: Optional[dict[str, Any]] = None

    @field_validator("body_html", "body_text", "subject")
    @classmethod
    def validate_jinja2(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        renderer = TemplateRenderer()
        err = renderer.validate_syntax(v)
        if err:
            raise ValueError(f"Invalid template syntax: {err}")
        return v


class TemplateVersionInDBBase(TemplateVersionBase):
    id: UUID
    template_id: UUID
    version: int
    status: TemplateStatus
    is_current: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TemplateVersion(TemplateVersionInDBBase):
    pass


class TemplateWithVersions(Template):
    versions: list[TemplateVersion] = []
