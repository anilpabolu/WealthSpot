"""
User & Auth schemas (Pydantic v2).
"""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

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


# ── Profile Completion ───────────────────────────────────────────────────────


class ProfileSection1Update(BaseModel):
    """Step 1: Personal & Risk Profile"""
    full_name: str | None = Field(None, min_length=2, max_length=255)
    date_of_birth: date | None = None
    gender: str | None = None
    occupation: str | None = None
    annual_income: str | None = None
    investment_experience: str | None = None
    risk_tolerance: str | None = None
    investment_horizon: str | None = None
    monthly_investment_capacity: str | None = None


class ProfileSection2Update(BaseModel):
    """Step 2: Interests & Subscriptions"""
    interests: list[str] | None = None
    preferred_cities: list[str] | None = None
    subscription_topics: list[str] | None = None


class ProfileSection3Update(BaseModel):
    """Step 3: Skills & Availability"""
    skills: list[str] | None = None
    weekly_hours_available: str | None = None
    contribution_interests: list[str] | None = None
    bio: str | None = None


class ProfileSection4Update(BaseModel):
    """Step 4: Address"""
    address_line1: str | None = Field(None, max_length=255)
    address_line2: str | None = Field(None, max_length=255)
    city: str | None = Field(None, max_length=100)
    state: str | None = Field(None, max_length=100)
    pincode: str | None = Field(None, pattern=r"^\d{6}$")
    country: str | None = Field(None, max_length=50)


class OtpSendRequest(BaseModel):
    channel: str = Field(pattern=r"^(email|phone)$")


class OtpVerifyRequest(BaseModel):
    channel: str = Field(pattern=r"^(email|phone)$")
    otp: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class ProfileCompletionResponse(BaseModel):
    profile_completion_pct: int
    sections: dict[str, bool]
    email_verified: bool
    phone_verified: bool
    referral_code: str | None = None
    is_complete: bool

    model_config = {"from_attributes": True}


class FullProfileRead(BaseModel):
    """All profile fields for the completion page."""
    id: uuid.UUID
    email: str
    full_name: str | None = None
    phone: str | None = None
    avatar_url: str | None = None
    role: str
    kyc_status: str

    # Risk profile
    date_of_birth: date | None = None
    gender: str | None = None
    occupation: str | None = None
    annual_income: str | None = None
    investment_experience: str | None = None
    risk_tolerance: str | None = None
    investment_horizon: str | None = None
    monthly_investment_capacity: str | None = None

    # Interests
    interests: list[str] | None = None
    preferred_cities: list[str] | None = None
    subscription_topics: list[str] | None = None

    # Skills
    skills: list[str] | None = None
    weekly_hours_available: str | None = None
    contribution_interests: list[str] | None = None
    bio: str | None = None

    # Address
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None
    country: str | None = None

    # Verification
    email_verified: bool = False
    phone_verified: bool = False
    profile_completion_pct: int = 0
    profile_completed_at: datetime | None = None
    referral_code: str | None = None

    model_config = {"from_attributes": True}


# ── KYC ──────────────────────────────────────────────────────────────────────


class KycSubmission(BaseModel):
    full_name: str = Field(min_length=2)
    pan_number: str = Field(pattern=r"^[A-Z]{5}[0-9]{4}[A-Z]$")
    date_of_birth: str
    address: str = Field(min_length=10)
    city: str
    pincode: str = Field(pattern=r"^\d{6}$")

    @field_validator("pan_number", mode="before")
    @classmethod
    def uppercase_pan(cls, v: str) -> str:
        return v.upper() if isinstance(v, str) else v


class KycStatusResponse(BaseModel):
    kyc_status: KycStatus
    message: str


class KycDetailsResponse(BaseModel):
    kyc_status: KycStatus
    full_name: str | None = None
    pan_number_masked: str | None = None
    date_of_birth: date | None = None
    address: str | None = None
    city: str | None = None
    pincode: str | None = None


class KycDocumentOut(BaseModel):
    id: uuid.UUID
    document_type: str
    s3_key: str
    original_filename: str | None = None
    file_size_bytes: int | None = None
    mime_type: str | None = None
    verification_status: str
    rejection_reason: str | None = None
    download_url: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class KycDocumentRecord(BaseModel):
    document_type: str
    file_key: str


# ── Bank Details ─────────────────────────────────────────────────────────────


class BankDetailCreate(BaseModel):
    account_holder_name: str = Field(min_length=2, max_length=255)
    account_number: str = Field(min_length=8, max_length=18, pattern=r"^\d{8,18}$")
    ifsc_code: str = Field(pattern=r"^[A-Z]{4}0[A-Z0-9]{6}$")
    bank_name: str = Field(min_length=2, max_length=100)
    branch_name: str | None = Field(None, max_length=100)
    account_type: str = Field(default="savings", pattern=r"^(savings|current)$")

    @field_validator("ifsc_code", mode="before")
    @classmethod
    def uppercase_ifsc(cls, v: str) -> str:
        return v.upper() if isinstance(v, str) else v


class BankDetailUpdate(BaseModel):
    account_holder_name: str | None = Field(None, min_length=2, max_length=255)
    account_number: str | None = Field(None, min_length=8, max_length=18, pattern=r"^\d{8,18}$")
    ifsc_code: str | None = Field(None, pattern=r"^[A-Z]{4}0[A-Z0-9]{6}$")
    bank_name: str | None = Field(None, min_length=2, max_length=100)
    branch_name: str | None = Field(None, max_length=100)
    account_type: str | None = Field(None, pattern=r"^(savings|current)$")

    @field_validator("ifsc_code", mode="before")
    @classmethod
    def uppercase_ifsc(cls, v: str | None) -> str | None:
        return v.upper() if isinstance(v, str) else v


class BankDetailOut(BaseModel):
    id: uuid.UUID
    account_holder_name: str
    account_number_masked: str
    ifsc_code: str
    bank_name: str
    branch_name: str | None = None
    account_type: str
    is_primary: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
