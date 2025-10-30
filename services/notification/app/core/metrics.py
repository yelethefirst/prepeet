from __future__ import annotations
from prometheus_client import Counter, Histogram

# Generic
notifications_enqueued_total = Counter(
    "notifications_enqueued_total",
    "Total notifications enqueued/accepted by API",
    ["channel", "tenant"],
)

notifications_sent_total = Counter(
    "notifications_sent_total",
    "Total notifications sent successfully",
    ["channel", "provider", "tenant", "template_id"],
)

notifications_failed_total = Counter(
    "notifications_failed_total",
    "Total notifications failed",
    ["channel", "provider", "tenant", "template_id", "reason"],
)

notifications_retry_total = Counter(
    "notifications_retry_total",
    "Total send retries",
    ["channel", "provider", "tenant", "template_id"],
)

send_latency_seconds = Histogram(
    "notifications_send_latency_seconds",
    "Time to send (driver call duration)",
    ["channel", "provider"],
    buckets=(0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 30),
)

# Circuit breaker
provider_circuit_open = Counter(
    "provider_circuit_open_total",
    "Count of circuit openings",
    ["channel", "provider"],
)
