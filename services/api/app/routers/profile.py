"""
Profile completion router – step-by-step profiling, OTP verification, referral code.
"""

import hashlib
import logging
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.user import (
    FullProfileRead,
    OtpSendRequest,
    OtpVerifyRequest,
    ProfileCompletionResponse,
    ProfileSection1Update,
    ProfileSection2Update,
    ProfileSection3Update,
    ProfileSection4Update,
)
from app.services.email import send_otp_email
from app.services.sms import send_otp_sms, send_otp_whatsapp

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/profile", tags=["profile"])


# ── Helpers ──────────────────────────────────────────────────────────────────


def _hash_otp(otp: str) -> str:
    """Hash an OTP for safe storage."""
    return hashlib.sha256(otp.encode()).hexdigest()


def _generate_otp() -> str:
    """Generate a 6-digit OTP."""
    return f"{secrets.randbelow(900000) + 100000}"


def _calculate_completion(user: User) -> tuple[int, dict[str, bool]]:
    """Calculate profile completion percentage and per-section status."""
    sections: dict[str, bool] = {}

    # Section 1: Personal info (need at least 3 of name/DOB/gender/occupation)
    s1_fields = [
        user.full_name, user.date_of_birth, user.gender,
        user.occupation,
    ]
    s1_done = sum(1 for f in s1_fields if f) >= 3
    sections["personal"] = s1_done

    # Section 2: Interests (need at least 1 interest + 1 city)
    s2_done = bool(user.interests and len(user.interests) > 0 and
                   user.preferred_cities and len(user.preferred_cities) > 0)
    sections["interests"] = s2_done

    # Section 3: Address (need line1 + city + pincode)
    s3_done = bool(user.address_line1 and user.city and user.pincode)
    sections["address"] = s3_done

    # Section 4: Verification
    s4_done = user.email_verified and user.phone_verified
    sections["verification"] = s4_done

    completed = sum(1 for v in sections.values() if v)
    pct = round((completed / len(sections)) * 100)
    return pct, sections


# ── Endpoints ────────────────────────────────────────────────────────────────


@router.get("/completion", response_model=ProfileCompletionResponse)
async def get_profile_completion(
    user: User = Depends(get_current_user),
) -> ProfileCompletionResponse:
    """Get current profile completion status."""
    pct, sections = _calculate_completion(user)
    return ProfileCompletionResponse(
        profile_completion_pct=pct,
        sections=sections,
        email_verified=user.email_verified,
        phone_verified=user.phone_verified,
        referral_code=user.referral_code,
        is_complete=pct == 100,
    )


@router.get("/full", response_model=FullProfileRead)
async def get_full_profile(
    user: User = Depends(get_current_user),
) -> User:
    """Get all profile fields for the completion page."""
    return user


@router.put("/section/1", response_model=FullProfileRead)
async def update_section_1(
    body: ProfileSection1Update,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Update personal info & risk profile."""
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    pct, _ = _calculate_completion(user)
    user.profile_completion_pct = pct
    if pct == 100 and not user.profile_completed_at:
        user.profile_completed_at = datetime.now(timezone.utc)
        if not user.referral_code:
            user.referral_code = uuid.uuid4().hex[:8].upper()
    await db.flush()
    return user


@router.put("/section/2", response_model=FullProfileRead)
async def update_section_2(
    body: ProfileSection2Update,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Update interests & subscription preferences."""
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    pct, _ = _calculate_completion(user)
    user.profile_completion_pct = pct
    if pct == 100 and not user.profile_completed_at:
        user.profile_completed_at = datetime.now(timezone.utc)
        if not user.referral_code:
            user.referral_code = uuid.uuid4().hex[:8].upper()
    await db.flush()
    return user


@router.put("/section/3", response_model=FullProfileRead)
async def update_section_3(
    body: ProfileSection3Update,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Update skills & availability."""
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    pct, _ = _calculate_completion(user)
    user.profile_completion_pct = pct
    if pct == 100 and not user.profile_completed_at:
        user.profile_completed_at = datetime.now(timezone.utc)
        if not user.referral_code:
            user.referral_code = uuid.uuid4().hex[:8].upper()
    await db.flush()
    return user


@router.put("/section/4", response_model=FullProfileRead)
async def update_section_4(
    body: ProfileSection4Update,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Update address."""
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    pct, _ = _calculate_completion(user)
    user.profile_completion_pct = pct
    if pct == 100 and not user.profile_completed_at:
        user.profile_completed_at = datetime.now(timezone.utc)
        if not user.referral_code:
            user.referral_code = uuid.uuid4().hex[:8].upper()
    await db.flush()
    return user


# ── Phone Update ─────────────────────────────────────────────────────────────


class PhoneUpdateRequest(BaseModel):
    phone: str = Field(min_length=10, max_length=15, pattern=r"^\+?\d{10,15}$")


@router.put("/phone")
async def update_phone(
    body: PhoneUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Update user's phone number (resets phone verification)."""
    user.phone = body.phone
    user.phone_verified = False
    user.phone_otp_hash = None
    user.phone_otp_expires_at = None
    pct, _ = _calculate_completion(user)
    user.profile_completion_pct = pct
    await db.flush()
    return {"phone": user.phone, "phone_verified": False}


# ── OTP Verification ────────────────────────────────────────────────────────


@router.post("/otp/send")
async def send_otp(
    body: OtpSendRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Generate and send an OTP for email or phone verification."""
    settings = get_settings()
    otp = _generate_otp()
    otp_hash = _hash_otp(otp)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.otp_expiry_minutes)

    sent = False

    if body.channel == "email":
        if user.email_verified:
            raise HTTPException(status_code=400, detail="Email already verified")
        user.email_otp_hash = otp_hash
        user.email_otp_expires_at = expires_at
        sent = await send_otp_email(user.email, otp)
        if not sent:
            logger.warning("OTP delivery failed for %s email (email service unavailable)", user.email)
    else:
        if user.phone_verified:
            raise HTTPException(status_code=400, detail="Phone already verified")
        if not user.phone:
            raise HTTPException(status_code=400, detail="No phone number on file")
        user.phone_otp_hash = otp_hash
        user.phone_otp_expires_at = expires_at
        # Try SMS first, then WhatsApp as fallback
        sent = await send_otp_sms(user.phone, otp)
        if not sent:
            sent = await send_otp_whatsapp(user.phone, otp)
        if not sent:
            logger.warning("OTP delivery failed for %s phone (SMS/WhatsApp service unavailable)", user.phone)

    await db.flush()

    result: dict = {
        "message": f"OTP sent to your {body.channel}",
        "channel": body.channel,
        "expires_in_seconds": 600,
        "delivered": sent,
    }
    # In non-production environments, return OTP for testing
    if settings.app_env in ("development", "testing"):
        result["dev_otp"] = otp

    return result


@router.post("/otp/verify")
async def verify_otp(
    body: OtpVerifyRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Verify an OTP for email or phone."""
    otp_hash = _hash_otp(body.otp)
    now = datetime.now(timezone.utc)

    if body.channel == "email":
        if user.email_verified:
            raise HTTPException(status_code=400, detail="Email already verified")
        if not user.email_otp_hash:
            raise HTTPException(status_code=400, detail="No OTP requested")
        if user.email_otp_expires_at and user.email_otp_expires_at < now:
            raise HTTPException(status_code=400, detail="OTP expired")
        if otp_hash != user.email_otp_hash:
            raise HTTPException(status_code=400, detail="Invalid OTP")
        user.email_verified = True
        user.email_otp_hash = None
        user.email_otp_expires_at = None
    else:
        if user.phone_verified:
            raise HTTPException(status_code=400, detail="Phone already verified")
        if not user.phone_otp_hash:
            raise HTTPException(status_code=400, detail="No OTP requested")
        if user.phone_otp_expires_at and user.phone_otp_expires_at < now:
            raise HTTPException(status_code=400, detail="OTP expired")
        if otp_hash != user.phone_otp_hash:
            raise HTTPException(status_code=400, detail="Invalid OTP")
        user.phone_verified = True
        user.phone_otp_hash = None
        user.phone_otp_expires_at = None

    # Recalculate completion
    pct, _ = _calculate_completion(user)
    user.profile_completion_pct = pct
    if pct == 100 and not user.profile_completed_at:
        user.profile_completed_at = datetime.now(timezone.utc)
        if not user.referral_code:
            user.referral_code = uuid.uuid4().hex[:8].upper()

    await db.flush()

    return {
        "message": f"{body.channel.title()} verified successfully",
        "channel": body.channel,
        "verified": True,
        "profile_completion_pct": user.profile_completion_pct,
    }
