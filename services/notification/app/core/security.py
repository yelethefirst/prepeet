from __future__ import annotations

import base64
import hmac
import hashlib
import time
from urllib.parse import urlencode, quote_plus
from .settings import settings


def sign_payload(payload: str) -> str:
    sig = hmac.new(settings.hmac_secret.encode(), payload.encode(), hashlib.sha256).digest()
    return base64.urlsafe_b64encode(sig).rstrip(b"=").decode()


def verify_signature(payload: str, signature: str) -> bool:
    expected = sign_payload(payload)
    return hmac.compare_digest(expected, signature)


def make_unsubscribe_link(tenant_id: str, address: str, category: str, expires_in_sec: int = 3600) -> str:
    ts = int(time.time()) + expires_in_sec
    payload = f"{tenant_id}:{address}:{category}:{ts}"
    sig = sign_payload(payload)
    query = urlencode({"t": tenant_id, "a": address, "c": category, "ts": ts, "sig": sig}, quote_via=quote_plus)
    return f"/api/unsubscribe?{query}"
