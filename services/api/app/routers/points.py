"""
Points router – user points leaderboard and individual totals.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.user_point import UserPoint

router = APIRouter(prefix="/points", tags=["points"])


@router.get("/me")
async def my_points(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Return the authenticated user's total points and breakdown by action."""
    total = (
        await db.execute(
            select(func.coalesce(func.sum(UserPoint.points), 0)).where(UserPoint.user_id == user.id)
        )
    ).scalar_one()

    breakdown_q = (
        select(UserPoint.action, func.sum(UserPoint.points).label("total"))
        .where(UserPoint.user_id == user.id)
        .group_by(UserPoint.action)
    )
    rows = (await db.execute(breakdown_q)).all()
    breakdown = {row.action: row.total for row in rows}

    # Recent activity (last 10)
    recent_q = (
        select(UserPoint)
        .where(UserPoint.user_id == user.id)
        .order_by(UserPoint.created_at.desc())
        .limit(10)
    )
    recent = (await db.execute(recent_q)).scalars().all()

    return {
        "total_points": total,
        "breakdown": breakdown,
        "recent": [
            {
                "action": r.action,
                "points": r.points,
                "description": r.description,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in recent
        ],
    }


@router.get("/leaderboard")
async def leaderboard(
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    """Top 20 contributors by points."""
    q = (
        select(
            UserPoint.user_id,
            func.sum(UserPoint.points).label("total"),
        )
        .group_by(UserPoint.user_id)
        .order_by(func.sum(UserPoint.points).desc())
        .limit(20)
    )
    rows = (await db.execute(q)).all()

    # Bulk-fetch user names
    user_ids = [r.user_id for r in rows]
    if not user_ids:
        return []

    users_q = await db.execute(select(User).where(User.id.in_(user_ids)))
    user_map = {u.id: u for u in users_q.scalars().all()}

    return [
        {
            "user_id": str(r.user_id),
            "full_name": user_map.get(r.user_id, User()).full_name or "Unknown",
            "avatar_url": getattr(user_map.get(r.user_id), "avatar_url", None),
            "total_points": r.total,
        }
        for r in rows
    ]
