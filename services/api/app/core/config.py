"""
WealthSpot API – Core configuration via pydantic-settings.
Reads from .env / environment variables.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ──────────────────────────────────────────────
    app_env: str = "development"
    debug: bool = False
    cors_origins: str = "http://localhost:5173"

    # ── Database ─────────────────────────────────────────
    database_url: str = "postgresql+asyncpg://user:password@localhost:5432/wealthspot"
    database_echo: bool = False

    # ── Auth / JWT ───────────────────────────────────────
    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    jwt_refresh_token_expire_days: int = 30

    # ── Clerk ────────────────────────────────────────────
    clerk_webhook_secret: str = ""
    clerk_api_key: str = ""

    # ── Redis / Celery ───────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/1"

    # ── AWS S3 / MinIO ─────────────────────────────────────
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_s3_bucket: str = "wealthspot-media"
    aws_region: str = "us-east-1"
    s3_endpoint_url: str = ""  # Set to MinIO URL for local dev (e.g. http://localhost:9000)
    s3_public_url: str = ""    # Public URL prefix for media (e.g. http://localhost:9000/wealthspot-media)

    # ── Razorpay ─────────────────────────────────────────
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""

    # ── Sentry ───────────────────────────────────────────
    sentry_dsn: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
