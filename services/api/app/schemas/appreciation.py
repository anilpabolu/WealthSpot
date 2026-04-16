"""
Appreciation schemas (Pydantic v2).
"""

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class AppreciationCreateRequest(BaseModel):
    mode: Literal["percentage", "absolute"]
    value: float = Field(gt=0, description="Positive appreciation amount (% or absolute ₹)")
    note: str | None = Field(None, max_length=500)


class AppreciationEventRead(BaseModel):
    id: uuid.UUID
    opportunity_id: uuid.UUID
    created_by: uuid.UUID | None = None
    creator_name: str | None = None
    mode: str
    input_value: float
    old_valuation: float
    new_valuation: float
    note: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
