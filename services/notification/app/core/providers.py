from __future__ import annotations

from typing import Protocol, Mapping, Optional, Callable
from .settings import settings

# Protocols (driver interfaces)
class EmailDriver(Protocol):
    async def send(self, to: str, subject: str, html: str | None, text: str | None, metadata: Mapping) -> str: ...

class SmsDriver(Protocol):
    async def send(self, to: str, body: str, metadata: Mapping) -> str: ...


# Driver registry (import lazily to avoid heavy deps until used)
def get_email_driver() -> EmailDriver:
    backend = settings.email_backend
    if backend == "ses":
        from app.drivers.email.ses_driver import SESDriver
        return SESDriver(region=settings.ses_region, sender=settings.ses_from)
    if backend == "sendgrid":
        from app.drivers.email.sendgrid_driver import SendGridDriver
        return SendGridDriver(api_key=settings.sendgrid_api_key, sender=settings.ses_from)
    # default console
    from app.drivers.email.console_driver import send as console_send

    class _ConsoleDriver:
        async def send(self, to: str, subject: str, html: str | None, text: str | None, metadata: Mapping) -> str:
            return await console_send(to=to, subject=subject, html=html, text=text, metadata=dict(metadata))

    return _ConsoleDriver()


def get_sms_driver() -> SmsDriver:
    backend = settings.sms_backend
    if backend == "twilio":
        from app.drivers.sms.twilio_driver import TwilioDriver
        return TwilioDriver(sid=settings.twilio_sid, token=settings.twilio_token, from_=settings.twilio_from)
    if backend == "sns":
        from app.drivers.sms.sns_driver import SNSDriver
        return SNSDriver(region=settings.sns_region)
    # default console
    from app.drivers.sms.console_driver import send as console_send

    class _ConsoleDriver:
        async def send(self, to: str, body: str, metadata: Mapping) -> str:
            return await console_send(to=to, body=body, metadata=dict(metadata))

    return _ConsoleDriver()
