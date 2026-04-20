"""
Platform config schemas (Pydantic v2).
"""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ConfigRead(BaseModel):
    id: uuid.UUID
    section: str
    key: str
    value: Any = None
    description: str | None = None
    is_active: bool
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConfigUpdate(BaseModel):
    value: Any = None
    description: str | None = None
    is_active: bool | None = None


class ConfigCreate(BaseModel):
    section: str = Field(min_length=1, max_length=100)
    key: str = Field(min_length=1, max_length=255)
    value: Any = None
    description: str | None = None
    is_active: bool = True
