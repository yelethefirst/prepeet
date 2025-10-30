from __future__ import annotations
from fastapi import APIRouter, HTTPException, Header
from app.schemas.message import MessageIn, MessageQueued
from app.services.dispatcher import dispatch
from app.core.exceptions import (
    ValidationError, ThrottleExceeded, DuplicateMessage, ChannelDisabled, ProviderError
)

router = APIRouter(prefix="/api", tags=["notifications"])

@router.post("/notifications", response_model=dict)
async def post_notification(
    message: MessageIn,
    x_idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
):
    if x_idempotency_key and not message.idempotency_key:
        message.idempotency_key = x_idempotency_key

    try:
        result = await dispatch(message)
        return result
    except DuplicateMessage:
        return {"status": "duplicate"}
    except ThrottleExceeded as e:
        raise HTTPException(status_code=429, detail=str(e))
    except ChannelDisabled as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ProviderError as e:
        raise HTTPException(status_code=502, detail=str(e))

