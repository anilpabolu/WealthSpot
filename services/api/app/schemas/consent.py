from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ConsentCreate(BaseModel):
    context: str = Field(
        ..., description="The context of consent being given, e.g., 'ONBOARDING' or 'EOI'"
    )
    consent_version: str = Field("v1.0", description="The version of the consent text accepted")
    regulatory_accepted: bool = Field(
        ..., description="Whether the user accepted the regulatory terms"
    )
    privacy_accepted: bool = Field(..., description="Whether the user accepted the privacy terms")
    communication_accepted: bool = Field(
        ..., description="Whether the user accepted communication terms"
    )
    target_id: str | None = Field(
        None, description="Optional target ID, e.g., opportunity_id for EOI"
    )
    location: str | None = Field(
        None, description="Location of the user, e.g., obtained from client-side geolocation"
    )
    device_details: dict[str, Any] | None = Field(
        None, description="Device specifics (browser, OS, viewport) captured by client"
    )


import uuid


class ConsentResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    context: str
    consent_version: str
    regulatory_accepted: bool
    privacy_accepted: bool
    communication_accepted: bool
    target_id: str | None
    ip_address: str | None
    user_agent: str | None
    location: str | None
    device_details: dict[str, Any] | None
    created_at: datetime

    class Config:
        from_attributes = True


class ConsentStatusResponse(BaseModel):
    has_consented: bool
    consent_version: str
