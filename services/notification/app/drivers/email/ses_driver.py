from __future__ import annotations
import boto3
import asyncio
from typing import Optional, Mapping
from botocore.exceptions import BotoCoreError, ClientError
from app.core.logging import logger


class SESDriver:
    def __init__(self, region: str, sender: str):
        self.region = region
        self.sender = sender
        self.client = boto3.client("ses", region_name=region)

    async def send(
        self,
        to: str,
        subject: str,
        html: Optional[str],
        text: Optional[str],
        metadata: Mapping,
    ) -> str:
        """
        Send an email via SES (with text and/or HTML parts).
        Returns SES MessageId.
        """
        body = {}
        if html:
            body["Html"] = {"Data": html, "Charset": "UTF-8"}
        if text:
            body["Text"] = {"Data": text, "Charset": "UTF-8"}

        msg = {
            "Source": self.sender,
            "Destination": {"ToAddresses": [to]},
            "Message": {
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": body,
            },
        }

        loop = asyncio.get_running_loop()
        try:
            result = await loop.run_in_executor(None, lambda: self.client.send_email(**msg))
            message_id = result["MessageId"]
            logger.info("ses.send", to=to, message_id=message_id)
            return message_id
        except (BotoCoreError, ClientError) as e:
            logger.error("ses.error", to=to, error=str(e))
            raise
