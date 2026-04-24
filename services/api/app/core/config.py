"""
WealthSpot API – Core configuration via pydantic-settings.
Reads from .env / environment variables.
"""

from functools import lru_cache

from pydantic import model_validator
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
    jwt_refresh_token_expire_days: int = 7

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
    s3_public_url: str = (
        ""  # Public URL prefix for media (e.g. http://localhost:9000/wealthspot-media)
    )

    # ── Razorpay ─────────────────────────────────────────
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""

    # ── Business Rules ───────────────────────────────────
    referral_reward_paise: int = 25000  # ₹250 in paise
    otp_expiry_minutes: int = 10
    referral_code_length: int = 8
    max_upload_size_bytes: int = 5 * 1024 * 1024  # 5 MB

    # ── Sentry ───────────────────────────────────────────
    sentry_dsn: str = ""

    # ── SMTP (Email) ─────────────────────────────────────
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "WealthSpot"

    # ── Twilio (SMS / WhatsApp) ──────────────────────────
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""
    twilio_whatsapp_number: str = ""

    # ── Encryption (Fernet) ──────────────────────────────
    encryption_key: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @model_validator(mode="after")
    def validate_production_secrets(self) -> "Settings":
        if self.app_env == "production":
            if self.jwt_secret_key == "change-me":
                raise ValueError("JWT_SECRET_KEY must be set to a strong secret in production")
            if not self.encryption_key:
                raise ValueError("ENCRYPTION_KEY must be set in production")

            origins = self.cors_origin_list
            if not origins:
                raise ValueError(
                    "CORS_ORIGINS must be set to one or more explicit origins in production"
                )
            if "*" in origins:
                raise ValueError(
                    "CORS_ORIGINS cannot include '*' in production "
                    "(incompatible with allow_credentials=True)"
                )
            for origin in origins:
                if "localhost" in origin or "127.0.0.1" in origin:
                    raise ValueError(
                        f"CORS_ORIGINS contains a development origin in production: {origin}"
                    )
                if not origin.startswith("https://"):
                    raise ValueError(
                        f"CORS_ORIGINS must use https:// in production: {origin}"
                    )
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
