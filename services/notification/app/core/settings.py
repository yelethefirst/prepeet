from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Literal, List, Dict, Optional


class Settings(BaseSettings):
    # App
    env: Literal["local", "dev", "staging", "prod"] = "local"
    app_name: str = "Prepeet Notification"
    app_version: str = "0.1.0"

    # Networking
    host: str = "0.0.0.0"
    port: int = 8000

    # Observability
    enable_metrics: bool = True
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    log_json: bool = True
    otel_enabled: bool = False
    otel_exporter_otlp_endpoint: Optional[str] = None

    # Redis (rate limits, idempotency, locks, shortlinks)
    redis_url: str = "redis://localhost:6379/0"

    # RabbitMQ
    amqp_url: str = "amqp://guest:guest@rabbitmq:5672/"
    queue_email: str = "notifications.email"
    queue_sms: str = "notifications.sms"
    queue_high: str = "notifications.high"
    queue_normal: str = "notifications.normal"
    queue_low: str = "notifications.low"
    queue_dlq_prefix: str = "notifications.dlq."

    # Templates
    templates_path: str = "app/templates"
    default_locale: str = "en-GB"

    # Channels / providers (driver names)
    email_backend: Literal["ses", "sendgrid", "console"] = "console"
    sms_backend: Literal["twilio", "sns", "console"] = "console"
    push_backend: Literal["fcm", "apns", "console"] = "console"

    # Email (SES / SendGrid)
    ses_region: str = "eu-west-2"
    ses_from: str = "no-reply@prepeet.local"
    sendgrid_api_key: Optional[str] = None

    # SMS (Twilio / SNS)
    twilio_sid: Optional[str] = None
    twilio_token: Optional[str] = None
    twilio_from: Optional[str] = None
    sns_region: str = "eu-west-2"

    # Idempotency / Security
    idem_ttl_seconds: int = 3600
    hmac_secret: str = "CHANGE_ME_IN_PROD"

    # Throttling (tenant / recipient default caps)
    throttle_default_per_minute: int = 120
    throttle_recipient_per_minute: int = 6

    db_url: str = "postgresql+asyncpg://notify:CHANGE_ME@localhost:5432/notification"

    # Multi-tenant toggles (allowlist of enabled channels per tenant if needed)
    tenant_channel_overrides: Dict[str, List[str]] = Field(default_factory=dict)

    model_config = SettingsConfigDict(env_prefix="NOTIFY_", case_sensitive=False)


settings = Settings()
