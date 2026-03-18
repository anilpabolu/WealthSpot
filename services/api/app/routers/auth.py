"""
Auth router – login, register, refresh, webhook.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.middleware.audit import log_audit_event
from app.models.user import User, UserRole
from app.schemas.user import (
    RefreshTokenRequest,
    TokenPair,
    UserCreate,
    UserRead,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(
    body: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Register a new user (investor by default)."""
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Generate referral code
    referral_code = uuid.uuid4().hex[:8].upper()

    user = User(
        email=body.email,
        full_name=body.full_name,
        phone=body.phone,
        role=body.role or UserRole.INVESTOR,
        clerk_id=body.clerk_id,
        referral_code=referral_code,
    )
    db.add(user)
    await db.flush()

    await log_audit_event(
        actor_id=user.id,
        action="user.register",
        resource_type="user",
        resource_id=str(user.id),
        request=request,
    )

    return user


@router.post("/login", response_model=TokenPair)
async def login(
    body: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> TokenPair:
    """
    Demo login – in production use Clerk webhook or OAuth.
    Finds or creates user by email and returns JWT pair.
    """
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user:
        # Auto-create for demo
        user = User(
            email=body.email,
            full_name=body.full_name,
            phone=body.phone,
            role=body.role or UserRole.INVESTOR,
            referral_code=uuid.uuid4().hex[:8].upper(),
        )
        db.add(user)
        await db.flush()

    access = create_access_token({"sub": str(user.id), "role": user.role.value})
    refresh = create_refresh_token({"sub": str(user.id)})

    return TokenPair(access_token=access, refresh_token=refresh)


@router.post("/refresh", response_model=TokenPair)
async def refresh_token(
    body: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenPair:
    """Exchange a refresh token for a new token pair."""
    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload["sub"]
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")

    access = create_access_token({"sub": str(user.id), "role": user.role.value})
    refresh = create_refresh_token({"sub": str(user.id)})

    return TokenPair(access_token=access, refresh_token=refresh)
