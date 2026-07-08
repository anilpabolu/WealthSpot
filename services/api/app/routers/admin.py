"""
Admin router – user management, property approval, KYC review, analytics.
"""

import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import require_role
from app.models.property import PropertyStatus
from app.models.user import KycStatus, User, UserRole
from app.schemas.property import PropertyDetail
from app.schemas.user import UserRead

router = APIRouter(prefix="/admin", tags=["admin"])

admin_dep = require_role(UserRole.ADMIN)


from app.services.admin_service import (
    get_admin_stats,
    get_user_visits_list,
    get_users_list,
    set_kyc_status,
    set_property_status,
)

# ── Dashboard stats ──────────────────────────────────────────────────────────


@router.get("/stats")
async def admin_stats(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(admin_dep),
) -> dict[str, Any]:
    """Aggregated platform statistics for admin dashboard."""
    return await get_admin_stats(db)


# ── User management ─────────────────────────────────────────────────────────


@router.get("/users", response_model=list[UserRead])
async def list_users(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(admin_dep),
    role: UserRole | None = Query(None),
    kyc_status: KycStatus | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> list[UserRead]:
    """List all users with optional filters."""
    users = await get_users_list(db, role, kyc_status, page, page_size)
    return [UserRead.model_validate(u) for u in users]


# ── Activity Logs ────────────────────────────────────────────────────────────


class UserVisitLogRead(BaseModel):
    id: uuid.UUID
    user_name: str | None
    email: str | None
    source_type: str
    source_id: str
    vault_name: str | None
    property_name: str | None
    action: str
    visit_count: int
    last_visited_at: datetime | None

    class Config:
        from_attributes = True


class UserVisitLogResponse(BaseModel):
    items: list[UserVisitLogRead]
    total: int


@router.get("/user-visits", response_model=UserVisitLogResponse)
async def list_user_visits(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(admin_dep),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """List user activity/visits for vaults and opportunities."""
    items_data, total = await get_user_visits_list(db, page, page_size)
    items = [UserVisitLogRead(**item) for item in items_data]
    return UserVisitLogResponse(items=items, total=total)


# ── KYC Review ───────────────────────────────────────────────────────────────


@router.post("/kyc/{user_id}/approve")
async def approve_kyc(
    user_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(admin_dep),
) -> dict[str, str]:
    """Approve a user's KYC."""
    user = await set_kyc_status(
        db=db,
        user_id=user_id,
        admin_user=admin_user,
        request=request,
        new_status=KycStatus.APPROVED,
        action_log="kyc.approved",
    )
    return {"status": "approved", "user_id": str(user.id)}


@router.post("/kyc/{user_id}/reject")
async def reject_kyc(
    user_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(admin_dep),
) -> dict[str, str]:
    """Reject a user's KYC."""
    user = await set_kyc_status(
        db=db,
        user_id=user_id,
        admin_user=admin_user,
        request=request,
        new_status=KycStatus.REJECTED,
        action_log="kyc.rejected",
    )
    return {"status": "rejected", "user_id": str(user.id)}


# ── Property approval ───────────────────────────────────────────────────────


@router.post("/properties/{slug}/approve", response_model=PropertyDetail)
async def approve_property(
    slug: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(admin_dep),
) -> PropertyDetail:
    """Approve a property listing for the marketplace."""
    prop = await set_property_status(db, slug, PropertyStatus.ACTIVE)
    return PropertyDetail.model_validate(prop)


@router.post("/properties/{slug}/reject")
async def reject_property(
    slug: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(admin_dep),
) -> dict[str, str]:
    """Reject a property listing."""
    await set_property_status(db, slug, PropertyStatus.REJECTED)
    return {"status": "rejected", "slug": slug}
