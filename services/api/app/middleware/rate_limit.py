"""
Rate limiting middleware with Redis backend (falls back to in-memory for local dev).

Two flavours:
  - `RateLimitMiddleware`: global per-IP cap, mounted in app/main.py.
  - `route_limit(...)`: FastAPI dependency for per-endpoint caps. Use on
    sensitive routes (login, OTP, signup-check) where the global limit is too
    permissive. Honours the same Redis backend; falls back to in-memory.
"""

import asyncio
import logging
import time
from collections import defaultdict
from typing import Any

from fastapi import HTTPException, Request, status
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import JSONResponse, Response

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
        """Check rate limit via Redis sorted set. Returns (allowed, remaining).

        NOTE: This is a synchronous method intentionally – it is always called
        via asyncio.get_running_loop().run_in_executor() so it never blocks
        the event loop.
        """
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
                # Run the synchronous Redis pipeline in a thread pool so it
                # never blocks the asyncio event loop. Blocking the event loop
                # here caused ERR_EMPTY_RESPONSE on concurrent requests during
                # page load (later requests had their connections dropped while
                # the loop was stalled on the Redis I/O).
                loop = asyncio.get_running_loop()
                allowed, remaining = await loop.run_in_executor(
                    None, self._check_redis, client_ip
                )
            except Exception:
                # Redis error – fall back to memory
                allowed, remaining = self._check_memory(client_ip)
        else:
            allowed, remaining = self._check_memory(client_ip)

        if not allowed:
            # Return a plain JSONResponse rather than raising HTTPException.
            # Raising inside BaseHTTPMiddleware bypasses all outer middleware
            # (including CORSMiddleware), resulting in responses with no
            # Access-Control-Allow-Origin header.
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Rate limit exceeded. Please try again later."},
            )

        # Wrap call_next: if a route raises and the exception propagates back
        # through this BaseHTTPMiddleware, Starlette's ServerErrorMiddleware
        # (which sits ABOVE CORSMiddleware) returns a bare 500 with no CORS
        # headers — the browser then reports a misleading CORS error.
        try:
            response = await call_next(request)
        except Exception:
            logger.exception(
                "Unhandled exception in route %s %s", request.method, request.url.path
            )
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "Internal server error",
                    "code": "INTERNAL_ERROR",
                    "request_id": getattr(request.state, "request_id", None),
                },
            )

        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response


# ── Per-endpoint limiter ────────────────────────────────────────────────────

_route_memory: dict[str, list[float]] = defaultdict(list)


def _route_check(scope: str, max_requests: int, window_seconds: int) -> bool:
    """Returns True if the request is allowed."""
    now = time.time()
    cutoff = now - window_seconds

    # Try Redis (lazily; reuses the module-level _get_redis_client by re-calling).
    redis = _get_redis_client()
    if redis is not None:
        try:
            key = f"ratelimit:route:{scope}"
            pipe = redis.pipeline()
            pipe.zremrangebyscore(key, 0, cutoff)
            pipe.zadd(key, {str(now): now})
            pipe.zcard(key)
            pipe.expire(key, window_seconds)
            results = pipe.execute()
            return int(results[2]) <= max_requests
        except Exception:
            logger.exception("route_limit: Redis error, falling back to memory")

    # Memory fallback
    _route_memory[scope] = [t for t in _route_memory[scope] if t > cutoff]
    if len(_route_memory[scope]) >= max_requests:
        return False
    _route_memory[scope].append(now)
    return True


def route_limit(*, name: str, max_requests: int, window_seconds: int):
    """FastAPI dependency factory for per-endpoint rate limiting.

    Keyed by (route name, client IP). Use on auth-adjacent endpoints — login,
    OTP request/verify, and email-existence check — to stop credential
    stuffing and enumeration without affecting normal browsing.

    Example:
        @router.post("/login", dependencies=[Depends(route_limit(
            name="auth.login", max_requests=10, window_seconds=60
        ))])
    """

    async def _dep(request: Request) -> None:
        ip = request.client.host if request.client else "unknown"
        scope = f"{name}:{ip}"
        loop = asyncio.get_running_loop()
        allowed = await loop.run_in_executor(
            None, _route_check, scope, max_requests, window_seconds
        )
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please slow down and try again shortly.",
            )

    return _dep

