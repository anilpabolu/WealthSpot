"""
JWT denylist + refresh-token rotation backed by Redis.

The access token carries a `jti` claim. On logout (or compromise) we add the jti
to a denylist with TTL equal to the remaining token lifetime — `is_revoked()`
checks that key. Refresh tokens are stored once-per-user; presenting a refresh
token whose jti is not the current one rotates it, but reuse triggers a full
session invalidation (suspected token theft).

Falls back to an in-memory dict when Redis is unavailable so dev / tests still
work — never relied on in production.
"""

from __future__ import annotations

import logging
import time
from typing import Any

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_REVOKED_PREFIX = "jwt:revoked:"
_REFRESH_PREFIX = "jwt:refresh:"

_redis_client: Any = None
_memory_store: dict[str, tuple[str, float]] = {}


def _get_redis() -> Any:
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    try:
        import redis

        settings = get_settings()
        client = redis.from_url(settings.redis_url, decode_responses=True, socket_connect_timeout=1)
        client.ping()
        _redis_client = client
        return client
    except Exception:
        logger.warning("token_store: Redis unavailable, falling back to in-memory denylist")
        return None


def _now() -> float:
    return time.time()


def _gc_memory() -> None:
    now = _now()
    expired = [k for k, (_, exp) in _memory_store.items() if exp <= now]
    for k in expired:
        _memory_store.pop(k, None)


def revoke(jti: str, ttl_seconds: int) -> None:
    """Add jti to the denylist. ttl_seconds should be the token's remaining lifetime."""
    if ttl_seconds <= 0:
        return
    redis = _get_redis()
    if redis is not None:
        try:
            redis.setex(f"{_REVOKED_PREFIX}{jti}", ttl_seconds, "1")
            return
        except Exception:
            logger.exception("token_store.revoke: Redis error, falling back to memory")
    _gc_memory()
    _memory_store[f"{_REVOKED_PREFIX}{jti}"] = ("1", _now() + ttl_seconds)


def is_revoked(jti: str) -> bool:
    if not jti:
        return False
    redis = _get_redis()
    if redis is not None:
        try:
            return bool(redis.exists(f"{_REVOKED_PREFIX}{jti}"))
        except Exception:
            logger.exception("token_store.is_revoked: Redis error, falling back to memory")
    _gc_memory()
    return f"{_REVOKED_PREFIX}{jti}" in _memory_store


def set_current_refresh(user_id: str, jti: str, ttl_seconds: int) -> None:
    """Record the user's currently-active refresh-token jti."""
    redis = _get_redis()
    if redis is not None:
        try:
            redis.setex(f"{_REFRESH_PREFIX}{user_id}", ttl_seconds, jti)
            return
        except Exception:
            logger.exception("token_store.set_current_refresh: Redis error")
    _gc_memory()
    _memory_store[f"{_REFRESH_PREFIX}{user_id}"] = (jti, _now() + ttl_seconds)


def get_current_refresh(user_id: str) -> Any:
    redis = _get_redis()
    if redis is not None:
        try:
            return redis.get(f"{_REFRESH_PREFIX}{user_id}")
        except Exception:
            logger.exception("token_store.get_current_refresh: Redis error")
    _gc_memory()
    entry = _memory_store.get(f"{_REFRESH_PREFIX}{user_id}")
    return entry[0] if entry else None


def clear_user_sessions(user_id: str) -> None:
    """Invalidate all sessions for a user (clears refresh-token pointer)."""
    redis = _get_redis()
    if redis is not None:
        try:
            redis.delete(f"{_REFRESH_PREFIX}{user_id}")
            return
        except Exception:
            logger.exception("token_store.clear_user_sessions: Redis error")
    _memory_store.pop(f"{_REFRESH_PREFIX}{user_id}", None)
