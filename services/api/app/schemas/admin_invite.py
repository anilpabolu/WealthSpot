"""
Admin invite schemas (Pydantic v2).
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class AdminInviteCreate(BaseModel):
    email: EmailStr
    role: str = Field(pattern=r"^(admin|super_admin)$")


class AdminInviteRead(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    status: str
    expires_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}
