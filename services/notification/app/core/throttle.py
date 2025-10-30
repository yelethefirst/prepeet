from __future__ import annotations

from .redis_client import token_bucket_allow
from .settings import settings


async def allow_tenant(tenant_id: str | None) -> bool:
    capacity = settings.throttle_default_per_minute
    refill = settings.throttle_default_per_minute
    key = f"tenant:{tenant_id or 'default'}"
    return await token_bucket_allow(key=key, capacity=capacity, refill_per_min=refill)


async def allow_recipient(recipient: str) -> bool:
    capacity = settings.throttle_recipient_per_minute
    refill = settings.throttle_recipient_per_minute
    key = f"rcpt:{recipient}"
    return await token_bucket_allow(key=key, capacity=capacity, refill_per_min=refill)
