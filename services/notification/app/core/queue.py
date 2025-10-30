from __future__ import annotations

import json
import pika
from typing import Literal, Mapping
from .settings import settings
from .logging import logger


def _connection() -> pika.BlockingConnection:
    params = pika.URLParameters(settings.amqp_url)
    return pika.BlockingConnection(params)


def declare_queues() -> None:
    with _connection() as conn:
        ch = conn.channel()
        # Priority queues: you can bind producers to high/normal/low by policy or explicit routing
        for q in (settings.queue_high, settings.queue_normal, settings.queue_low,
                  settings.queue_email, settings.queue_sms):
            ch.queue_declare(queue=q, durable=True, arguments={"x-queue-mode": "lazy"})
        # DLQs are declared lazily by consumers when needed
        logger.info("queues.declared", queues=[settings.queue_high, settings.queue_normal, settings.queue_low,
                                               settings.queue_email, settings.queue_sms])


def publish(
    queue: str,
    message: Mapping,
    priority: Literal["high", "normal", "low"] | None = None,
    headers: dict | None = None,
) -> None:
    body = json.dumps(message).encode()
    with _connection() as conn:
        ch = conn.channel()
        props = pika.BasicProperties(
            delivery_mode=2,
            headers=headers or {},
            priority=0 if priority is None else {"low": 1, "normal": 5, "high": 9}[priority],
            content_type="application/json",
        )
        ch.basic_publish(exchange="", routing_key=queue, body=body, properties=props)
        logger.info("queue.publish", queue=queue, priority=priority or "n/a", bytes=len(body))
