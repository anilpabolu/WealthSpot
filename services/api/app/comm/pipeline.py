"""Gate pipeline — preference / quiet-hours / frequency-cap / suppression checks."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

log = logging.getLogger(__name__)


@dataclass
class GateContext:
    user_id: str | None
    user_email: str | None
    user_phone: str | None
    channel: str
    event_name: str
    is_promotional: bool
    binding: Any  # CommBinding ORM row
    profile: Any | None  # CommUserProfile ORM row or None


async def evaluate_gates(ctx: GateContext, session: AsyncSession) -> tuple[bool, str | None]:
    """
    Returns (should_send, reason_if_blocked).

    Gates are applied in order; first failure short-circuits.
    """
    # 1. User preference check
    result = _check_preference(ctx)
    if result is not None:
        return False, result

    # 2. Quiet hours check
    result = _check_quiet_hours(ctx)
    if result is not None:
        return False, result

    # 3. Frequency cap (promotional only)
    if ctx.is_promotional:
        result = await _check_frequency_cap(ctx, session)
        if result is not None:
            return False, result

    # 4. Suppression check
    result = await _check_suppression(ctx, session)
    if result is not None:
        return False, result

    return True, None


# ---------------------------------------------------------------------------
# Individual gates
# ---------------------------------------------------------------------------


def _check_preference(ctx: GateContext) -> str | None:
    profile = ctx.profile
    if profile is None:
        return None  # No profile → allow by default

    ch = ctx.channel
    is_promo = ctx.is_promotional

    if ch == "email":
        flag = "promotional_email" if is_promo else "transactional_email"
    elif ch == "sms":
        flag = "promotional_sms" if is_promo else "transactional_sms"
    elif ch == "whatsapp":
        flag = "promotional_whatsapp" if is_promo else "transactional_whatsapp"
    else:
        return None  # in_app — no suppression via preferences

    if not getattr(profile, flag, True):
        return f"user_preference_blocked:{flag}"
    return None


def _check_quiet_hours(ctx: GateContext) -> str | None:
    profile = ctx.profile
    if profile is None:
        return None
    if not ctx.is_promotional:
        return None  # quiet hours apply to promotional only
    if not ctx.binding or not getattr(ctx.binding, "quiet_hours_aware", True):
        return None

    qs = getattr(profile, "quiet_hours_start", None)
    qe = getattr(profile, "quiet_hours_end", None)
    if qs is None or qe is None:
        return None

    tz_str = getattr(profile, "timezone", "Asia/Kolkata")
    try:
        import zoneinfo

        tz = zoneinfo.ZoneInfo(tz_str)
        now_local = datetime.now(tz).time()
    except Exception:
        now_local = datetime.now(UTC).time()

    in_quiet = (
        (qs < qe and qs <= now_local < qe)
        or (qs >= qe and (now_local >= qs or now_local < qe))
    )
    if in_quiet:
        return "quiet_hours"
    return None


async def _check_frequency_cap(ctx: GateContext, session: AsyncSession) -> str | None:
    if not ctx.user_id:
        return None
    profile = ctx.profile
    cap = getattr(profile, "frequency_cap_promotional_per_week", 3) if profile else 3
    if cap <= 0:
        return None

    from app.comm.models import CommMessage  # local import avoids circular

    seven_days_ago = func.now() - text("'7 days'::interval")

    stmt = (
        select(func.count())
        .select_from(CommMessage)
        .where(
            CommMessage.user_id == ctx.user_id,
            CommMessage.channel == ctx.channel,
            CommMessage.status.in_(["sent", "delivered", "opened", "clicked"]),
            CommMessage.created_at >= seven_days_ago,
        )
    )
    result = await session.execute(stmt)
    count = result.scalar_one()
    if count >= cap:
        return f"frequency_cap:{cap}/week"
    return None


async def _check_suppression(ctx: GateContext, session: AsyncSession) -> str | None:
    identifier: str | None = None
    ch = ctx.channel
    if ch == "email":
        identifier = ctx.user_email
    elif ch in ("sms", "whatsapp"):
        identifier = ctx.user_phone

    if not identifier:
        return None

    from app.comm.models import CommSuppressionEntry

    stmt = select(CommSuppressionEntry).where(
        CommSuppressionEntry.channel == ch,
        CommSuppressionEntry.identifier == identifier,
    )
    result = await session.execute(stmt)
    entry = result.scalar_one_or_none()
    if entry:
        return f"suppressed:{entry.reason}"
    return None
