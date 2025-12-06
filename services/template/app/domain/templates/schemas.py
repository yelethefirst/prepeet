from typing import Any, Dict, Optional
from pydantic import BaseModel, Field

from app.domain.templates.models import ChannelType


class RenderRequest(BaseModel):
    template_key: str
    channel: ChannelType
    tenant_id: Optional[str] = None
    language: str
    data: Dict[str, Any] = Field(default_factory=dict)
    options: Dict[str, Any] = Field(default_factory=dict) # e.g. strict=True


class RenderResponse(BaseModel):
    template_key: str
    channel: ChannelType
    language_used: str
    version: int
    subject: Optional[str] = None
    body_html: Optional[str] = None
    body_text: Optional[str] = None
class PreviewContentRequest(BaseModel):
    content_html: Optional[str] = None
    content_text: Optional[str] = None
    subject: Optional[str] = None
    data: Dict[str, Any] = Field(default_factory=dict)

class PreviewContentResponse(BaseModel):
    subject: Optional[str] = None
    body_html: Optional[str] = None
    body_text: Optional[str] = None
