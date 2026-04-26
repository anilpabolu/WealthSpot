"""
Prometheus metrics middleware for request tracking.
Exposes /metrics endpoint for Prometheus scraping.
"""

import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, PlainTextResponse, Response

_logger = logging.getLogger("app.slow_requests")
_SLOW_REQUEST_THRESHOLD = 2.0  # seconds

# Simple metrics counters (no external dependency required)
_request_count: dict[str, int] = {}
_request_errors: dict[str, int] = {}
_request_duration_sum: dict[str, float] = {}
_request_duration_count: dict[str, int] = {}


def _label(method: str, path: str, status: int) -> str:
    # Normalize path to avoid high-cardinality labels
    parts = path.rstrip("/").split("/")
    normalized = []
    for part in parts:
        # Replace UUIDs and numeric IDs with placeholder
        if len(part) == 36 and part.count("-") == 4 or part.isdigit():
            normalized.append("{id}")
        else:
            normalized.append(part)
    return f"{method}|{'/'.join(normalized)}|{status}"


class MetricsMiddleware(BaseHTTPMiddleware):
    """Collects request count, error count, and duration metrics."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.url.path == "/metrics":
            return _metrics_response()

        start = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            # Keep the response inside the middleware chain so CORSMiddleware
            # (outermost) attaches headers. Without this, the browser sees a
            # CORS error instead of the real 500.
            _logger.exception(
                "Unhandled exception in route %s %s", request.method, request.url.path
            )
            duration = time.perf_counter() - start
            label = _label(request.method, request.url.path, 500)
            _request_count[label] = _request_count.get(label, 0) + 1
            _request_errors[label] = _request_errors.get(label, 0) + 1
            _request_duration_sum[label] = _request_duration_sum.get(label, 0.0) + duration
            _request_duration_count[label] = _request_duration_count.get(label, 0) + 1
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "Internal server error",
                    "code": "INTERNAL_ERROR",
                    "request_id": getattr(request.state, "request_id", None),
                },
            )
        duration = time.perf_counter() - start

        method = request.method
        path = request.url.path
        status_code = response.status_code
        label = _label(method, path, status_code)

        _request_count[label] = _request_count.get(label, 0) + 1
        _request_duration_sum[label] = _request_duration_sum.get(label, 0.0) + duration
        _request_duration_count[label] = _request_duration_count.get(label, 0) + 1

        if status_code >= 500:
            err_label = _label(method, path, status_code)
            _request_errors[err_label] = _request_errors.get(err_label, 0) + 1

        if duration >= _SLOW_REQUEST_THRESHOLD:
            _logger.warning(
                "Slow request: %s %s took %.2fs (status=%d)",
                method,
                path,
                duration,
                status_code,
            )

        return response


def _metrics_response() -> PlainTextResponse:
    """Generate Prometheus-compatible text exposition."""
    lines: list[str] = [
        "# HELP http_requests_total Total HTTP requests",
        "# TYPE http_requests_total counter",
    ]
    for label, count in sorted(_request_count.items()):
        method, path, status = label.split("|")
        lines.append(
            f'http_requests_total{{method="{method}",path="{path}",status="{status}"}} {count}'
        )

    lines.append("# HELP http_request_duration_seconds Request duration in seconds")
    lines.append("# TYPE http_request_duration_seconds summary")
    for label, total in sorted(_request_duration_sum.items()):
        method, path, status = label.split("|")
        count = _request_duration_count.get(label, 1)
        lines.append(
            f'http_request_duration_seconds_sum{{method="{method}",path="{path}",status="{status}"}} {total:.6f}'
        )
        lines.append(
            f'http_request_duration_seconds_count{{method="{method}",path="{path}",status="{status}"}} {count}'
        )

    lines.append("# HELP http_request_errors_total Total 5xx errors")
    lines.append("# TYPE http_request_errors_total counter")
    for label, count in sorted(_request_errors.items()):
        method, path, status = label.split("|")
        lines.append(
            f'http_request_errors_total{{method="{method}",path="{path}",status="{status}"}} {count}'
        )

    return PlainTextResponse("\n".join(lines) + "\n", media_type="text/plain; charset=utf-8")
