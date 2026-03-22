"""
Auth router – login, register, refresh, webhook, profile.
"""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.middleware.audit import log_audit_event
from app.middleware.auth import get_current_user
from app.models.user import User, UserRole
from app.schemas.user import (
    RefreshTokenRequest,
    TokenPair,
    UserCreate,
    UserRead,
    UserUpdate,
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
    Login – finds existing user by email and returns JWT pair.
    Does NOT auto-create users. Use /auth/register for signup.
    """
    result = await db.execute(
        select(User).where(User.email == body.email, User.is_active.is_(True))
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="USER_NOT_REGISTERED",
        )

    access = create_access_token({"sub": str(user.id), "role": user.role.value})
    refresh = create_refresh_token({"sub": str(user.id)})

    return TokenPair(access_token=access, refresh_token=refresh)


@router.get("/check")
async def check_user_exists(
    email: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, bool]:
    """Check if a user with this email is registered (for Clerk gate)."""
    result = await db.execute(
        select(User.id).where(User.email == email, User.is_active.is_(True))
    )
    return {"exists": result.scalar_one_or_none() is not None}


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


# ── Profile ──────────────────────────────────────────────────────────────────


class KycDocumentOut(BaseModel):
    id: uuid.UUID
    document_type: str
    verification_status: str
    created_at: Any

    model_config = {"from_attributes": True}


class UserMeResponse(UserRead):
    """Full profile returned by /auth/me including KYC documents."""
    kyc_documents: list[KycDocumentOut] = []
    phone: str | None = None
    email_verified: bool = False
    phone_verified: bool = False
    profile_completion_pct: int = 0

    model_config = {"from_attributes": True}


@router.get("/me", response_model=UserMeResponse)
async def get_me(
    user: User = Depends(get_current_user),
) -> User:
    """Return the authenticated user's full profile including KYC documents."""
    return user


@router.put("/me", response_model=UserMeResponse)
async def update_me(
    body: UserUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Update authenticated user's profile fields."""
    if body.full_name is not None:
        user.full_name = body.full_name
    if body.phone is not None:
        user.phone = body.phone
    if body.avatar_url is not None:
        user.avatar_url = body.avatar_url
    await db.flush()
    return user

