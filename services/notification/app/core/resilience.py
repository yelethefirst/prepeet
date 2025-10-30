from __future__ import annotations

import time
from typing import Awaitable, Callable, Any
from tenacity import retry, stop_after_attempt, wait_exponential_jitter, retry_if_exception_type
from app.core.logging import logger
from app.core.metrics import notifications_retry_total, provider_circuit_open


class CircuitBreaker:
    """
    Simple in-memory circuit breaker per (channel, provider).
    - opens after 'fail_threshold' failures within 'window_sec'
    - half-open after 'cooldown_sec' and allows 'half_open_max_calls' trial calls
    """

    def __init__(
        self,
        channel: str,
        provider: str,
        fail_threshold: int = 5,
        window_sec: int = 30,
        cooldown_sec: int = 20,
        half_open_max_calls: int = 2,
    ):
        self.channel = channel
        self.provider = provider
        self.fail_threshold = fail_threshold
        self.window_sec = window_sec
        self.cooldown_sec = cooldown_sec
        self.half_open_max_calls = half_open_max_calls

        self._state = "CLOSED"  # CLOSED | OPEN | HALF_OPEN
        self._fail_times: list[float] = []
        self._opened_at = 0.0
        self._half_open_calls = 0

    def _prune(self) -> None:
        now = time.monotonic()
        self._fail_times = [t for t in self._fail_times if now - t <= self.window_sec]

    def record_success(self) -> None:
        self._fail_times.clear()
        if self._state in ("OPEN", "HALF_OPEN"):
            logger.info("breaker.close", channel=self.channel, provider=self.provider)
        self._state = "CLOSED"
        self._half_open_calls = 0

    def record_failure(self) -> None:
        self._prune()
        self._fail_times.append(time.monotonic())
        if self._state == "HALF_OPEN":
            # any failure in half-open -> open again
            self._state = "OPEN"
            self._opened_at = time.monotonic()
            provider_circuit_open.labels(self.channel, self.provider).inc()
            logger.warning("breaker.open", channel=self.channel, provider=self.provider, reason="half-open-fail")
            return

        if self._state == "CLOSED" and len(self._fail_times) >= self.fail_threshold:
            self._state = "OPEN"
            self._opened_at = time.monotonic()
            provider_circuit_open.labels(self.channel, self.provider).inc()
            logger.warning("breaker.open", channel=self.channel, provider=self.provider, reason="threshold")

    def allow_call(self) -> bool:
        now = time.monotonic()
        if self._state == "CLOSED":
            return True
        if self._state == "OPEN":
            if (now - self._opened_at) >= self.cooldown_sec:
                self._state = "HALF_OPEN"
                self._half_open_calls = 0
                return True
            return False
        if self._state == "HALF_OPEN":
            if self._half_open_calls < self.half_open_max_calls:
                self._half_open_calls += 1
                return True
            return False
        return False


# Registry of breakers per (channel, provider)
_BREAKERS: dict[tuple[str, str], CircuitBreaker] = {}

def get_breaker(channel: str, provider: str) -> CircuitBreaker:
    key = (channel, provider)
    if key not in _BREAKERS:
        _BREAKERS[key] = CircuitBreaker(channel, provider)
    return _BREAKERS[key]


async def call_with_resilience(
    *,
    channel: str,
    provider: str,
    template_id: str,
    tenant: str | None,
    func: Callable[..., Awaitable[Any]],
    on_retry: Callable[[], None] | None = None,
    **kwargs: Any,
) -> Any:
    """
    Wraps a driver call with:
    - circuit breaker gate
    - tenacity retries (exponential backoff with jitter)
    - metrics on retries and circuit open events (incremented elsewhere)
    """
    breaker = get_breaker(channel, provider)

    if not breaker.allow_call():
        raise RuntimeError(f"Circuit open for provider={provider} channel={channel}")

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_exponential_jitter(initial=0.3, max=3.0),
        retry=retry_if_exception_type((Exception,)),  # be explicit if you want to narrow
        before_sleep=lambda rs: on_retry and on_retry(),
    )
    async def _do():
        try:
            return await func(**kwargs)
        except Exception:
            breaker.record_failure()
            raise
        else:
            breaker.record_success()

    result = await _do()
    breaker.record_success()
    return result


def mark_retry_metric(channel: str, provider: str, tenant: str | None, template_id: str) -> None:
    notifications_retry_total.labels(
        channel=channel, provider=provider, tenant=tenant or "n/a", template_id=template_id
    ).inc()
