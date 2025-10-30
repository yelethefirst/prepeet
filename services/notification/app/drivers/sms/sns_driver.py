from __future__ import annotations
import boto3
import asyncio
from typing import Mapping
from botocore.exceptions import BotoCoreError, ClientError
from app.core.logging import logger


class SNSDriver:
    def __init__(self, region: str):
        self.region = region
        self.client = boto3.client("sns", region_name=region)

    async def send(self, to: str, body: str, metadata: Mapping) -> str:
        loop = asyncio.get_running_loop()
        try:
            result = await loop.run_in_executor(
                None, lambda: self.client.publish(PhoneNumber=to, Message=body)
            )
            message_id = result["MessageId"]
            logger.info("sns.send", to=to, message_id=message_id)
            return message_id
        except (BotoCoreError, ClientError) as e:
            logger.error("sns.error", to=to, error=str(e))
            raise
