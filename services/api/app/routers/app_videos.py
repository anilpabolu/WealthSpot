"""
App Videos router – CRUD & upload for application-wide video management.
Admins can manage videos by page + section tag from Command Control.
Public endpoint allows frontend to fetch active videos by page.
"""

import io
import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.app_video import AppVideo
from app.models.user import User
from app.schemas.app_video import (
    APP_VIDEO_PAGES,
    APP_VIDEO_SECTIONS,
    AppVideoCreate,
    AppVideoPublic,
    AppVideoRead,
    AppVideoUpdate,
)
from app.services.s3 import get_public_url, upload_file

router = APIRouter(prefix="/app-videos", tags=["app-videos"])

ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime"}
MAX_VIDEO_SIZE = 200 * 1024 * 1024  # 200 MB


# ── Public endpoints ─────────────────────────────────────────────────────────


@router.get("/public", response_model=list[AppVideoPublic])
async def get_public_videos(
    page: str | None = Query(None, description="Filter by page"),
    db: AsyncSession = Depends(get_db),
) -> list[AppVideoPublic]:
    """Public: fetch active videos, optionally filtered by page."""
    stmt = select(AppVideo).where(AppVideo.is_active == True)  # noqa: E712
    if page:
        stmt = stmt.where(AppVideo.page == page)
    stmt = stmt.order_by(AppVideo.page, AppVideo.sort_order)
    result = await db.execute(stmt)
    return [AppVideoPublic.model_validate(v) for v in result.scalars().all()]


@router.get("/public/{page}/{section_tag}", response_model=AppVideoPublic)
async def get_public_video_by_tag(
    page: str,
    section_tag: str,
    db: AsyncSession = Depends(get_db),
) -> AppVideoPublic:
    """Public: fetch a single active video by page + section tag."""
    stmt = select(AppVideo).where(
        and_(
            AppVideo.page == page,
            AppVideo.section_tag == section_tag,
            AppVideo.is_active == True,  # noqa: E712
        )
    )
    result = await db.execute(stmt)
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return AppVideoPublic.model_validate(video)


# ── Admin metadata endpoints ─────────────────────────────────────────────────


@router.get("/pages")
async def get_video_pages(
    _user: User = Depends(get_current_user),
) -> dict:
    """Return known pages and their section tags for the admin dropdown."""
    return {"pages": APP_VIDEO_PAGES, "sections": APP_VIDEO_SECTIONS}


# ── Admin CRUD ───────────────────────────────────────────────────────────────


@router.get("/admin", response_model=list[AppVideoRead])
async def list_all_videos(
    page: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[AppVideoRead]:
    """Admin: list all video slots."""
    stmt = select(AppVideo)
    if page:
        stmt = stmt.where(AppVideo.page == page)
    stmt = stmt.order_by(AppVideo.page, AppVideo.sort_order)
    result = await db.execute(stmt)
    return [AppVideoRead.model_validate(v) for v in result.scalars().all()]


@router.post("/admin", response_model=AppVideoRead)
async def create_video(
    payload: AppVideoCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AppVideoRead:
    """Admin: create a new video slot."""
    video = AppVideo(
        page=payload.page,
        section_tag=payload.section_tag,
        title=payload.title,
        description=payload.description,
        video_url=payload.video_url,
        thumbnail_url=payload.thumbnail_url,
        additional_info=payload.additional_info or {},
        is_active=payload.is_active,
        sort_order=payload.sort_order,
        uploaded_by=user.id,
    )
    db.add(video)
    await db.flush()
    await db.refresh(video)
    return AppVideoRead.model_validate(video)


@router.patch("/admin/{video_id}", response_model=AppVideoRead)
async def update_video(
    video_id: str,
    payload: AppVideoUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AppVideoRead:
    """Admin: update video metadata."""
    video = await db.get(AppVideo, uuid.UUID(video_id))
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(video, field, value)
    video.updated_at = datetime.now(UTC)
    await db.flush()
    await db.refresh(video)
    return AppVideoRead.model_validate(video)


@router.delete("/admin/{video_id}")
async def delete_video(
    video_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Admin: delete a video slot."""
    video = await db.get(AppVideo, uuid.UUID(video_id))
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    await db.delete(video)
    return {"deleted": True}


# ── Admin upload (replace video file) ────────────────────────────────────────


@router.post("/admin/{video_id}/upload", response_model=AppVideoRead)
async def upload_video_file(
    video_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AppVideoRead:
    """Admin: upload/replace the actual video file for a slot."""
    video = await db.get(AppVideo, uuid.UUID(video_id))
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported video type: {content_type}. Allowed: {', '.join(ALLOWED_VIDEO_TYPES)}",
        )

    content = await file.read()
    if len(content) > MAX_VIDEO_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Video too large ({len(content) // (1024 * 1024)} MB). Max: {MAX_VIDEO_SIZE // (1024 * 1024)} MB",
        )

    # Upload to S3/MinIO
    safe_name = (file.filename or "video.mp4").replace(" ", "_")
    key = f"app-videos/{video.page}/{video.section_tag}/{uuid.uuid4().hex}_{safe_name}"
    file_obj = io.BytesIO(content)
    await upload_file(file_obj, key, content_type)
    url = get_public_url(key)

    # Update record
    video.video_url = url
    video.s3_key = key
    video.content_type = content_type
    video.size_bytes = len(content)
    video.uploaded_by = user.id
    video.updated_at = datetime.now(UTC)
    await db.flush()
    await db.refresh(video)

    return AppVideoRead.model_validate(video)
