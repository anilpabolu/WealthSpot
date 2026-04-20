"""
Referral router – code validation, tracking, rewards, admin management.
"""

import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.database import get_db
from app.middleware.auth import get_current_user, require_role
from app.models.community import Referral
from app.models.investment import Investment
from app.models.property_referral import PropertyReferralCode
from app.models.user import User, UserRole

router = APIRouter(prefix="/referrals", tags=["referrals"])
settings = get_settings()
admin_dep = require_role(UserRole.ADMIN)


class ReferralStats(BaseModel):
    referral_code: str
    referral_link: str
    total_referrals: int
    successful_referrals: int
    total_rewards: int  # in paise


class ReferralHistoryItem(BaseModel):
    id: uuid.UUID
    referee_name: str
    referee_email: str
    status: str  # "invested" | "signed_up"
    reward_amount: int
    reward_claimed: bool
    referral_type: str  # "platform" | "property"
    opportunity_title: str | None = None
    created_at: Any

    model_config = {"from_attributes": True}


class ReferralApply(BaseModel):
    code: str


@router.get("/stats", response_model=ReferralStats)
async def referral_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReferralStats:
    """Get referral stats for the current user."""
    total = (
        await db.execute(select(func.count(Referral.id)).where(Referral.referrer_id == user.id))
    ).scalar() or 0

    successful = (
        await db.execute(
            select(func.count(Referral.id)).where(
                Referral.referrer_id == user.id,
                Referral.first_investment_rewarded.is_(True),
            )
        )
    ).scalar() or 0

    rewards = (
        await db.execute(
            select(func.sum(Referral.reward_amount)).where(
                Referral.referrer_id == user.id,
                Referral.first_investment_rewarded.is_(True),
            )
        )
    ).scalar() or 0

    return ReferralStats(
        referral_code=user.referral_code or "",
        referral_link=f"https://wealthspot.in/signup?ref={user.referral_code or ''}",
        total_referrals=total,
        successful_referrals=successful,
        total_rewards=rewards,
    )


@router.get("/history", response_model=list[ReferralHistoryItem])
async def referral_history(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ReferralHistoryItem]:
    """Get list of referrals made by the current user with referee details."""
    result = await db.execute(
        select(Referral)
        .options(selectinload(Referral.referee), selectinload(Referral.opportunity))
        .where(Referral.referrer_id == user.id)
        .order_by(Referral.created_at.desc())
    )
    referrals = result.scalars().all()

    items: list[ReferralHistoryItem] = []
    for ref in referrals:
        referee = ref.referee
        status = "invested" if ref.first_investment_rewarded else "signed_up"
        items.append(
            ReferralHistoryItem(
                id=ref.id,
                referee_name=referee.full_name if referee else "Unknown",
                referee_email=referee.email if referee else "",
                status=status,
                reward_amount=ref.reward_amount or 0,
                reward_claimed=ref.reward_claimed or False,
                referral_type=ref.referral_type or "platform",
                opportunity_title=ref.opportunity.title if ref.opportunity else None,
                created_at=ref.created_at,
            )
        )
    return items


@router.post("/apply")
async def apply_referral_code(
    body: ReferralApply,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Apply a referral code during onboarding. Supports both platform and property codes."""
    # Check if user already has a referral
    existing = await db.execute(select(Referral).where(Referral.referee_id == user.id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Referral already applied")

    code = body.code.upper()

    # First check if it's a property referral code (starts with P)
    if code.startswith("P"):
        prc_result = await db.execute(
            select(PropertyReferralCode).where(PropertyReferralCode.code == code)
        )
        prc = prc_result.scalar_one_or_none()
        if prc:
            if prc.user_id == user.id:
                raise HTTPException(status_code=400, detail="Cannot refer yourself")

            referral = Referral(
                referrer_id=prc.user_id,
                referee_id=user.id,
                code_used=code,
                reward_amount=settings.referral_reward_paise,
                referral_type="property",
                opportunity_id=prc.opportunity_id,
                property_referral_code_id=prc.id,
            )
            db.add(referral)
            user.referred_by = prc.user_id
            try:
                await db.flush()
            except IntegrityError:
                await db.rollback()
                raise HTTPException(status_code=400, detail="Referral already applied") from None
            return {
                "message": "Property referral applied successfully",
                "reward": "₹250 (on first investment)",
            }

    # Platform referral code
    referrer_result = await db.execute(select(User).where(User.referral_code == code))
    referrer = referrer_result.scalar_one_or_none()
    if not referrer:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    if referrer.id == user.id:
        raise HTTPException(status_code=400, detail="Cannot refer yourself")

    referral = Referral(
        referrer_id=referrer.id,
        referee_id=user.id,
        code_used=code,
        reward_amount=settings.referral_reward_paise,
        referral_type="platform",
    )
    db.add(referral)

    user.referred_by = referrer.id
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Referral already applied") from None

    return {"message": "Referral applied successfully", "reward": "₹250 (on first investment)"}


# ── Admin: Referral management ───────────────────────────────────────────────


class AdminReferralSummary(BaseModel):
    referrer_id: str
    referrer_name: str
    referrer_email: str
    total_referrals: int
    successful_referrals: int
    total_reward_earned: int  # paise
    pending_referrals: int


class AdminReferralDetail(BaseModel):
    id: str
    referrer_name: str
    referrer_email: str
    referee_name: str
    referee_email: str
    referral_type: str
    opportunity_title: str | None
    code_used: str
    reward_amount: int
    first_investment_rewarded: bool
    rewarded_at: str | None
    created_at: str
    referee_status: str  # invested / active / stale
    referee_joined_at: str | None
    referee_total_investments: int


@router.get("/admin/summary", response_model=list[AdminReferralSummary])
async def admin_referral_summary(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(admin_dep),
) -> list[AdminReferralSummary]:
    """Admin: aggregated referral stats per referrer."""
    result = await db.execute(
        select(
            Referral.referrer_id,
            func.count(Referral.id).label("total"),
            func.count(Referral.id)
            .filter(Referral.first_investment_rewarded.is_(True))
            .label("successful"),
            func.coalesce(
                func.sum(Referral.reward_amount).filter(
                    Referral.first_investment_rewarded.is_(True)
                ),
                0,
            ).label("total_reward"),
            func.count(Referral.id)
            .filter(Referral.first_investment_rewarded.is_(False))
            .label("pending"),
        )
        .group_by(Referral.referrer_id)
        .order_by(func.count(Referral.id).desc())
    )
    rows = result.all()

    # Batch-load referrer users
    user_ids = [row.referrer_id for row in rows]
    if not user_ids:
        return []
    users_result = await db.execute(select(User).where(User.id.in_(user_ids)))
    users_map = {u.id: u for u in users_result.scalars().all()}

    return [
        AdminReferralSummary(
            referrer_id=str(row.referrer_id),
            referrer_name=users_map[row.referrer_id].full_name
            if row.referrer_id in users_map
            else "Unknown",
            referrer_email=users_map[row.referrer_id].email if row.referrer_id in users_map else "",
            total_referrals=row.total,
            successful_referrals=row.successful,
            total_reward_earned=row.total_reward,
            pending_referrals=row.pending,
        )
        for row in rows
    ]


@router.get("/admin/details", response_model=list[AdminReferralDetail])
async def admin_referral_details(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(admin_dep),
    referrer_id: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
) -> list[AdminReferralDetail]:
    """Admin: detailed referral list with referrer→referee mapping."""
    query = (
        select(Referral)
        .options(
            selectinload(Referral.referrer),
            selectinload(Referral.referee),
            selectinload(Referral.opportunity),
        )
        .order_by(Referral.created_at.desc())
        .limit(limit)
    )
    if referrer_id:
        query = query.where(Referral.referrer_id == uuid.UUID(referrer_id))

    result = await db.execute(query)
    referrals = result.scalars().all()

    # Batch-count investments per referee to determine status
    referee_ids = [ref.referee_id for ref in referrals if ref.referee_id]
    inv_counts: dict[uuid.UUID, int] = {}
    if referee_ids:
        inv_result = await db.execute(
            select(
                Investment.user_id,
                func.count(Investment.id).label("cnt"),
            )
            .where(Investment.user_id.in_(referee_ids))
            .group_by(Investment.user_id)
        )
        inv_counts = {row.user_id: row.cnt for row in inv_result.all()}

    items: list[AdminReferralDetail] = []
    for ref in referrals:
        n_inv = inv_counts.get(ref.referee_id, 0)
        if ref.first_investment_rewarded or n_inv > 0:
            status = "invested"
        elif ref.referee and ref.referee.created_at:
            # Active if joined < 30 days ago, stale otherwise
            age = (datetime.now(UTC) - ref.referee.created_at).days
            status = "active" if age <= 30 else "stale"
        else:
            status = "stale"

        items.append(
            AdminReferralDetail(
                id=str(ref.id),
                referrer_name=ref.referrer.full_name if ref.referrer else "Unknown",
                referrer_email=ref.referrer.email if ref.referrer else "",
                referee_name=ref.referee.full_name if ref.referee else "Unknown",
                referee_email=ref.referee.email if ref.referee else "",
                referral_type=ref.referral_type or "platform",
                opportunity_title=ref.opportunity.title if ref.opportunity else None,
                code_used=ref.code_used,
                reward_amount=ref.reward_amount or 0,
                first_investment_rewarded=ref.first_investment_rewarded or False,
                rewarded_at=ref.rewarded_at.isoformat() if ref.rewarded_at else None,
                created_at=ref.created_at.isoformat() if ref.created_at else "",
                referee_status=status,
                referee_joined_at=ref.referee.created_at.isoformat()
                if ref.referee and ref.referee.created_at
                else None,
                referee_total_investments=n_inv,
            )
        )
    return items


# ── Trigger referral reward on first investment ──────────────────────────────


async def process_referral_reward_on_investment(
    db: AsyncSession,
    investor_user_id: uuid.UUID,
    investment_id: uuid.UUID,
) -> bool:
    """
    Called after a confirmed investment. If the investor was referred and
    this is their FIRST investment, mark the referral as rewarded.
    Returns True if a reward was granted.
    """
    # Find the referral where this user is the referee
    ref_result = await db.execute(select(Referral).where(Referral.referee_id == investor_user_id))
    referral = ref_result.scalar_one_or_none()
    if not referral:
        return False

    # Already rewarded
    if referral.first_investment_rewarded:
        return False

    # Mark as rewarded
    referral.first_investment_rewarded = True
    referral.reward_claimed = True
    referral.rewarded_investment_id = investment_id
    referral.rewarded_at = datetime.now(UTC)
    await db.flush()
    return True
