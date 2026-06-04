from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class FoundingTeamMemberBase(BaseModel):
    name: str = Field(..., max_length=255)
    title: str = Field(..., max_length=255)
    description: str
    previous_experience: list[str] = Field(default_factory=list)
    sort_order: int = 0
    is_active: bool = True


class FoundingTeamMemberCreate(FoundingTeamMemberBase):
    pass


class FoundingTeamMemberUpdate(BaseModel):
    name: str | None = Field(None, max_length=255)
    title: str | None = Field(None, max_length=255)
    description: str | None = None
    previous_experience: list[str] | None = None
    sort_order: int | None = None
    is_active: bool | None = None


class FoundingTeamMemberResponse(FoundingTeamMemberBase):
    id: UUID
    photo_url: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
