"""
Upload router – media (images/videos) for opportunities, company logos,
and template spreadsheets.  All stored in S3-compatible storage (MinIO/AWS).
"""

import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.opportunity import Opportunity
from app.models.opportunity_media import OpportunityMedia
from app.models.user import User
from app.services.s3 import get_public_url, upload_opportunity_media, upload_file

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
        import io
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

    import io
    file_obj = io.BytesIO(content)
    safe_name = (file.filename or "logo").replace(" ", "_")
    key = f"companies/{company_id}/logo/{uuid.uuid4().hex}_{safe_name}"
    await upload_file(file_obj, key, content_type)
    url = get_public_url(key)

    company.logo_url = url
    await db.commit()

    return {"url": url}
