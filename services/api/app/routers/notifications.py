"""
Notification router – list, mark read, get unread count.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.notification import Notification
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
        Notification.user_id == user.id, Notification.is_read == False  # noqa: E712
    )
    unread_count = (await db.execute(unread_q)).scalar() or 0

    query = base.order_by(Notification.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
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
        Notification.user_id == user.id, Notification.is_read == False  # noqa: E712
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
    now = datetime.now(timezone.utc)

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
