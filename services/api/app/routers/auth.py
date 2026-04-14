"""
Auth router – login, register, refresh, webhook, profile.
"""

import logging
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
    AddPersonaRequest,
    PersonaSelectionRequest,
    RefreshTokenRequest,
    SwitchPersonaRequest,
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

    # Check phone uniqueness if provided
    if body.phone:
        phone_exists = await db.execute(select(User).where(User.phone == body.phone))
        if phone_exists.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Phone number already registered")

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
    """Check if a user with this email is registered and active."""
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


# ── Persona Selection ────────────────────────────────────────────────────────


@router.post("/select-persona", response_model=UserRead)
async def select_persona(
    body: PersonaSelectionRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Set the user's personas after signup.
    - Validates primary_role is in selected roles
    - If 'builder' selected, auto-creates a builder approval request
    - If 'admin'/'super_admin' selected without invite, rejects
    """
    from datetime import datetime, timezone

    from app.models.approval import ApprovalCategory, ApprovalRequest, ApprovalStatus

    if user.persona_selected_at:
        raise HTTPException(status_code=400, detail="Personas already selected")

    if body.primary_role not in body.roles:
        raise HTTPException(status_code=400, detail="primary_role must be in selected roles")

    # Admin/super_admin can only be added via invite, not self-selection at signup
    admin_roles = {"admin", "super_admin"} & set(body.roles)
    if admin_roles:
        raise HTTPException(
            status_code=403,
            detail="Admin roles can only be assigned via invite from Control Centre",
        )

    user.roles = body.roles
    user.primary_role = body.primary_role
    user.role = UserRole(body.primary_role)  # keep legacy column in sync
    user.persona_selected_at = datetime.now(timezone.utc)

    # Auto-create builder approval request
    if "builder" in body.roles:
        approval = ApprovalRequest(
            category=ApprovalCategory.BUILDER_VERIFICATION,
            resource_type="builder_approval",
            resource_id=str(user.id),
            requester_id=user.id,
            title=f"Builder verification for {user.full_name}",
            description=f"{user.full_name} ({user.email}) selected the Builder persona and needs approval.",
            status=ApprovalStatus.PENDING,
        )
        db.add(approval)

    await db.flush()

    try:
        await log_audit_event(
            actor_id=user.id,
            action="user.select_persona",
            resource_type="user",
            resource_id=str(user.id),
            request=request,
            details={"roles": body.roles, "primary_role": body.primary_role},
        )
    except Exception:
        logging.getLogger(__name__).warning("Audit log failed for select_persona user=%s", user.id)

    return user


# ── Persona Switching & Adding ───────────────────────────────────────────────


@router.post("/switch-persona", response_model=UserRead)
async def switch_persona(
    body: SwitchPersonaRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Switch the user's active (primary) persona.
    The requested role must already be in the user's roles list.
    """
    if body.primary_role not in (user.roles or []):
        raise HTTPException(
            status_code=400,
            detail=f"You don't have the '{body.primary_role}' persona. Add it first.",
        )

    if body.primary_role == "builder" and not user.builder_approved:
        raise HTTPException(
            status_code=403,
            detail="Builder persona is pending approval. You cannot switch to it yet.",
        )

    user.primary_role = body.primary_role
    user.role = UserRole(body.primary_role)
    await db.flush()

    try:
        await log_audit_event(
            actor_id=user.id,
            action="user.switch_persona",
            resource_type="user",
            resource_id=str(user.id),
            request=request,
            details={"new_primary": body.primary_role},
        )
    except Exception:
        logging.getLogger(__name__).warning("Audit log failed for switch_persona user=%s", user.id)

    return user


@router.post("/add-persona", response_model=UserRead)
async def add_persona(
    body: AddPersonaRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Add a new persona to the user's roles list.
    - Cannot add a persona the user already has.
    - Adding 'builder' auto-creates an approval request.
    """
    from datetime import datetime, timezone

    from app.models.approval import ApprovalCategory, ApprovalRequest, ApprovalStatus

    current_roles = list(user.roles or [])

    if body.role in current_roles:
        raise HTTPException(
            status_code=400,
            detail=f"You are already signed up with the '{body.role}' persona.",
        )

    current_roles.append(body.role)
    user.roles = current_roles

    # If this is the user's first persona selection, set the timestamp
    if not user.persona_selected_at:
        user.persona_selected_at = datetime.now(timezone.utc)
        user.primary_role = body.role
        user.role = UserRole(body.role)

    # Auto-create builder approval request
    if body.role == "builder":
        approval = ApprovalRequest(
            category=ApprovalCategory.BUILDER_VERIFICATION,
            resource_type="builder_approval",
            resource_id=str(user.id),
            requester_id=user.id,
            title=f"Builder verification for {user.full_name}",
            description=f"{user.full_name} ({user.email}) requested Builder persona.",
            status=ApprovalStatus.PENDING,
        )
        db.add(approval)

    await db.flush()

    try:
        await log_audit_event(
            actor_id=user.id,
            action="user.add_persona",
            resource_type="user",
            resource_id=str(user.id),
            request=request,
            details={"added_role": body.role, "all_roles": current_roles},
        )
    except Exception:
        logging.getLogger(__name__).warning("Audit log failed for add_persona user=%s", user.id)

    return user


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

