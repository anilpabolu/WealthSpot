"""
WealthSpot API – main application entry point.
"""

import logging
from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.logging_config import setup_logging
from app.middleware.metrics import MetricsMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.request_id import RequestIdMiddleware, RequestIdFilter
from app.routers import admin, auth, community, investments, lender, notifications, properties, referrals, webhooks, approvals, opportunities, control_centre, uploads, pincodes, companies, templates, points, profile, kyc, bank_details, eoi, portfolio, app_videos

# Import all models so SQLAlchemy resolves relationship() string references
import app.models  # noqa: F401  # pyright: ignore[reportUnusedImport]

settings = get_settings()

# ── Logging ──────────────────────────────────────────────────────────────────

setup_logging(app_env=settings.app_env)


# ── Sentry ───────────────────────────────────────────────────────────────────

if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        traces_sample_rate=0.2,
        profiles_sample_rate=0.1,
        environment=settings.app_env,
    )


# ── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "X-Requested-With",
        "X-Diag-Id",
    ],
)

app.add_middleware(RateLimitMiddleware, max_requests=200, window_seconds=60)
app.add_middleware(MetricsMiddleware)
app.add_middleware(RequestIdMiddleware)

# Attach request-ID filter to root logger so all log records include request_id
logging.getLogger().addFilter(RequestIdFilter())


# ── Routers ──────────────────────────────────────────────────────────────────

API_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(properties.router, prefix=API_PREFIX)
app.include_router(investments.router, prefix=API_PREFIX)
app.include_router(admin.router, prefix=API_PREFIX)
app.include_router(community.router, prefix=API_PREFIX)
app.include_router(referrals.router, prefix=API_PREFIX)
app.include_router(lender.router, prefix=API_PREFIX)
app.include_router(notifications.router, prefix=API_PREFIX)
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
app.include_router(portfolio.router, prefix=API_PREFIX)
app.include_router(app_videos.router, prefix=API_PREFIX)


# ── Health ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health() -> dict:
    """Deep health check – verifies database and Redis connectivity."""
    import logging

    _logger = logging.getLogger(__name__)
    checks: dict[str, str] = {"service": "wealthspot-api"}

    # Database check
    try:
        from app.core.database import engine
        from sqlalchemy import text
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
