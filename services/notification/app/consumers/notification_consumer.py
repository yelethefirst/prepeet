from __future__ import annotations

import asyncio
import json
import os
from typing import Iterable

import aio_pika
from aio_pika.abc import AbstractIncomingMessage

from app.core.logging import logger
from app.core.settings import settings
from app.schemas.message import MessageIn
from app.services.dispatcher import dispatch
from app.core.exceptions import (ValidationError, ThrottleExceeded, DuplicateMessage, ChannelDisabled, ProviderError)

PREFETCH = int(os.getenv("NOTIFY_CONSUMER_PREFETCH", "16"))

QUEUES: Iterable[str] = (
    settings.queue_high,
    settings.queue_normal,
    settings.queue_low,
    settings.queue_email,  # optional dedicated channel queues
    settings.queue_sms,
)

async def handle_message(msg: AbstractIncomingMessage) -> None:
    try:
        payload = json.loads(msg.body.decode("utf-8"))
        message = MessageIn.model_validate(payload)
        result = await dispatch(message)
        logger.info("consumer.sent", result=result)
        await msg.ack()
    except DuplicateMessage:
        logger.info("consumer.duplicate")
        await msg.ack()
    except ThrottleExceeded as e:
        logger.warning("consumer.throttled", error=str(e))
        # Requeue with small delay? Here we just nack without requeue.
        await msg.nack(requeue=False)
    except ChannelDisabled as e:
        logger.error("consumer.channel_disabled", error=str(e))
        await msg.ack()
    except ValidationError as e:
        logger.error("consumer.validation_error", error=str(e))
        await msg.ack()
    except ProviderError as e:
        logger.error("consumer.provider_error", error=str(e))
        # Could requeue to allow retry; for now, nack to DLQ (if bound)
        await msg.nack(requeue=False)
    except Exception as e:
        logger.exception("consumer.unexpected_error", error=str(e))
        await msg.nack(requeue=False)

async def main() -> None:
    logger.info("consumer.starting", queues=list(QUEUES))
    connection = await aio_pika.connect_robust(settings.amqp_url)
    async with connection:
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=PREFETCH)

        # Declare queues (safe if already exist)
        queues = []
        for name in QUEUES:
            q = await channel.declare_queue(name, durable=True, arguments={"x-queue-mode": "lazy"})
            queues.append(q)

        # Start consuming
        for q in queues:
            await q.consume(handle_message, no_ack=False)
            logger.info("consumer.bound", queue=q.name)

        logger.info("consumer.ready")
        # Run forever
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
