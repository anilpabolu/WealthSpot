"""Points service – awards gamification points to users based on platform activities."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.platform_config import PlatformConfig
from app.models.user_point import UserPoint


async def _get_point_value(db: AsyncSession, action: str) -> int:
    """Look up point value from platform_configs (section=points)."""
    result = await db.execute(
        select(PlatformConfig).where(
            PlatformConfig.section == "points", PlatformConfig.key == action
        )
    )
    cfg = result.scalar_one_or_none()
    if not cfg:
        return 0
    val = cfg.value
    if isinstance(val, dict):
        return int(val.get("value", 0))
    try:
        return int(val)
    except (TypeError, ValueError):
        return 0


async def award_points(
    db: AsyncSession,
    *,
    user_id: str,
    action: str,
    reference_type: str | None = None,
    reference_id: str | None = None,
    description: str | None = None,
) -> int:
    """Award points for an action. Returns the number of points awarded."""
    points = await _get_point_value(db, action)
    if points <= 0:
        return 0

    entry = UserPoint(
        user_id=user_id,
        action=action,
        points=points,
        reference_type=reference_type,
        reference_id=reference_id,
        description=description,
    )
    db.add(entry)
    await db.flush()
    return points
