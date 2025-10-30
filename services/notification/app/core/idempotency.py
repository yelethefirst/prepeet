from __future__ import annotations

from .redis_client import idem_check_and_set


async def ensure_idempotent(idempotency_key: str) -> bool:
    """
    Returns True if this idempotency key was accepted (first time).
    Returns False if we've already seen it (duplicate).
    """
    return await idem_check_and_set(idempotency_key)
