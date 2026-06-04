"""
JWT creation & verification utilities.

Tokens carry a `jti` claim so they can be added to a Redis denylist on logout
or rotation. See `app/services/token_store.py`.
"""

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt

from app.core.config import get_settings

settings = get_settings()


def _new_jti() -> str:
    return uuid.uuid4().hex


def create_access_token(
    data: dict[str, Any],
    expires_delta: timedelta | None = None,
) -> tuple[str, str, int]:
    """Returns (token, jti, expires_in_seconds)."""
    to_encode = data.copy()
    delta = expires_delta or timedelta(minutes=settings.jwt_access_token_expire_minutes)
    expire = datetime.now(UTC) + delta
    jti = _new_jti()
    to_encode.update({"exp": expire, "type": "access", "jti": jti})
    token = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return token, jti, int(delta.total_seconds())


def create_refresh_token(data: dict[str, Any]) -> tuple[str, str, int]:
    """Returns (token, jti, expires_in_seconds)."""
    to_encode = data.copy()
    delta = timedelta(days=settings.jwt_refresh_token_expire_days)
    expire = datetime.now(UTC) + delta
    jti = _new_jti()
    to_encode.update({"exp": expire, "type": "refresh", "jti": jti})
    token = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return token, jti, int(delta.total_seconds())


def decode_token(token: str) -> Any:
    """Decode and verify a JWT. Raises JWTError on failure."""
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        return payload
    except JWTError:
        raise


def remaining_ttl(payload: dict[str, Any]) -> int:
    """Seconds left on a decoded token, clamped to >=0."""
    exp = payload.get("exp")
    if exp is None:
        return 0
    now = datetime.now(UTC).timestamp()
    return max(0, int(exp - now))
