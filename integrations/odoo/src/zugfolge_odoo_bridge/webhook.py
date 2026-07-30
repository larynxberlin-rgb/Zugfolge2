from __future__ import annotations

from hashlib import sha256
import hmac
import time


class InvalidWebhook(ValueError):
    pass


class IdempotencyConflict(ValueError):
    pass


def _signed_payload(timestamp_seconds: int, body: bytes) -> bytes:
    return str(timestamp_seconds).encode("ascii") + b"." + body


def sign_webhook(secret: bytes, timestamp_seconds: int, body: bytes) -> str:
    if len(secret) < 32:
        raise ValueError("webhook secret must contain at least 32 bytes")
    digest = hmac.new(
        secret,
        _signed_payload(timestamp_seconds, body),
        sha256,
    ).hexdigest()
    return f"v1={digest}"


def verify_webhook(
    *,
    secret: bytes,
    timestamp_seconds: int,
    body: bytes,
    signature: str,
    now_seconds: int | None = None,
    tolerance_seconds: int = 300,
) -> None:
    if tolerance_seconds <= 0:
        raise ValueError("tolerance_seconds must be positive")
    current_time = int(time.time()) if now_seconds is None else now_seconds
    if abs(current_time - timestamp_seconds) > tolerance_seconds:
        raise InvalidWebhook("webhook timestamp is outside the replay window")
    expected = sign_webhook(secret, timestamp_seconds, body)
    if not hmac.compare_digest(expected, signature):
        raise InvalidWebhook("webhook signature is invalid")


class IdempotencyInbox:
    """In-memory contract oracle; production persists this before queueing."""

    def __init__(self) -> None:
        self._digests: dict[str, str] = {}

    def accept(self, message_id: str, body: bytes) -> bool:
        if not message_id.strip():
            raise ValueError("message_id is required")
        digest = sha256(body).hexdigest()
        existing = self._digests.get(message_id)
        if existing is None:
            self._digests[message_id] = digest
            return True
        if existing != digest:
            raise IdempotencyConflict(
                "message_id was reused with a different payload"
            )
        return False
