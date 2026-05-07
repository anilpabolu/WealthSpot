"""
Async SQLAlchemy engine & session factory.
"""

import socket as _socket
import ssl as _ssl_module

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

# ── IPv4 preference ────────────────────────────────────────────────────────────
# Azure Container Apps (Consumption plan) may not have IPv6 default-route
# internet connectivity, causing ENETUNREACH when asyncpg resolves a hostname
# that returns AAAA records.  Prefer IPv4 addresses when both are available.
_orig_getaddrinfo = _socket.getaddrinfo


def _ipv4_preferred_getaddrinfo(
    host: object,
    port: object,
    family: int = 0,
    type: int = 0,
    proto: int = 0,
    flags: int = 0,
) -> list:
    results = _orig_getaddrinfo(host, port, family, type, proto, flags)
    ipv4 = [r for r in results if r[0] == _socket.AF_INET]
    return ipv4 if ipv4 else results  # fall back to IPv6 if no IPv4 available


_socket.getaddrinfo = _ipv4_preferred_getaddrinfo
# ──────────────────────────────────────────────────────────────────────────────

settings = get_settings()

# asyncpg does not support ?ssl=require as a URL query parameter; strip it and
# pass an SSLContext via connect_args instead.
_raw_db_url = settings.database_url
_db_needs_ssl = "ssl=require" in _raw_db_url
_db_url = _raw_db_url.replace("?ssl=require", "").replace("&ssl=require", "")

_engine_kwargs: dict = {
    "echo": settings.database_echo,
    "pool_size": 20,
    "max_overflow": 10,
    "pool_pre_ping": True,
}
if _db_needs_ssl:
    _ssl_ctx = _ssl_module.create_default_context()
    _ssl_ctx.check_hostname = False
    _ssl_ctx.verify_mode = _ssl_module.CERT_NONE
    _engine_kwargs["connect_args"] = {"ssl": _ssl_ctx}

engine = create_async_engine(_db_url, **_engine_kwargs)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Shared declarative base for all models."""

    pass


async def get_db() -> AsyncSession:  # type: ignore[misc]
    """FastAPI dependency – yields an async session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
