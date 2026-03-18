"""
User & Auth schemas (Pydantic v2).
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.user import KycStatus, UserRole


# ── Auth ─────────────────────────────────────────────────────────────────────


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
    type: str
    exp: datetime


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# ── User ─────────────────────────────────────────────────────────────────────


class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=255)
    phone: str | None = None
    role: UserRole = UserRole.INVESTOR


class UserCreate(UserBase):
    clerk_id: str | None = None


class UserUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    avatar_url: str | None = None


class UserRead(UserBase):
    id: uuid.UUID
    avatar_url: str | None = None
    kyc_status: KycStatus
    referral_code: str | None = None
    wealth_pass_active: bool
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserProfile(UserRead):
    """Extended profile for authenticated /me endpoint."""
    pass


# ── KYC ──────────────────────────────────────────────────────────────────────


class KycSubmission(BaseModel):
    full_name: str = Field(min_length=2)
    pan_number: str = Field(pattern=r"^[A-Z]{5}[0-9]{4}[A-Z]$")
    date_of_birth: str
    address: str = Field(min_length=10)
    city: str
    pincode: str = Field(pattern=r"^\d{6}$")


class KycStatusResponse(BaseModel):
    kyc_status: KycStatus
    message: str
