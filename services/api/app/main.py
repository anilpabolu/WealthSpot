"""
WealthSpot API – main application entry point.
Requires migration aa16902c5305 (has_onboarding_consent) to be applied.
"""

import logging
import time
from contextlib import asynccontextmanager

_app_start_time = time.monotonic()

import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Import all models so SQLAlchemy resolves relationship() string references
from app import models as _models_init  # noqa: F401  # pyright: ignore[reportUnusedImport]
from app.core.config import get_settings
from app.core.exceptions import APIError
from app.core.logging_config import setup_logging
from app.middleware.metrics import MetricsMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.request_id import RequestIdFilter, RequestIdMiddleware
from app.routers import (
    admin,
    analytics,
    app_images,
    app_videos,
    appreciation,
    approvals,
    assessments,
    auth,
    bank_details,
    builder_updates,
    comm,
    companies,
    consent,
    control_centre,
    devices,
    eoi,
    founding_team,
    investments,
    knowledge,
    kyc,
    lender,
    notifications,
    opportunities,
    pincodes,
    points,
    portfolio,
    portfolio_ledger,
    portfolio_transactions,
    profile,
    profiling,
    properties,
    referrals,
    site_content,
    source_clicks,
    templates,
    uploads,
    vault_features,
    webhooks,
)

settings = get_settings()

# ── Logging ──────────────────────────────────────────────────────────────────

setup_logging(app_env=settings.app_env)


# ── Sentry ───────────────────────────────────────────────────────────────────

if settings.sentry_dsn:
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.logging import LoggingIntegration
    from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
    from sentry_sdk.integrations.starlette import StarletteIntegration

    _is_prod = settings.app_env == "production"
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.app_env,
        traces_sample_rate=0.2 if _is_prod else 0.0,
        profiles_sample_rate=0.1 if _is_prod else 0.0,
        send_default_pii=False,
        integrations=[
            StarletteIntegration(transaction_style="endpoint"),
            FastApiIntegration(transaction_style="endpoint"),
            SqlalchemyIntegration(),
            LoggingIntegration(level=logging.INFO, event_level=logging.ERROR),
        ],
    )


# ── Lifespan ─────────────────────────────────────────────────────────────────


logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup — check S3 connectivity so misconfiguration surfaces early in logs
    try:
        from app.services.s3 import check_s3_connectivity

        result = await check_s3_connectivity()
        if result["ok"]:
            logger.info("S3 connectivity OK (bucket=%s)", result["bucket"])
        else:
            logger.warning("S3 connectivity FAILED at startup: %s", result.get("error"))
    except Exception as exc:
        logger.warning("Could not verify S3 connectivity at startup: %s", exc)

    yield

    # Shutdown
    from app.core.database import engine

    await engine.dispose()


# ── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="WealthSpot API",
    description="Fractional Real Estate Investment Platform – REST API",
    version="0.1.0",
    docs_url="/api/docs" if settings.app_env == "development" else None,
    redoc_url="/api/redoc" if settings.app_env == "development" else None,
    lifespan=lifespan,
)


# ── Middleware ────────────────────────────────────────────────────────────────
# Starlette's add_middleware prepends each entry, then builds the chain with
# reversed(), so the LAST call here becomes the OUTERMOST layer (runs first on
# every request, runs last on every response).
# CORSMiddleware MUST be the outermost layer so it injects Access-Control-*
# headers on ALL responses — including 4xx/5xx returned by inner middlewares.
app.add_middleware(RateLimitMiddleware, max_requests=200, window_seconds=60)
app.add_middleware(MetricsMiddleware)
app.add_middleware(RequestIdMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "X-Requested-With",
        "X-Diag-Id",
    ],
    expose_headers=[
        "X-Request-ID",
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
    ],
    max_age=600,
)

# Attach request-ID filter to root logger so all log records include request_id
logging.getLogger().addFilter(RequestIdFilter())


# ── Routers ──────────────────────────────────────────────────────────────────

API_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(properties.router, prefix=API_PREFIX)
app.include_router(investments.router, prefix=API_PREFIX)
app.include_router(admin.router, prefix=API_PREFIX)
app.include_router(referrals.router, prefix=API_PREFIX)
app.include_router(lender.router, prefix=API_PREFIX)
app.include_router(notifications.router, prefix=API_PREFIX)
app.include_router(devices.router, prefix=API_PREFIX)
app.include_router(webhooks.router, prefix=API_PREFIX)
app.include_router(approvals.router, prefix=API_PREFIX)
app.include_router(opportunities.router, prefix=API_PREFIX)
app.include_router(control_centre.router, prefix=API_PREFIX)
app.include_router(uploads.router, prefix=API_PREFIX)
app.include_router(pincodes.router, prefix=API_PREFIX)
app.include_router(companies.router, prefix=API_PREFIX)
app.include_router(templates.router, prefix=API_PREFIX)
app.include_router(points.router, prefix=API_PREFIX)
app.include_router(profile.router, prefix=API_PREFIX)
app.include_router(kyc.router, prefix=API_PREFIX)
app.include_router(bank_details.router, prefix=API_PREFIX)
app.include_router(eoi.router, prefix=API_PREFIX)
app.include_router(founding_team.router, prefix=API_PREFIX)
app.include_router(portfolio.router, prefix=API_PREFIX)
app.include_router(portfolio_ledger.router, prefix=API_PREFIX)
app.include_router(portfolio_transactions.router, prefix=API_PREFIX)
app.include_router(portfolio_transactions.builder_router, prefix=API_PREFIX)
app.include_router(app_images.router, prefix=API_PREFIX)
app.include_router(app_videos.router, prefix=API_PREFIX)
app.include_router(analytics.router, prefix=API_PREFIX)
app.include_router(profiling.router, prefix=API_PREFIX)
app.include_router(site_content.router, prefix=API_PREFIX)
app.include_router(knowledge.router, prefix=API_PREFIX)
app.include_router(vault_features.router, prefix=API_PREFIX)
app.include_router(builder_updates.router, prefix=API_PREFIX)
app.include_router(appreciation.router, prefix=API_PREFIX)
app.include_router(appreciation.property_router, prefix=API_PREFIX)
app.include_router(assessments.router, prefix=API_PREFIX)
app.include_router(comm.router, prefix=API_PREFIX)
app.include_router(consent.router, prefix=API_PREFIX)
app.include_router(source_clicks.router, prefix=API_PREFIX)


# ── Global exception handlers ────────────────────────────────────────────────
# Every handler returns a JSONResponse so the response flows back through the
# middleware chain — CORSMiddleware (outermost) attaches Access-Control-* headers
# even on error paths. The shape is always {"detail": str, "code": str | null}.

_logger = logging.getLogger(__name__)


@app.exception_handler(APIError)
async def api_error_handler(request: Request, exc: APIError) -> JSONResponse:
    """Application-defined errors with machine-readable codes."""
    if exc.status_code >= 500:
        _logger.error("APIError (500+) on %s %s: %s", request.method, request.url.path, exc.detail)
        import sentry_sdk

        sentry_sdk.capture_exception(exc)

    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": exc.code},
        headers=exc.headers or None,
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Pydantic validation errors — return a stable shape instead of FastAPI's default."""
    errors = [
        {
            "field": ".".join(str(p) for p in e.get("loc", []) if p != "body"),
            "message": e.get("msg", "Invalid value"),
        }
        for e in exc.errors()
    ]
    detail = errors[0]["message"] if errors else "Invalid request"
    return JSONResponse(
        status_code=422,
        content={"detail": detail, "code": "VALIDATION_ERROR", "errors": errors},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all for unhandled exceptions — returns 500 with CORS headers preserved."""
    _logger.exception("Unhandled exception on %s %s", request.method, request.url.path)

    # Explicitly capture in Sentry to guarantee it's logged,
    # regardless of FastApiIntegration/LoggingIntegration nuances.
    import sentry_sdk

    sentry_sdk.capture_exception(exc)

    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "code": "INTERNAL_ERROR",
            "request_id": getattr(request.state, "request_id", None),
        },
    )


from sqlalchemy.exc import IntegrityError, OperationalError


@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError) -> JSONResponse:
    """Translate DB constraint violations into user-friendly 409 responses."""
    _logger.warning("IntegrityError on %s %s: %s", request.method, request.url.path, exc.orig)
    detail = "A record with this information already exists."
    code = "INTEGRITY_ERROR"
    orig = str(exc.orig) if exc.orig else ""
    if "unique" in orig.lower() or "duplicate" in orig.lower():
        detail = "Duplicate entry — this record already exists."
        code = "DUPLICATE_ENTRY"
    elif "foreign" in orig.lower():
        detail = "Referenced record not found."
        code = "FOREIGN_KEY_VIOLATION"
    elif "check" in orig.lower():
        detail = "Value does not satisfy validation rules."
        code = "CHECK_CONSTRAINT"
    return JSONResponse(status_code=409, content={"detail": detail, "code": code})


@app.exception_handler(OperationalError)
async def operational_error_handler(request: Request, exc: OperationalError) -> JSONResponse:
    """Handle database connectivity issues with a clear 503."""
    _logger.error("OperationalError on %s %s: %s", request.method, request.url.path, exc.orig)

    # Explicitly capture DB outages in Sentry
    import sentry_sdk

    sentry_sdk.capture_exception(exc)

    return JSONResponse(
        status_code=503,
        content={
            "detail": "Service temporarily unavailable. Please try again.",
            "code": "DB_UNAVAILABLE",
        },
    )


# ── Health ───────────────────────────────────────────────────────────────────


@app.get("/live")
async def live() -> dict[str, str]:
    """Liveness probe — returns immediately, no dep checks.

    Use as the k8s livenessProbe. If this responds, the process is alive;
    if it doesn't, the orchestrator should restart the pod. /ready (below)
    is the right probe for "should this pod receive traffic?".
    """
    return {"status": "alive"}


@app.get("/ready")
async def ready() -> JSONResponse:
    """Readiness probe — returns 200 when uvicorn is up and can accept requests.

    Does NOT check DB/Redis connectivity. A dependency outage should cause
    individual endpoint errors, not take the whole service out of rotation.
    Use /health for deep dependency checks (monitoring/alerting only).
    """
    return JSONResponse(
        status_code=200,
        content={"status": "ready", "uptime_seconds": round(time.monotonic() - _app_start_time, 1)},
    )


@app.get("/health")
async def health() -> dict:
    """Deep health check – verifies database, Redis, and reports version/uptime."""
    import time

    _logger = logging.getLogger(__name__)
    checks: dict[str, object] = {
        "service": "wealthspot-api",
        "version": app.version,
        "environment": settings.app_env,
        "uptime_seconds": round(time.monotonic() - _app_start_time, 1),
    }

    # Database check
    try:
        from sqlalchemy import text

        from app.core.database import engine

        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        checks["db"] = "ok"
    except Exception as e:
        _logger.error("Health check DB failure: %s", e)
        checks["db"] = "error"

    # Redis check
    try:
        import redis as _redis

        r = _redis.from_url(settings.redis_url, socket_connect_timeout=2)
        r.ping()
        checks["redis"] = "ok"
        r.close()
    except Exception as e:
        _logger.error("Health check Redis failure: %s", e)
        checks["redis"] = "error"

    # S3 / media storage check
    try:
        from app.services.s3 import check_s3_connectivity

        s3_result = await check_s3_connectivity()
        checks["s3"] = "ok" if s3_result["ok"] else f"error: {s3_result.get('error', 'unknown')}"
        checks["s3_endpoint"] = s3_result["endpoint"]
        checks["s3_bucket"] = s3_result["bucket"]
    except Exception as e:
        checks["s3"] = f"error: {e}"

    # JWT secret strength check — catches placeholder/weak secrets early
    checks["jwt_secret"] = (
        "ok"
        if len(settings.jwt_secret_key) >= 32
        else f"weak ({len(settings.jwt_secret_key)} chars)"
    )

    # Alembic migration head
    try:
        from sqlalchemy import text

        from app.core.database import engine

        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT version_num FROM alembic_version LIMIT 1"))
            row = result.first()
            checks["migration_head"] = row[0] if row else "none"
    except Exception:
        checks["migration_head"] = "unknown"

    all_ok = checks.get("db") == "ok" and checks.get("redis") == "ok"
    checks["status"] = "ok" if all_ok else "degraded"
    return checks


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "name": "WealthSpot API",
        "version": "0.1.0",
        "docs": "/api/docs",
    }
