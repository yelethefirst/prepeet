from __future__ import annotations

import logging
import sys
import structlog
from .settings import settings


def configure_logging() -> None:
    timestamper = structlog.processors.TimeStamper(fmt="iso", utc=True)

    shared_processors = [
        timestamper,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    if settings.log_json:
        renderer = structlog.processors.JSONRenderer()
    else:
        renderer = structlog.dev.ConsoleRenderer()

    structlog.configure(
        processors=shared_processors + [renderer],
        wrapper_class=structlog.make_filtering_bound_logger(getattr(logging, settings.log_level)),
        context_class=dict,
        cache_logger_on_first_use=True,
    )

    # Also set stdlib root logger level/handler so libraries respect it
    root = logging.getLogger()
    root.setLevel(getattr(logging, settings.log_level))
    handler = logging.StreamHandler(sys.stdout)
    root.handlers = [handler]


logger = structlog.get_logger("notification")
