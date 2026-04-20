"""
Rate limiting middleware with Redis backend (falls back to in-memory for local dev).
"""

import logging
import time
from collections import defaultdict
from typing import Any

from fastapi import HTTPException, Request, status
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

logger = logging.getLogger(__name__)


def _get_redis_client():
    """Try to connect to Redis. Returns None if unavailable."""
    try:
        import redis

        from app.core.config import get_settings

        settings = get_settings()
        client = redis.from_url(settings.redis_url, decode_responses=True, socket_connect_timeout=1)
        client.ping()
        return client
    except Exception:
        return None


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Sliding-window rate limiter.
    Uses Redis when available (production), falls back to in-memory (dev).
    Default: 100 requests per 60 seconds per IP.
    """

    def __init__(self, app: Any, max_requests: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._redis = _get_redis_client()
        self._store: dict[str, list[float]] = defaultdict(list)

        if self._redis:
            logger.info("Rate limiter: using Redis backend")
        else:
            logger.info("Rate limiter: using in-memory backend (Redis unavailable)")

    def _check_redis(self, client_ip: str) -> tuple[bool, int]:
        """Check rate limit via Redis sorted set. Returns (allowed, remaining)."""
        key = f"ratelimit:{client_ip}"
        now = time.time()
        cutoff = now - self.window_seconds

        pipe = self._redis.pipeline()
        pipe.zremrangebyscore(key, 0, cutoff)
        pipe.zadd(key, {str(now): now})
        pipe.zcard(key)
        pipe.expire(key, self.window_seconds)
        results = pipe.execute()

        count = results[2]
        remaining = max(0, self.max_requests - count)
        return count <= self.max_requests, remaining

    def _check_memory(self, client_ip: str) -> tuple[bool, int]:
        """Fallback in-memory check."""
        now = time.time()
        cutoff = now - self.window_seconds
        self._store[client_ip] = [t for t in self._store[client_ip] if t > cutoff]

        if len(self._store[client_ip]) >= self.max_requests:
            return False, 0

        self._store[client_ip].append(now)
        return True, self.max_requests - len(self._store[client_ip])

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        client_ip = request.client.host if request.client else "unknown"

        if self._redis:
            try:
                allowed, remaining = self._check_redis(client_ip)
            except Exception:
                # Redis error – fall back to memory
                allowed, remaining = self._check_memory(client_ip)
        else:
            allowed, remaining = self._check_memory(client_ip)

        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later.",
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
