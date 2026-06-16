"""
Source-clicks router — public endpoints for tracking vault & opportunity
visit counts.

POST /{source_type}/{source_id}  — atomically increment click_count
GET  /                           — bulk-fetch all source click records
GET  /{source_type}/{source_id}  — single source click count
"""

import logging
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_optional_user
from app.models.source_click import SourceClick
from app.models.user import User
from app.models.user_visit_log import UserVisitLog

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/source-clicks", tags=["source-clicks"])

VALID_SOURCE_TYPES = {"vault", "opportunity"}


# ── Response schemas ─────────────────────────────────────────────────────────


class SourceClickRead(BaseModel):
    source_type: str
    source_id: str
    click_count: int

    class Config:
        from_attributes = True


class SourceClickBulkResponse(BaseModel):
    items: list[SourceClickRead]


# ── Endpoints ────────────────────────────────────────────────────────────────


@router.get("", response_model=SourceClickBulkResponse)
async def get_all_source_clicks(
    db: AsyncSession = Depends(get_db),
):
    """Return all source click records (for bulk fetching by frontend)."""
    result = await db.execute(select(SourceClick))
    rows = result.scalars().all()
    return SourceClickBulkResponse(
        items=[
            SourceClickRead(
                source_type=r.source_type,
                source_id=r.source_id,
                click_count=r.click_count,
            )
            for r in rows
        ]
    )


@router.get("/{source_type}/{source_id}", response_model=SourceClickRead)
async def get_source_click(
    source_type: str,
    source_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Return click count for a single source."""
    if source_type not in VALID_SOURCE_TYPES:
        raise HTTPException(status_code=400, detail="Invalid source_type")

    row = (
        await db.execute(
            select(SourceClick).where(
                SourceClick.source_type == source_type,
                SourceClick.source_id == source_id,
            )
        )
    ).scalar_one_or_none()

    if not row:
        return SourceClickRead(source_type=source_type, source_id=source_id, click_count=0)

    return SourceClickRead(
        source_type=row.source_type,
        source_id=row.source_id,
        click_count=row.click_count,
    )


@router.post("/{source_type}/{source_id}", response_model=SourceClickRead)
async def increment_source_click(
    source_type: str,
    source_id: str,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    """Atomically increment click_count for the given source.

    Uses PostgreSQL INSERT … ON CONFLICT … SET click_count = click_count + 1
    for a race-free, lock-free upsert.
    """
    if source_type not in VALID_SOURCE_TYPES:
        raise HTTPException(status_code=400, detail="Invalid source_type")

    from sqlalchemy.dialects.postgresql import insert as pg_insert

    stmt = (
        pg_insert(SourceClick)
        .values(source_type=source_type, source_id=source_id, click_count=1)
        .on_conflict_do_update(
            constraint="uq_source_click_type_id",
            set_={"click_count": SourceClick.click_count + 1},
        )
        .returning(SourceClick.click_count)
    )
    result = await db.execute(stmt)
    new_count = result.scalar_one()

    if user:
        user_stmt = (
            pg_insert(UserVisitLog)
            .values(
                user_id=user.id,
                source_type=source_type,
                source_id=source_id,
                action="view",
                visit_count=1,
            )
            .on_conflict_do_update(
                constraint="uq_user_source_visit",
                set_={
                    "visit_count": UserVisitLog.visit_count + 1,
                    "last_visited_at": datetime.now(UTC),
                },
            )
        )
        await db.execute(user_stmt)

    await db.flush()

    logger.info("source_click incremented: %s/%s → %d", source_type, source_id, new_count)

    return SourceClickRead(source_type=source_type, source_id=source_id, click_count=new_count)
