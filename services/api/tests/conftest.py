"""
WealthSpot API – Test configuration & fixtures.

Uses the Docker PostgreSQL instance with isolated transactions.
Each test runs in a transaction that gets rolled back after the test.
"""

import asyncio
import uuid
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

# ── Set env vars BEFORE importing app ──────────────────────────────────────
import os

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://wealthspot:wealthspot_dev@localhost:5433/wealthspot")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-unit-tests")
os.environ.setdefault("APP_ENV", "testing")
os.environ.setdefault("CORS_ORIGINS", "*")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("CELERY_BROKER_URL", "redis://localhost:6379/1")

from app.core.database import Base, get_db
from app.core.security import create_access_token, create_refresh_token
from app.main import app
from app.models.user import User, UserRole

# ── Test engine uses same PostgreSQL but creates/drops a test schema ────────

TEST_DB_URL = "postgresql+asyncpg://wealthspot:wealthspot_dev@localhost:5433/wealthspot"
TEST_ENGINE = create_async_engine(TEST_DB_URL, echo=False)
TestSessionFactory = async_sessionmaker(
    TEST_ENGINE,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture(scope="session")
def event_loop():
    """Use a single event loop for the entire test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    """
    Create a 'test_ws' schema, create all tables there, and drop it after.
    This isolates tests from the dev database completely.
    """
    from sqlalchemy import text

    async with TEST_ENGINE.begin() as conn:
        await conn.execute(text("DROP SCHEMA IF EXISTS test_ws CASCADE"))
        await conn.execute(text("CREATE SCHEMA test_ws"))
        await conn.execute(text("SET search_path TO test_ws"))
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with TEST_ENGINE.begin() as conn:
        await conn.execute(text("DROP SCHEMA IF EXISTS test_ws CASCADE"))


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionFactory() as session:
        from sqlalchemy import text
        await session.execute(text("SET search_path TO test_ws"))
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def test_user() -> User:
    """Create a test user in the DB and return it."""
    async with TestSessionFactory() as session:
        from sqlalchemy import text
        await session.execute(text("SET search_path TO test_ws"))
        user = User(
            id=uuid.uuid4(),
            email="testuser@wealthspot.in",
            full_name="Test User",
            phone="+919876543210",
            role=UserRole.INVESTOR,
            is_active=True,
            referral_code="TESTCODE",
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user


@pytest_asyncio.fixture
async def admin_user() -> User:
    """Create an admin test user."""
    async with TestSessionFactory() as session:
        from sqlalchemy import text
        await session.execute(text("SET search_path TO test_ws"))
        user = User(
            id=uuid.uuid4(),
            email="admin@wealthspot.in",
            full_name="Admin User",
            phone="+919876543211",
            role=UserRole.SUPER_ADMIN,
            is_active=True,
            referral_code="ADMINCODE",
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user


@pytest_asyncio.fixture
async def builder_user() -> User:
    """Create a builder test user."""
    async with TestSessionFactory() as session:
        from sqlalchemy import text
        await session.execute(text("SET search_path TO test_ws"))
        user = User(
            id=uuid.uuid4(),
            email="builder@wealthspot.in",
            full_name="Builder User",
            phone="+919876543212",
            role=UserRole.BUILDER,
            is_active=True,
            referral_code="BUILDCODE",
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user


def auth_headers(user: User) -> dict[str, str]:
    """Generate Authorization header with a valid access token for the given user."""
    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return {"Authorization": f"Bearer {token}"}


def refresh_token_for(user: User) -> str:
    """Generate a valid refresh token for the given user."""
    return create_refresh_token({"sub": str(user.id)})
