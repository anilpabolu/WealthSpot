"""
Referral router – code validation, tracking, rewards.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.community import Referral
from app.models.user import User

router = APIRouter(prefix="/referrals", tags=["referrals"])


class ReferralStats(BaseModel):
    referral_code: str
    total_referrals: int
    successful_referrals: int
    total_rewards: int  # in paise


class ReferralApply(BaseModel):
    code: str


@router.get("/stats", response_model=ReferralStats)
async def referral_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReferralStats:
    """Get referral stats for the current user."""
    total = (
        await db.execute(
            select(func.count(Referral.id)).where(Referral.referrer_id == user.id)
        )
    ).scalar() or 0

    successful = (
        await db.execute(
            select(func.count(Referral.id)).where(
                Referral.referrer_id == user.id,
                Referral.reward_claimed.is_(True),
            )
        )
    ).scalar() or 0

    rewards = (
        await db.execute(
            select(func.sum(Referral.reward_amount)).where(
                Referral.referrer_id == user.id
            )
        )
    ).scalar() or 0

    return ReferralStats(
        referral_code=user.referral_code or "",
        total_referrals=total,
        successful_referrals=successful,
        total_rewards=rewards,
    )


@router.post("/apply")
async def apply_referral_code(
    body: ReferralApply,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Apply a referral code during onboarding."""
    # Check if user already has a referral
    existing = await db.execute(
        select(Referral).where(Referral.referee_id == user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Referral already applied")

    # Find referrer
    referrer_result = await db.execute(
        select(User).where(User.referral_code == body.code.upper())
    )
    referrer = referrer_result.scalar_one_or_none()
    if not referrer:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    if referrer.id == user.id:
        raise HTTPException(status_code=400, detail="Cannot refer yourself")

    referral = Referral(
        referrer_id=referrer.id,
        referee_id=user.id,
        code_used=body.code.upper(),
        reward_amount=25000,  # ₹250 in paise
    )
    db.add(referral)

    user.referred_by = referrer.id
    await db.flush()

    return {"message": "Referral applied successfully", "reward": "₹250"}
