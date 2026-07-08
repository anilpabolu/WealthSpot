import uuid
from typing import Any

from fastapi import HTTPException, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.middleware.audit import log_audit_event
from app.models.investment import Investment, InvestmentStatus
from app.models.opportunity import Opportunity
from app.models.property import Property, PropertyStatus
from app.models.user import KycStatus, User, UserRole
from app.models.user_visit_log import UserVisitLog


async def get_admin_stats(db: AsyncSession) -> dict[str, Any]:
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


async def get_users_list(
    db: AsyncSession,
    role: UserRole | None = None,
    kyc_status: KycStatus | None = None,
    page: int = 1,
    page_size: int = 20,
) -> list[User]:
    query = select(User)
    if role:
        query = query.where(User.role == role)
    if kyc_status:
        query = query.where(User.kyc_status == kyc_status)
    query = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_user_visits_list(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[dict], int]:
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
            log_opp = opp_map.get(log.source_id)
            if log_opp:
                property_name = log_opp.title
                vault_name = log_opp.vault_type.value.capitalize() if log_opp.vault_type else None

        items.append(
            {
                "id": log.id,
                "user_name": log.user.full_name if log.user else None,
                "email": log.user.email if log.user else None,
                "source_type": log.source_type,
                "source_id": log.source_id,
                "vault_name": vault_name,
                "property_name": property_name,
                "action": log.action,
                "visit_count": log.visit_count,
                "last_visited_at": log.last_visited_at,
            }
        )

    return items, total


async def set_kyc_status(
    db: AsyncSession,
    user_id: str,
    admin_user: User,
    request: Request,
    new_status: KycStatus,
    action_log: str,
) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    previous_status = user.kyc_status
    user.kyc_status = new_status
    await db.flush()
    await log_audit_event(
        actor_id=admin_user.id,
        action=action_log,
        resource_type="user",
        resource_id=str(user.id),
        details={
            "previous_status": previous_status.value
            if hasattr(previous_status, "value")
            else str(previous_status)
        },
        request=request,
    )
    return user


async def set_property_status(
    db: AsyncSession,
    slug: str,
    new_status: PropertyStatus,
) -> Property:
    result = await db.execute(
        select(Property).options(selectinload(Property.builder)).where(Property.slug == slug)
    )
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    if new_status == PropertyStatus.ACTIVE and prop.status != PropertyStatus.UNDER_REVIEW:
        raise HTTPException(status_code=400, detail="Property is not under review")
    if new_status == PropertyStatus.REJECTED and prop.status not in (
        PropertyStatus.UNDER_REVIEW,
        PropertyStatus.ACTIVE,
    ):
        raise HTTPException(
            status_code=400, detail="Only properties under review or active can be rejected"
        )

    prop.status = new_status
    await db.flush()
    return prop
