"""
Upload router – media (images/videos) for opportunities, company logos,
and template spreadsheets.  All stored in S3-compatible storage (MinIO/AWS).
"""

import uuid
import io

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_current_user, require_super_admin
from app.models.opportunity import Opportunity
from app.models.opportunity_media import OpportunityMedia
from app.models.user import User
from app.services.s3 import get_public_url, upload_opportunity_media, upload_file, delete_file

router = APIRouter(prefix="/uploads", tags=["uploads"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100 MB


@router.post("/opportunity/{opportunity_id}/media")
async def upload_opportunity_files(
    opportunity_id: str,
    files: list[UploadFile] = File(...),
    is_cover: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[dict]:
    """Upload images/videos to an opportunity. Returns list of media records."""
    opp = await db.get(Opportunity, uuid.UUID(opportunity_id))
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    if opp.creator_id != user.id:
        raise HTTPException(status_code=403, detail="Not your opportunity")

    results = []
    for idx, f in enumerate(files):
        content_type = f.content_type or "application/octet-stream"

        if content_type in ALLOWED_IMAGE_TYPES:
            media_type = "image"
            max_size = MAX_IMAGE_SIZE
        elif content_type in ALLOWED_VIDEO_TYPES:
            media_type = "video"
            max_size = MAX_VIDEO_SIZE
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {content_type}",
            )

        content = await f.read()
        if len(content) > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"File too large: {f.filename} exceeds {max_size // (1024*1024)} MB",
            )

        # Reset for upload
        file_obj = io.BytesIO(content)

        s3_key = await upload_opportunity_media(
            file=file_obj,
            filename=f.filename or "upload",
            opportunity_id=opportunity_id,
            media_type=media_type,
            content_type=content_type,
        )
        url = get_public_url(s3_key)

        media = OpportunityMedia(
            opportunity_id=uuid.UUID(opportunity_id),
            media_type=media_type,
            s3_key=s3_key,
            url=url,
            filename=f.filename,
            size_bytes=len(content),
            content_type=content_type,
            sort_order=idx,
            is_cover=is_cover and idx == 0,
        )
        db.add(media)
        await db.flush()
        await db.refresh(media)

        # Update cover_image on opportunity if flagged
        if media.is_cover:
            opp.cover_image = url
            await db.flush()

        results.append({
            "id": str(media.id),
            "media_type": media.media_type,
            "url": media.url,
            "filename": media.filename,
            "size_bytes": media.size_bytes,
            "is_cover": media.is_cover,
        })

    await db.commit()
    return results


@router.post("/company/{company_id}/logo")
async def upload_company_logo(
    company_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Upload a company logo."""
    from app.models.company import Company

    company = await db.get(Company, uuid.UUID(company_id))
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Logo must be an image")

    content = await file.read()
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Logo too large (max 10 MB)")

    file_obj = io.BytesIO(content)
    safe_name = (file.filename or "logo").replace(" ", "_")
    key = f"companies/{company_id}/logo/{uuid.uuid4().hex}_{safe_name}"
    await upload_file(file_obj, key, content_type)
    url = get_public_url(key)

    company.logo_url = url
    await db.commit()

    return {"url": url}


# ═══════════════════════════════════════════════════════════════════════════════
# Admin Media Management Endpoints
# ═══════════════════════════════════════════════════════════════════════════════

@router.delete("/opportunity-media/{media_id}")
async def delete_opportunity_media(
    media_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_super_admin),
) -> dict:
    """Delete an opportunity media record and its S3 object. Super-admin only."""
    media = await db.get(OpportunityMedia, uuid.UUID(media_id))
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    # Delete from S3
    if media.s3_key:
        try:
            await delete_file(media.s3_key)
        except Exception:
            pass  # S3 deletion is best-effort

    await db.delete(media)
    await db.commit()
    return {"deleted": True, "id": media_id}


@router.post("/admin/opportunity/{opportunity_id}/media")
async def admin_upload_opportunity_media(
    opportunity_id: str,
    files: list[UploadFile] = File(...),
    is_cover: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_super_admin),
) -> list[dict]:
    """Upload media to any opportunity. Super-admin only (bypasses creator check)."""
    opp = await db.get(Opportunity, uuid.UUID(opportunity_id))
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    results = []
    for idx, f in enumerate(files):
        content_type = f.content_type or "application/octet-stream"

        if content_type in ALLOWED_IMAGE_TYPES:
            media_type = "image"
            max_size = MAX_IMAGE_SIZE
        elif content_type in ALLOWED_VIDEO_TYPES:
            media_type = "video"
            max_size = MAX_VIDEO_SIZE
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {content_type}")

        content = await f.read()
        if len(content) > max_size:
            raise HTTPException(status_code=400, detail=f"File too large: {f.filename} exceeds {max_size // (1024*1024)} MB")

        file_obj = io.BytesIO(content)
        s3_key = await upload_opportunity_media(
            file=file_obj,
            filename=f.filename or "upload",
            opportunity_id=opportunity_id,
            media_type=media_type,
            content_type=content_type,
        )
        url = get_public_url(s3_key)

        media = OpportunityMedia(
            opportunity_id=uuid.UUID(opportunity_id),
            media_type=media_type,
            s3_key=s3_key,
            url=url,
            filename=f.filename,
            size_bytes=len(content),
            content_type=content_type,
            sort_order=idx,
            is_cover=is_cover and idx == 0,
        )
        db.add(media)
        await db.flush()
        await db.refresh(media)

        if media.is_cover:
            opp.cover_image = url
            await db.flush()

        results.append({
            "id": str(media.id),
            "media_type": media.media_type,
            "url": media.url,
            "filename": media.filename,
            "size_bytes": media.size_bytes,
            "is_cover": media.is_cover,
        })

    await db.commit()
    return results


@router.patch("/opportunity-media/{media_id}")
async def update_opportunity_media(
    media_id: str,
    is_cover: bool | None = Query(None),
    sort_order: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_super_admin),
) -> dict:
    """Update media metadata (cover flag, sort order). Super-admin only."""
    media = await db.get(OpportunityMedia, uuid.UUID(media_id))
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    if is_cover is not None:
        media.is_cover = is_cover
        if is_cover:
            opp = await db.get(Opportunity, media.opportunity_id)
            if opp:
                opp.cover_image = media.url
    if sort_order is not None:
        media.sort_order = sort_order

    await db.commit()
    return {"id": str(media.id), "is_cover": media.is_cover, "sort_order": media.sort_order}


@router.get("/admin/opportunity/{opportunity_id}/media")
async def list_opportunity_media(
    opportunity_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_super_admin),
) -> list[dict]:
    """List all media for an opportunity. Super-admin only."""
    stmt = (
        select(OpportunityMedia)
        .where(OpportunityMedia.opportunity_id == uuid.UUID(opportunity_id))
        .order_by(OpportunityMedia.sort_order)
    )
    media_list = (await db.execute(stmt)).scalars().all()
    return [
        {
            "id": str(m.id),
            "media_type": m.media_type,
            "url": m.url,
            "filename": m.filename,
            "size_bytes": m.size_bytes,
            "is_cover": m.is_cover,
            "sort_order": m.sort_order,
        }
        for m in media_list
    ]
