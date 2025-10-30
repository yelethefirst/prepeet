from __future__ import annotations

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Literal, Dict, Any


class Address(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    device_token: Optional[str] = None


class MessageIn(BaseModel):
    tenant_id: Optional[str] = None
    idempotency_key: Optional[str] = None
    channel: Literal["email", "sms", "push", "whatsapp", "inapp"]
    template_id: str
    locale: Optional[str] = None
    to: Address
    variables: Dict[str, Any] = Field(default_factory=dict)
    attachments: Optional[list[dict]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    priority: Optional[Literal["high", "normal", "low"]] = "normal"
    schedule_at: Optional[str] = None  # ISO 8601, future
    ttl_seconds: Optional[int] = 900
    callback_url: Optional[str] = None
    trace_id: Optional[str] = None


class MessageQueued(BaseModel):
    message_id: str
    status: Literal["queued", "scheduled"]
