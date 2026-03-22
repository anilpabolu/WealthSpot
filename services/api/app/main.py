"""
WealthSpot API – main application entry point.
"""

from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.middleware.rate_limit import RateLimitMiddleware
from app.routers import admin, auth, community, investments, lender, notifications, properties, referrals, webhooks, approvals, opportunities, control_centre, uploads, pincodes, companies, templates, points, profile, kyc, bank_details

# Import all models so SQLAlchemy resolves relationship() string references
import app.models  # noqa: F401  # pyright: ignore[reportUnusedImport]

settings = get_settings()


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
    docs_url="/api/docs" if settings.app_env != "production" else None,
    redoc_url="/api/redoc" if settings.app_env != "production" else None,
    lifespan=lifespan,
)


# ── Middleware ────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RateLimitMiddleware, max_requests=200, window_seconds=60)


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


# ── Health ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "wealthspot-api"}


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "name": "WealthSpot API",
        "version": "0.1.0",
        "docs": "/api/docs",
    }
