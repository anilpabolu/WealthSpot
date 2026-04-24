"""
Vault feature flag schemas (Pydantic v2).
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class VaultFeatureFlagRead(BaseModel):
    id: uuid.UUID
    vault_type: str
    role: str
    feature_key: str
    enabled: bool
    updated_at: datetime

    model_config = {"from_attributes": True}


class VaultFeatureFlagUpdate(BaseModel):
    """Bulk-update payload: list of flag toggles."""

    vault_type: str
    role: str
    feature_key: str
    enabled: bool


class VaultFeatureMatrixUpdate(BaseModel):
    """PUT /vault-features/matrix body."""

    updates: list[VaultFeatureFlagUpdate] = Field(min_length=1)


class MyFeatureFlags(BaseModel):
    """Flat map of feature_key → enabled, keyed by vault_type."""

    wealth: dict[str, bool] = {}
    safe: dict[str, bool] = {}
    opportunity: dict[str, bool] = {}
    community: dict[str, bool] = {}
