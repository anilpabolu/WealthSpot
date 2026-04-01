"""
Request ID middleware – generates or forwards a unique request identifier
for every HTTP request, enabling distributed trace correlation.

The ID is:
1. Read from the incoming ``X-Request-ID`` header (if present and valid), or
2. Generated as a new UUID-4.

It is then:
- Stored in request.state for use by application code.
- Injected into the response as ``X-Request-ID``.
- Added to the Python logging context via a LogRecord filter so that all
  log messages emitted during the request lifetime include ``request_id``.
"""

import logging
import uuid
from contextvars import ContextVar

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

# Context variable accessible from any coroutine in the same request scope.
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="")

_UUID_HEX_LEN = 36  # max length to accept from the client header


class RequestIdFilter(logging.Filter):
    """Inject ``request_id`` into every log record."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_ctx.get("")  # type: ignore[attr-defined]
        return True


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Accept client-supplied ID if it looks like a UUID, otherwise generate.
        incoming = request.headers.get("X-Request-ID", "")
        if incoming and len(incoming) <= _UUID_HEX_LEN:
            rid = incoming
        else:
            rid = str(uuid.uuid4())

        request_id_ctx.set(rid)
        request.state.request_id = rid

        response = await call_next(request)
        response.headers["X-Request-ID"] = rid
        return response
