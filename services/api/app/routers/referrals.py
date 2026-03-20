"""
Referral router – code validation, tracking, rewards.
"""

import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.community import Referral
from app.models.user import User

router = APIRouter(prefix="/referrals", tags=["referrals"])


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
        .options(selectinload(Referral.referee))
        .where(Referral.referrer_id == user.id)
        .order_by(Referral.created_at.desc())
    )
    referrals = result.scalars().all()

    items: list[ReferralHistoryItem] = []
    for ref in referrals:
        referee = ref.referee
        status = "invested" if ref.reward_claimed else "signed_up"
        items.append(
            ReferralHistoryItem(
                id=ref.id,
                referee_name=referee.full_name if referee else "Unknown",
                referee_email=referee.email if referee else "",
                status=status,
                reward_amount=ref.reward_amount or 0,
                reward_claimed=ref.reward_claimed or False,
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
