"""
Auth router – login, register, refresh, webhook, profile.
"""

import logging
import uuid
from datetime import UTC
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    remaining_ttl,
)
from app.middleware.audit import log_audit_event
from app.middleware.auth import get_current_user
from app.middleware.rate_limit import route_limit
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
from app.services import token_store

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


@router.post(
    "/login",
    response_model=TokenPair,
    dependencies=[Depends(route_limit(name="auth.login", max_requests=10, window_seconds=60))],
)
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

    access, _, _ = create_access_token({"sub": str(user.id), "role": user.role.value})
    refresh, refresh_jti, refresh_ttl = create_refresh_token({"sub": str(user.id)})
    token_store.set_current_refresh(str(user.id), refresh_jti, refresh_ttl)

    return TokenPair(access_token=access, refresh_token=refresh)


@router.get(
    "/check",
    dependencies=[
        # Tight cap to defeat email enumeration. 30/min per IP is enough
        # for legit signup-flow probing.
        Depends(route_limit(name="auth.check", max_requests=30, window_seconds=60))
    ],
)
async def check_user_exists(
    email: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, bool]:
    """Check if a user with this email is registered and active."""
    result = await db.execute(select(User.id).where(User.email == email, User.is_active.is_(True)))
    return {"exists": result.scalar_one_or_none() is not None}


@router.post(
    "/refresh",
    response_model=TokenPair,
    dependencies=[Depends(route_limit(name="auth.refresh", max_requests=20, window_seconds=60))],
)
async def refresh_token(
    body: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenPair:
    """Exchange a refresh token for a new token pair (one-time-use rotation).

    Reusing an old refresh token after rotation is treated as token theft and
    invalidates all refresh tokens for the user.
    """
    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token") from None

    user_id = payload["sub"]
    presented_jti = payload.get("jti")

    if token_store.is_revoked(presented_jti or ""):
        raise HTTPException(status_code=401, detail="Refresh token revoked")

    current_jti = token_store.get_current_refresh(user_id)
    # If a current jti is recorded and the presented one doesn't match, this is
    # a reuse → invalidate the entire session.
    if current_jti is not None and presented_jti != current_jti:
        token_store.clear_user_sessions(user_id)
        raise HTTPException(status_code=401, detail="Refresh token reuse detected")

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")

    # Revoke the presented refresh-token jti for the rest of its lifetime.
    if presented_jti:
        token_store.revoke(presented_jti, remaining_ttl(payload))

    access, _, _ = create_access_token({"sub": str(user.id), "role": user.role.value})
    new_refresh, new_jti, new_ttl = create_refresh_token({"sub": str(user.id)})
    token_store.set_current_refresh(str(user.id), new_jti, new_ttl)

    return TokenPair(access_token=access, refresh_token=new_refresh)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    body: RefreshTokenRequest | None = None,
    request: Request = None,  # type: ignore[assignment]
    user: User = Depends(get_current_user),
) -> None:
    """Revoke the caller's access token (and the supplied refresh token if any).

    Clients should call this on sign-out so a stolen token can't outlive the
    session up to its natural expiry.
    """
    # Revoke the access token via the request's authorization header.
    auth = request.headers.get("authorization", "") if request is not None else ""
    if auth.lower().startswith("bearer "):
        access = auth[7:].strip()
        try:
            payload = decode_token(access)
            if payload.get("jti"):
                token_store.revoke(payload["jti"], remaining_ttl(payload))
        except Exception:
            pass

    # Revoke the supplied refresh token, if any.
    if body and body.refresh_token:
        try:
            r_payload = decode_token(body.refresh_token)
            if r_payload.get("jti"):
                token_store.revoke(r_payload["jti"], remaining_ttl(r_payload))
        except Exception:
            pass

    # Drop the user's "current refresh" pointer so any other refresh attempt
    # still in flight will fail closed.
    token_store.clear_user_sessions(str(user.id))


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
    from datetime import datetime

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
    user.persona_selected_at = datetime.now(UTC)

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
    from datetime import datetime

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
        user.persona_selected_at = datetime.now(UTC)
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
    has_investments: bool = False

    model_config = {"from_attributes": True}


@router.get("/me", response_model=UserMeResponse)
async def get_me(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserMeResponse:
    """Return the authenticated user's full profile including KYC documents."""
    from sqlalchemy import func

    from app.models.opportunity_investment import OpportunityInvestment

    count_result = await db.execute(
        select(func.count())
        .select_from(OpportunityInvestment)
        .where(
            OpportunityInvestment.user_id == user.id,
            OpportunityInvestment.status == "confirmed",
        )
    )
    has_investments = (count_result.scalar_one() or 0) > 0

    response = UserMeResponse.model_validate(user)
    response.has_investments = has_investments
    return response


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


# ── Audit-log self-query ─────────────────────────────────────────────────────


class AuditEventOut(BaseModel):
    """Sanitised view of an audit_logs row for the user's own activity feed."""

    id: uuid.UUID
    action: str
    resource_type: str
    resource_id: str | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    created_at: Any

    model_config = {"from_attributes": True}


@router.get("/me/audit", response_model=list[AuditEventOut])
async def my_audit_log(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
    offset: int = 0,
) -> list[AuditEventOut]:
    """Return the caller's own audit-log entries (most recent first).

    Surfaces account activity (logins, persona changes, KYC submissions, etc.)
    so users can see what's been done with their account. Sensitive payloads
    (`old_value` / `new_value`) are intentionally excluded — those are kept
    for admin forensics, not user-facing review.
    """
    from sqlalchemy import desc

    from app.models.community import AuditLog

    limit = max(1, min(limit, 200))
    offset = max(0, offset)

    rows = (
        (
            await db.execute(
                select(AuditLog)
                .where(AuditLog.actor_id == user.id)
                .order_by(desc(AuditLog.created_at))
                .limit(limit)
                .offset(offset)
            )
        )
        .scalars()
        .all()
    )

    return [AuditEventOut.model_validate(r) for r in rows]
