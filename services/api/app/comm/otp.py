"""Redis-backed OTP submodule.

- Live OTPs in Redis with TTL; cold archive written to `comm.otp_archive`.
- Sliding-window rate limits (per phone, per IP).
- Constant-time comparison via `hmac.compare_digest`.
"""

from __future__ import annotations

import hashlib
import hmac
import logging
import secrets
import string
import time as _time
from dataclasses import dataclass
from typing import Literal

import redis as redis_sync

from app.comm.exceptions import OtpInvalid, OtpRateLimited
from app.core.config import get_settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration knobs
# ---------------------------------------------------------------------------

OTP_LENGTH_DEFAULT = 6
OTP_TTL_SECONDS_DEFAULT = 5 * 60
OTP_MAX_ATTEMPTS_DEFAULT = 3

RATE_PHONE_PER_MIN = 5
RATE_PHONE_WINDOW = 60
RATE_IP_PER_MIN = 20
RATE_IP_WINDOW = 60


@dataclass(slots=True)
class OtpResult:
    code: str
    ttl_seconds: int
    delivery: Literal["sms", "voice", "whatsapp", "email", "stub"]


# ---------------------------------------------------------------------------
# Redis client
# ---------------------------------------------------------------------------


def _redis() -> redis_sync.Redis:
    settings = get_settings()
    return redis_sync.Redis.from_url(settings.redis_url, decode_responses=True)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _hash_phone(phone: str) -> str:
    return hashlib.sha256(phone.encode()).hexdigest()


def _hash_code(code: str, salt: str) -> str:
    return hmac.new(salt.encode(), code.encode(), hashlib.sha256).hexdigest()


def _otp_key(purpose: str, phone_hash: str) -> str:
    return f"comm:otp:{purpose}:{phone_hash}"


def _rate_key(prefix: str, identifier: str) -> str:
    return f"comm:rl:{prefix}:{identifier}"


def _generate_code(length: int = OTP_LENGTH_DEFAULT, *, alphanumeric: bool = False) -> str:
    if alphanumeric:
        alphabet = string.ascii_uppercase + string.digits
        return "".join(secrets.choice(alphabet) for _ in range(length))
    return "".join(secrets.choice(string.digits) for _ in range(length))


# ---------------------------------------------------------------------------
# Rate limiting (sliding window via Redis sorted sets)
# ---------------------------------------------------------------------------


def _check_rate(prefix: str, identifier: str, *, limit: int, window_s: int) -> None:
    """Sliding-window rate check. Raises OtpRateLimited on breach."""
    if not identifier:
        return
    key = _rate_key(prefix, identifier)
    r = _redis()
    now_ms = int(_time.time() * 1000)
    pipe = r.pipeline(transaction=False)
    pipe.zremrangebyscore(key, 0, now_ms - window_s * 1000)
    pipe.zcard(key)
    pipe.zadd(key, {f"{now_ms}-{secrets.token_hex(4)}": now_ms})
    pipe.expire(key, window_s)
    _, count, _, _ = pipe.execute()
    if count >= limit:
        raise OtpRateLimited(f"rate limit exceeded for {prefix}:{identifier[:6]}…")


# ---------------------------------------------------------------------------
# Issue / verify
# ---------------------------------------------------------------------------


def issue_otp(
    *,
    purpose: str,
    phone: str,
    ip: str | None = None,
    length: int = OTP_LENGTH_DEFAULT,
    ttl_seconds: int = OTP_TTL_SECONDS_DEFAULT,
    alphanumeric: bool = False,
) -> str:
    """Generate, store (Redis), and return an OTP code for `phone`.

    The code is stored as a salted HMAC hash so a Redis dump never leaks
    plaintext OTPs.
    """
    _check_rate("phone", _hash_phone(phone), limit=RATE_PHONE_PER_MIN, window_s=RATE_PHONE_WINDOW)
    if ip:
        _check_rate("ip", ip, limit=RATE_IP_PER_MIN, window_s=RATE_IP_WINDOW)

    code = _generate_code(length, alphanumeric=alphanumeric)
    salt = secrets.token_hex(16)
    code_hash = _hash_code(code, salt)
    phone_hash = _hash_phone(phone)
    key = _otp_key(purpose, phone_hash)

    r = _redis()
    r.hset(
        key,
        mapping={
            "hash": code_hash,
            "salt": salt,
            "attempts": 0,
            "purpose": purpose,
            "issued_at": int(_time.time()),
        },
    )
    r.expire(key, ttl_seconds)
    return code


def verify_otp(
    *,
    purpose: str,
    phone: str,
    code: str,
    max_attempts: int = OTP_MAX_ATTEMPTS_DEFAULT,
) -> bool:
    """Verify an OTP. Single-use: a successful verify deletes the key."""
    phone_hash = _hash_phone(phone)
    key = _otp_key(purpose, phone_hash)
    r = _redis()
    data: dict[str, str] = r.hgetall(key)  # type: ignore[assignment]
    if not data:
        raise OtpInvalid("OTP expired or never issued")

    attempts = int(data.get("attempts", 0))
    if attempts >= max_attempts:
        r.delete(key)
        raise OtpInvalid("Too many incorrect attempts")

    expected_hash = data.get("hash", "")
    salt = data.get("salt", "")
    candidate_hash = _hash_code(code, salt)

    if not hmac.compare_digest(expected_hash, candidate_hash):
        r.hincrby(key, "attempts", 1)
        raise OtpInvalid("Incorrect OTP")

    r.delete(key)
    return True
