from __future__ import annotations

class NotificationError(Exception):
    """Base error for notification-svc."""

class ValidationError(NotificationError):
    """Invalid payload or missing data."""

class ThrottleExceeded(NotificationError):
    """Rate limit exceeded."""

class DuplicateMessage(NotificationError):
    """Idempotency duplicate."""

class ChannelDisabled(NotificationError):
    """Channel disabled for tenant."""

class ProviderError(NotificationError):
    """Provider driver failed."""
