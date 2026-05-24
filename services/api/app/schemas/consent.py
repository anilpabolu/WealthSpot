from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ConsentCreate(BaseModel):
    consent_type: str = Field(
        ..., description="The type of consent being given, e.g., 'LOGIN' or 'EOI'"
    )
    consented: bool = Field(
        ..., description="Whether the user consented (true) or declined (false)"
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


class ConsentResponse(BaseModel):
    id: str
    user_id: str
    consent_type: str
    consented: bool
    target_id: str | None
    ip_address: str | None
    user_agent: str | None
    location: str | None
    device_details: dict[str, Any] | None
    created_at: datetime

    class Config:
        from_attributes = True
