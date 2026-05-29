"""
Admin invite schemas (Pydantic v2).
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


class AdminInviteCreate(BaseModel):
    email: EmailStr
    role: str = Field(pattern=r"^(admin|super_admin)$")

    @field_validator("email", mode="before")
    @classmethod
    def lowercase_email(cls, v: str) -> str:
        return v.lower() if isinstance(v, str) else v


class AdminInviteRead(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    status: str
    expires_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}
