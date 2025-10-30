from __future__ import annotations

from typing import Literal
from .settings import settings

Channel = Literal["email", "sms", "push", "whatsapp", "inapp"]

def channel_enabled_for_tenant(tenant_id: str | None, channel: Channel) -> bool:
    """
    If overrides set for tenant, respect them; otherwise allow by default.
    """
    if tenant_id and tenant_id in settings.tenant_channel_overrides:
        return channel in set(settings.tenant_channel_overrides[tenant_id])
    return True
