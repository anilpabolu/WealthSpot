"""
Admin router – user management, property approval, KYC review, analytics.
"""

import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.middleware.audit import log_audit_event
from app.middleware.auth import require_role
from app.models.investment import Investment, InvestmentStatus
from app.models.opportunity import Opportunity
from app.models.property import Property, PropertyStatus
from app.models.user import KycStatus, User, UserRole
from app.models.user_visit_log import UserVisitLog
from app.schemas.property import PropertyDetail
from app.schemas.user import UserRead

router = APIRouter(prefix="/admin", tags=["admin"])

admin_dep = require_role(UserRole.ADMIN)


# ── Dashboard stats ──────────────────────────────────────────────────────────


@router.get("/stats")
async def admin_stats(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(admin_dep),
) -> dict[str, Any]:
    """Aggregated platform statistics for admin dashboard."""
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    total_properties = (await db.execute(select(func.count(Property.id)))).scalar() or 0
    active_properties = (
        await db.execute(
            select(func.count(Property.id)).where(
                Property.status.in_([PropertyStatus.ACTIVE, PropertyStatus.FUNDING])
            )
        )
    ).scalar() or 0

    aum = (
        await db.execute(
            select(func.sum(Investment.amount)).where(
                Investment.status == InvestmentStatus.CONFIRMED
            )
        )
    ).scalar() or 0

    pending_kyc = (
        await db.execute(
            select(func.count(User.id)).where(User.kyc_status == KycStatus.UNDER_REVIEW)
        )
    ).scalar() or 0

    return {
        "total_users": total_users,
        "total_properties": total_properties,
        "active_properties": active_properties,
        "aum": float(aum),
        "pending_kyc": pending_kyc,
    }


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
    query = select(User)
    if role:
        query = query.where(User.role == role)
    if kyc_status:
        query = query.where(User.kyc_status == kyc_status)
    query = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    return [UserRead.model_validate(u) for u in result.scalars().all()]


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
    total = (await db.execute(select(func.count(UserVisitLog.id)))).scalar() or 0

    stmt = (
        select(UserVisitLog)
        .options(selectinload(UserVisitLog.user))
        .order_by(UserVisitLog.last_visited_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(stmt)
    logs = result.scalars().all()

    opp_ids = []
    for log in logs:
        if log.source_type == "opportunity":
            try:
                opp_ids.append(uuid.UUID(log.source_id))
            except ValueError:
                pass

    opp_map = {}
    if opp_ids:
        opp_stmt = select(Opportunity).where(Opportunity.id.in_(opp_ids))
        opp_result = await db.execute(opp_stmt)
        for opp in opp_result.scalars().all():
            opp_map[str(opp.id)] = opp

    items = []
    for log in logs:
        vault_name = log.source_id.capitalize() if log.source_type == "vault" else None
        property_name = None

        if log.source_type == "opportunity":
            opp = opp_map.get(log.source_id)
            if opp:
                property_name = opp.title
                vault_name = opp.vault_type.value.capitalize() if opp.vault_type else None

        items.append(
            UserVisitLogRead(
                id=log.id,
                user_name=log.user.full_name if log.user else None,
                email=log.user.email if log.user else None,
                source_type=log.source_type,
                source_id=log.source_id,
                vault_name=vault_name,
                property_name=property_name,
                action=log.action,
                visit_count=log.visit_count,
                last_visited_at=log.last_visited_at,
            )
        )

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
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    previous_status = user.kyc_status
    user.kyc_status = KycStatus.APPROVED
    await db.flush()
    await log_audit_event(
        actor_id=admin_user.id,
        action="kyc.approved",
        resource_type="user",
        resource_id=str(user.id),
        details={
            "previous_status": previous_status.value
            if hasattr(previous_status, "value")
            else str(previous_status)
        },
        request=request,
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
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    previous_status = user.kyc_status
    user.kyc_status = KycStatus.REJECTED
    await db.flush()
    await log_audit_event(
        actor_id=admin_user.id,
        action="kyc.rejected",
        resource_type="user",
        resource_id=str(user.id),
        details={
            "previous_status": previous_status.value
            if hasattr(previous_status, "value")
            else str(previous_status)
        },
        request=request,
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
    result = await db.execute(
        select(Property).options(selectinload(Property.builder)).where(Property.slug == slug)
    )
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    if prop.status != PropertyStatus.UNDER_REVIEW:
        raise HTTPException(status_code=400, detail="Property is not under review")

    prop.status = PropertyStatus.ACTIVE
    await db.flush()
    return PropertyDetail.model_validate(prop)


@router.post("/properties/{slug}/reject")
async def reject_property(
    slug: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(admin_dep),
) -> dict[str, str]:
    """Reject a property listing."""
    result = await db.execute(select(Property).where(Property.slug == slug))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    if prop.status not in (PropertyStatus.UNDER_REVIEW, PropertyStatus.ACTIVE):
        raise HTTPException(
            status_code=400, detail="Only properties under review or active can be rejected"
        )

    prop.status = PropertyStatus.REJECTED
    await db.flush()
    return {"status": "rejected", "slug": slug}
