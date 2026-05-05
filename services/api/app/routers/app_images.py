"""
App Images router – CRUD & upload for application-wide image management.
Admins can manage images by page + section tag from Command Control.
Public endpoint allows frontend to fetch active images by page.
"""

import io
import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.app_image import AppImage
from app.models.user import User
from app.schemas.app_image import (
    APP_IMAGE_PAGES,
    APP_IMAGE_SECTIONS,
    AppImageCreate,
    AppImagePublic,
    AppImageRead,
    AppImageUpdate,
)
from app.services.s3 import get_public_url, upload_file

router = APIRouter(prefix="/app-images", tags=["app-images"])

ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/webp", "image/svg+xml"}
MAX_IMAGE_SIZE = 15 * 1024 * 1024  # 15 MB


# ── Public endpoints ─────────────────────────────────────────────────────────


@router.get("/public", response_model=list[AppImagePublic])
async def get_public_images(
    page: str | None = Query(None, description="Filter by page"),
    db: AsyncSession = Depends(get_db),
) -> list[AppImagePublic]:
    """Public: fetch active images, optionally filtered by page."""
    stmt = select(AppImage).where(AppImage.is_active == True)  # noqa: E712
    if page:
        stmt = stmt.where(AppImage.page == page)
    stmt = stmt.order_by(AppImage.page, AppImage.sort_order)
    result = await db.execute(stmt)
    return [AppImagePublic.model_validate(v) for v in result.scalars().all()]


@router.get("/public/{page}/{section_tag}", response_model=AppImagePublic)
async def get_public_image_by_tag(
    page: str,
    section_tag: str,
    db: AsyncSession = Depends(get_db),
) -> AppImagePublic:
    """Public: fetch a single active image by page + section tag."""
    stmt = select(AppImage).where(
        and_(
            AppImage.page == page,
            AppImage.section_tag == section_tag,
            AppImage.is_active == True,  # noqa: E712
        )
    )
    result = await db.execute(stmt)
    image = result.scalar_one_or_none()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    return AppImagePublic.model_validate(image)


# ── Admin metadata endpoints ─────────────────────────────────────────────────


@router.get("/pages")
async def get_image_pages(
    _user: User = Depends(get_current_user),
) -> dict:
    """Return known pages and their section tags for the admin dropdown."""
    return {"pages": APP_IMAGE_PAGES, "sections": APP_IMAGE_SECTIONS}


# ── Admin CRUD ───────────────────────────────────────────────────────────────


@router.get("/admin", response_model=list[AppImageRead])
async def list_all_images(
    page: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[AppImageRead]:
    """Admin: list all image slots."""
    stmt = select(AppImage)
    if page:
        stmt = stmt.where(AppImage.page == page)
    stmt = stmt.order_by(AppImage.page, AppImage.sort_order)
    result = await db.execute(stmt)
    return [AppImageRead.model_validate(v) for v in result.scalars().all()]


@router.post("/admin", response_model=AppImageRead)
async def create_image(
    payload: AppImageCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AppImageRead:
    """Admin: create a new image slot."""
    image = AppImage(
        page=payload.page,
        section_tag=payload.section_tag,
        title=payload.title,
        description=payload.description,
        image_url=payload.image_url,
        alt_text=payload.alt_text,
        additional_info=payload.additional_info or {},
        is_active=payload.is_active,
        sort_order=payload.sort_order,
        uploaded_by=user.id,
    )
    db.add(image)
    await db.flush()
    await db.refresh(image)
    return AppImageRead.model_validate(image)


@router.patch("/admin/{image_id}", response_model=AppImageRead)
async def update_image(
    image_id: str,
    payload: AppImageUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AppImageRead:
    """Admin: update image metadata."""
    image = await db.get(AppImage, uuid.UUID(image_id))
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(image, field, value)
    image.updated_at = datetime.now(UTC)
    await db.flush()
    await db.refresh(image)
    return AppImageRead.model_validate(image)


@router.delete("/admin/{image_id}")
async def delete_image(
    image_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Admin: delete an image slot."""
    image = await db.get(AppImage, uuid.UUID(image_id))
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    await db.delete(image)
    return {"deleted": True}


# ── Admin upload (replace image file) ────────────────────────────────────────


@router.post("/admin/{image_id}/upload", response_model=AppImageRead)
async def upload_image_file(
    image_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AppImageRead:
    """Admin: upload/replace the actual image file for a slot."""
    image = await db.get(AppImage, uuid.UUID(image_id))
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image type: {content_type}. Allowed: {', '.join(sorted(ALLOWED_IMAGE_TYPES))}",
        )

    content = await file.read()
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Image too large ({len(content) // (1024 * 1024)} MB). Max: {MAX_IMAGE_SIZE // (1024 * 1024)} MB",
        )

    safe_name = (file.filename or "image.png").replace(" ", "_")
    key = f"app-images/{image.page}/{image.section_tag}/{uuid.uuid4().hex}_{safe_name}"
    file_obj = io.BytesIO(content)
    await upload_file(file_obj, key, content_type)
    url = get_public_url(key)

    image.image_url = url
    image.s3_key = key
    image.content_type = content_type
    image.size_bytes = len(content)
    image.uploaded_by = user.id
    image.updated_at = datetime.now(UTC)
    await db.flush()
    await db.refresh(image)

    return AppImageRead.model_validate(image)
