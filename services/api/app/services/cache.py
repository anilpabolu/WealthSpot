"""
Simple Redis cache utility for expensive computations (XIRR, analytics).
Falls back gracefully if Redis is unavailable.
"""

import hashlib
import json
import logging
from typing import Any

import redis

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_redis_client: redis.Redis | None = None


def _get_redis() -> redis.Redis | None:
    global _redis_client
    if _redis_client is None:
        try:
            settings = get_settings()
            _redis_client = redis.from_url(
                settings.redis_url, socket_connect_timeout=2, decode_responses=True,
            )
            _redis_client.ping()
        except Exception:
            logger.debug("Redis unavailable for caching — operating without cache")
            _redis_client = None
    return _redis_client


def cache_get(key: str) -> Any | None:
    """Get a JSON-deserialised value from Redis cache."""
    r = _get_redis()
    if r is None:
        return None
    try:
        raw = r.get(key)
        return json.loads(raw) if raw else None
    except Exception:
        return None


def cache_set(key: str, value: Any, ttl_seconds: int = 300) -> None:
    """Set a JSON-serialised value in Redis cache with TTL."""
    r = _get_redis()
    if r is None:
        return
    try:
        r.setex(key, ttl_seconds, json.dumps(value, default=str))
    except Exception:
        pass


def make_cache_key(prefix: str, *parts: str) -> str:
    """Build a deterministic cache key from prefix + variable parts."""
    raw = ":".join(str(p) for p in parts)
    digest = hashlib.sha256(raw.encode()).hexdigest()[:16]
    return f"ws:{prefix}:{digest}"
