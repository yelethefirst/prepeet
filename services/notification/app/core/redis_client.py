from __future__ import annotations

import asyncio
from typing import Optional
import redis.asyncio as redis
from .settings import settings

_redis: Optional[redis.Redis] = None


def get_redis() -> redis.Redis:
    global _redis
    if _redis is None:
        _redis = redis.from_url(settings.redis_url, decode_responses=True)
    return _redis


# -------- Idempotency helpers --------
async def idem_check_and_set(key: str, ttl_seconds: int | None = None) -> bool:
    """Return True if we set the idempotency key (i.e., it did not exist)."""
    ttl = ttl_seconds or settings.idem_ttl_seconds
    r = get_redis()
    return await r.set(name=f"idem:{key}", value="1", ex=ttl, nx=True) is True


# -------- Token bucket (throttle) --------
async def token_bucket_allow(key: str, capacity: int, refill_per_min: int) -> bool:
    """
    Simple token bucket using redis.
    - key: bucket key
    - capacity: max tokens
    - refill_per_min: tokens added per minute
    """
    r = get_redis()
    # Use a Lua script for atomicity (set default values and refill by time)
    lua = """
local k = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local data = redis.call("HMGET", k, "tokens", "ts")
local tokens = tonumber(data[1])
local ts = tonumber(data[2])

if tokens == nil then
  tokens = capacity
  ts = now
else
  local elapsed = now - ts
  local add = math.floor(elapsed * (refill / 60.0))
  if add > 0 then
    tokens = math.min(capacity, tokens + add)
    ts = now
  end
end

if tokens > 0 then
  tokens = tokens - 1
  redis.call("HMSET", k, "tokens", tokens, "ts", ts)
  redis.call("EXPIRE", k, 120) -- keep hot for 2 minutes
  return 1
else
  redis.call("HMSET", k, "tokens", tokens, "ts", ts)
  redis.call("EXPIRE", k, 120)
  return 0
end
"""
    now = int(asyncio.get_event_loop().time())
    res = await r.eval(lua, 1, f"tb:{key}", capacity, refill_per_min, now)
    return res == 1
