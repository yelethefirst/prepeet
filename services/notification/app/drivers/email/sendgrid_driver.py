from __future__ import annotations
import httpx
from typing import Optional, Mapping
from app.core.logging import logger

class SendGridDriver:
    def __init__(self, api_key: str, sender: str):
        self.api_key = api_key
        self.sender = sender
        self._client: httpx.AsyncClient | None = None

    async def __aenter__(self):
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url="https://api.sendgrid.com/v3",
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                timeout=10.0,
            )
        return self

    async def __aexit__(self, exc_type, exc, tb):
        if self._client:
            await self._client.aclose()
            self._client = None

    async def send(self, to: str, subject: str, html: Optional[str], text: Optional[str], metadata: Mapping) -> str:
        client = self._client or httpx.AsyncClient(
            base_url="https://api.sendgrid.com/v3",
            headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
            timeout=10.0,
        )
        created_here = client is not self._client

        data = {
            "personalizations": [{"to": [{"email": to}]}],
            "from": {"email": self.sender},
            "subject": subject,
            "content": [],
        }
        if text:
            data["content"].append({"type": "text/plain", "value": text})
        if html:
            data["content"].append({"type": "text/html", "value": html})

        try:
            resp = await client.post("/mail/send", json=data)
            resp.raise_for_status()
            message_id = resp.headers.get("x-message-id", "sendgrid-unknown")
            logger.info("sendgrid.send", to=to, message_id=message_id)
            return message_id
        finally:
            if created_here:
                await client.aclose()
