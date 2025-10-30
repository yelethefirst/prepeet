from __future__ import annotations
import httpx
from typing import Mapping
from app.core.logging import logger

class TwilioDriver:
    def __init__(self, sid: str, token: str, from_: str):
        self.sid = sid
        self.token = token
        self.from_ = from_
        self._client: httpx.AsyncClient | None = None
        self.base_url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}"

    async def __aenter__(self):
        if self._client is None:
            self._client = httpx.AsyncClient(auth=(self.sid, self.token), timeout=10.0)
        return self

    async def __aexit__(self, exc_type, exc, tb):
        if self._client:
            await self._client.aclose()
            self._client = None

    async def send(self, to: str, body: str, metadata: Mapping) -> str:
        client = self._client or httpx.AsyncClient(auth=(self.sid, self.token), timeout=10.0)
        created_here = client is not self._client
        try:
            resp = await client.post(f"{self.base_url}/Messages.json", data={"To": to, "From": self.from_, "Body": body})
            resp.raise_for_status()
            data = resp.json()
            sid = data.get("sid", "unknown")
            logger.info("twilio.send", to=to, sid=sid)
            return sid
        finally:
            if created_here:
                await client.aclose()
