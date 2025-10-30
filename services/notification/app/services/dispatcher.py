from __future__ import annotations

import time
import uuid
from contextlib import asynccontextmanager
from typing import Mapping, Tuple

from app.core.logging import logger
from app.core.metrics import (
    notifications_enqueued_total,
    notifications_sent_total,
    notifications_failed_total,
    send_latency_seconds,
)
from app.core.settings import settings
from app.core.idempotency import ensure_idempotent
from app.core.routing import channel_enabled_for_tenant
from app.core.throttle import allow_tenant, allow_recipient
from app.core.templates import render
from app.core.providers import get_email_driver, get_sms_driver
from app.core.resilience import call_with_resilience, mark_retry_metric
from app.core.exceptions import (
    ValidationError,
    ThrottleExceeded,
    DuplicateMessage,
    ChannelDisabled,
    ProviderError,
)
from app.schemas.message import MessageIn


@asynccontextmanager
async def _email_driver_ctx():
    drv = get_email_driver()
    # if supports async context manager, use it
    if hasattr(drv, "__aenter__"):
        async with drv:  # type: ignore
            yield drv
    else:
        yield drv


@asynccontextmanager
async def _sms_driver_ctx():
    drv = get_sms_driver()
    if hasattr(drv, "__aenter__"):
        async with drv:  # type: ignore
            yield drv
    else:
        yield drv


def _pick_recipient(msg: MessageIn) -> Tuple[str, str]:
    """
    Returns (recipient_value, normalized_for_metrics)
    """
    if msg.channel == "email" and msg.to.email:
        return msg.to.email, msg.to.email.lower()
    if msg.channel == "sms" and msg.to.phone:
        return msg.to.phone, msg.to.phone
    # extend for push/whatsapp etc.
    raise ValidationError("Recipient missing for channel")


async def dispatch(message: MessageIn) -> Mapping:
    """
    Validate → idempotency → throttles → render → choose provider → send → metrics
    Returns a dict with status and provider message id.
    """
    tenant = message.tenant_id or "n/a"
    notifications_enqueued_total.labels(channel=message.channel, tenant=tenant).inc()

    if not channel_enabled_for_tenant(message.tenant_id, message.channel):
        raise ChannelDisabled(f"Channel {message.channel} disabled for tenant")

    # Basic validation
    rcpt, rcpt_key = _pick_recipient(message)
    if not message.template_id:
        raise ValidationError("template_id required")

    # Idempotency
    if message.idempotency_key:
        ok = await ensure_idempotent(message.idempotency_key)
        if not ok:
            raise DuplicateMessage("Duplicate idempotency key")

    # Throttles
    if not await allow_tenant(message.tenant_id):
        raise ThrottleExceeded("Tenant throttle exceeded")
    if not await allow_recipient(rcpt_key):
        raise ThrottleExceeded("Recipient throttle exceeded")

    # Render templates
    html, txt = render(message.template_id, message.locale, message.variables)
    if message.channel == "email":
        # Subject may come from variables; enforce presence
        subject = str(message.variables.get("subject") or f"Notification: {message.template_id}")
        if not (html or txt):
            raise ValidationError("Email template missing (html or txt required)")

        async with _email_driver_ctx() as drv:
            provider = type(drv).__name__.replace("Driver", "").lower()
            t0 = time.perf_counter()

            def on_retry():
                mark_retry_metric("email", provider, tenant, message.template_id)

            try:
                provider_message_id = await call_with_resilience(
                    channel="email",
                    provider=provider,
                    template_id=message.template_id,
                    tenant=message.tenant_id,
                    func=drv.send,
                    on_retry=on_retry,
                    to=rcpt,
                    subject=subject,
                    html=html,
                    text=txt,
                    metadata=message.metadata,
                )
                dt = time.perf_counter() - t0
                send_latency_seconds.labels("email", provider).observe(dt)
                notifications_sent_total.labels(
                    channel="email", provider=provider, tenant=tenant, template_id=message.template_id
                ).inc()
                logger.info("dispatch.sent", channel="email", to=rcpt, provider=provider, id=provider_message_id)
                return {"status": "sent", "provider": provider, "provider_message_id": provider_message_id}
            except Exception as e:
                notifications_failed_total.labels(
                    channel="email",
                    provider=provider,
                    tenant=tenant,
                    template_id=message.template_id,
                    reason=type(e).__name__,
                ).inc()
                logger.error("dispatch.failed", channel="email", to=rcpt, provider=provider, error=str(e))
                raise ProviderError(str(e)) from e

    elif message.channel == "sms":
        body = str(message.variables.get("body") or message.variables.get("text") or "").strip()
        if not body:
            # Provide a sane default for OTP where template renders to txt
            if txt:
                body = txt
            else:
                raise ValidationError("SMS body missing (supply variables.body or provide .txt template)")

        async with _sms_driver_ctx() as drv:
            provider = type(drv).__name__.replace("Driver", "").lower()
            t0 = time.perf_counter()

            def on_retry():
                mark_retry_metric("sms", provider, tenant, message.template_id)

            try:
                provider_message_id = await call_with_resilience(
                    channel="sms",
                    provider=provider,
                    template_id=message.template_id,
                    tenant=message.tenant_id,
                    func=drv.send,
                    on_retry=on_retry,
                    to=rcpt,
                    body=body,
                    metadata=message.metadata,
                )
                dt = time.perf_counter() - t0
                send_latency_seconds.labels("sms", provider).observe(dt)
                notifications_sent_total.labels(
                    channel="sms", provider=provider, tenant=tenant, template_id=message.template_id
                ).inc()
                logger.info("dispatch.sent", channel="sms", to=rcpt, provider=provider, id=provider_message_id)
                return {"status": "sent", "provider": provider, "provider_message_id": provider_message_id}
            except Exception as e:
                notifications_failed_total.labels(
                    channel="sms",
                    provider=provider,
                    tenant=tenant,
                    template_id=message.template_id,
                    reason=type(e).__name__,
                ).inc()
                logger.error("dispatch.failed", channel="sms", to=rcpt, provider=provider, error=str(e))
                raise ProviderError(str(e)) from e

    # TODO: push/whatsapp/inapp channels
    raise ValidationError(f"Unsupported channel: {message.channel}")
