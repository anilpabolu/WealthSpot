"""
Notification router – list, mark read, get unread count, enquiry.
"""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.notification import Notification
from app.models.property import Property
from app.models.user import User
from app.schemas.notification import MarkReadRequest, NotificationRead, PaginatedNotifications

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=PaginatedNotifications)
async def list_notifications(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    unread_only: bool = Query(False),
) -> PaginatedNotifications:
    """List user's notifications, newest first."""
    base = select(Notification).where(Notification.user_id == user.id)
    if unread_only:
        base = base.where(Notification.is_read == False)  # noqa: E712

    total_q = select(func.count()).select_from(base.subquery())
    total = (await db.execute(total_q)).scalar() or 0

    unread_q = select(func.count()).where(
        Notification.user_id == user.id,
        Notification.is_read == False,  # noqa: E712
    )
    unread_count = (await db.execute(unread_q)).scalar() or 0

    query = (
        base.order_by(Notification.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(query)
    items = [NotificationRead.model_validate(n) for n in result.scalars().all()]

    total_pages = max(1, (total + page_size - 1) // page_size)
    return PaginatedNotifications(
        items=items, total=total, unread_count=unread_count, page=page, total_pages=total_pages
    )


@router.get("/unread-count")
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, int]:
    """Return count of unread notifications."""
    q = select(func.count()).where(
        Notification.user_id == user.id,
        Notification.is_read == False,  # noqa: E712
    )
    count = (await db.execute(q)).scalar() or 0
    return {"unread_count": count}


@router.post("/mark-read")
async def mark_read(
    payload: MarkReadRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, str]:
    """Mark notifications as read. If no IDs provided, marks all as read."""
    now = datetime.now(UTC)

    if payload.notification_ids:
        stmt = (
            update(Notification)
            .where(
                Notification.user_id == user.id,
                Notification.id.in_(payload.notification_ids),
                Notification.is_read == False,  # noqa: E712
            )
            .values(is_read=True, read_at=now)
        )
    else:
        stmt = (
            update(Notification)
            .where(Notification.user_id == user.id, Notification.is_read == False)  # noqa: E712
            .values(is_read=True, read_at=now)
        )

    await db.execute(stmt)
    await db.commit()
    return {"status": "ok"}


class EnquiryRequest(BaseModel):
    property_id: str
    message: str = ""


@router.post("/enquiry")
async def send_enquiry(
    payload: EnquiryRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, str]:
    """Send an enquiry about a property. Notifies the builder and/or referrer."""
    # Look up the property to find builder and referrer
    prop = (
        await db.execute(select(Property).where(Property.id == payload.property_id))
    ).scalar_one_or_none()

    if not prop:
        return {"status": "error", "message": "Property not found"}

    recipients: list[str] = []
    if prop.builder_id:
        recipients.append(str(prop.builder_id))
    if prop.referrer_user_id:
        recipients.append(str(prop.referrer_user_id))

    sender_name = user.full_name or user.email or "A user"
    now = datetime.now(UTC)

    for recipient_id in recipients:
        notif = Notification(
            user_id=recipient_id,
            type="enquiry",
            channel="in_app",
            title=f"New enquiry for {prop.title}",
            body=payload.message or f"{sender_name} is interested in '{prop.title}'",
            data={"property_id": str(prop.id), "enquirer_id": str(user.id)},
            created_at=now,
        )
        db.add(notif)

    await db.commit()
    return {"status": "ok"}


# ── Notification Preferences ─────────────────────────────────────────────────

DEFAULT_NOTIFICATION_PREFS = {
    "investment_confirmations": True,
    "rental_income": True,
    "property_updates": True,
    "new_properties": False,
    "community_activity": False,
    "marketing_emails": False,
}


class NotificationPreferencesUpdate(BaseModel):
    investment_confirmations: bool | None = None
    rental_income: bool | None = None
    property_updates: bool | None = None
    new_properties: bool | None = None
    community_activity: bool | None = None
    marketing_emails: bool | None = None


@router.get("/preferences")
async def get_notification_preferences(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Return the user's notification preferences (merged with defaults)."""
    saved = user.notification_preferences or {}
    return {**DEFAULT_NOTIFICATION_PREFS, **saved}


@router.put("/preferences")
async def update_notification_preferences(
    payload: NotificationPreferencesUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Update the user's notification preferences (partial update)."""
    current = user.notification_preferences or {}
    updates = payload.model_dump(exclude_none=True)
    merged = {**DEFAULT_NOTIFICATION_PREFS, **current, **updates}
    user.notification_preferences = merged
    await db.commit()
    await db.refresh(user)
    return user.notification_preferences
