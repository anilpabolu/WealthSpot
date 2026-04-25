"""
Upload router – media (images/videos) for opportunities, company logos,
and template spreadsheets.  All stored in S3-compatible storage (MinIO/AWS).
"""

import io
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_current_user, require_super_admin
from app.models.opportunity import Opportunity
from app.models.opportunity_media import OpportunityMedia
from app.models.user import User
from app.services.s3 import delete_file, get_public_url, upload_avatar, upload_file, upload_opportunity_media

router = APIRouter(prefix="/uploads", tags=["uploads"])

ALLOWED_AVATAR_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_AVATAR_SIZE = 5 * 1024 * 1024  # 5 MB


@router.post("/avatar")
async def upload_user_avatar(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Upload or replace the authenticated user's profile photo."""
    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_AVATAR_TYPES:
        raise HTTPException(status_code=400, detail="Avatar must be a JPEG, PNG, or WebP image")

    content = await file.read()
    if len(content) > MAX_AVATAR_SIZE:
        raise HTTPException(status_code=400, detail="Image too large (max 5 MB)")

    # Delete old avatar from S3 if one exists
    if user.avatar_s3_key:
        try:
            await delete_file(user.avatar_s3_key)
        except Exception:
            pass  # Best-effort deletion

    file_obj = io.BytesIO(content)
    s3_key = await upload_avatar(
        file=file_obj,
        filename=file.filename or "avatar.jpg",
        user_id=str(user.id),
        content_type=content_type,
    )
    avatar_url = get_public_url(s3_key)

    user.avatar_url = avatar_url
    user.avatar_s3_key = s3_key
    await db.flush()

    return {"avatar_url": avatar_url, "avatar_s3_key": s3_key}


@router.delete("/avatar", status_code=204)
async def delete_user_avatar(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    """Delete the authenticated user's profile photo."""
    if user.avatar_s3_key:
        try:
            await delete_file(user.avatar_s3_key)
        except Exception:
            pass  # Best-effort deletion

    user.avatar_url = None
    user.avatar_s3_key = None
    await db.flush()

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
                detail=f"File too large: {f.filename} exceeds {max_size // (1024 * 1024)} MB",
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

        results.append(
            {
                "id": str(media.id),
                "media_type": media.media_type,
                "url": media.url,
                "filename": media.filename,
                "size_bytes": media.size_bytes,
                "is_cover": media.is_cover,
            }
        )

    await db.flush()
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
    await db.flush()

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
    await db.flush()
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
            raise HTTPException(
                status_code=400,
                detail=f"File too large: {f.filename} exceeds {max_size // (1024 * 1024)} MB",
            )

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

        results.append(
            {
                "id": str(media.id),
                "media_type": media.media_type,
                "url": media.url,
                "filename": media.filename,
                "size_bytes": media.size_bytes,
                "is_cover": media.is_cover,
            }
        )

    await db.flush()
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

    await db.flush()
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


# ═══════════════════════════════════════════════════════════════════════════════
# Document Upload (PDF, DOC, XLS for opportunities)
# ═══════════════════════════════════════════════════════════════════════════════

ALLOWED_DOCUMENT_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}
MAX_DOCUMENT_SIZE = 25 * 1024 * 1024  # 25 MB


@router.post("/opportunity/{opportunity_id}/document")
async def upload_opportunity_documents(
    opportunity_id: str,
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[dict]:
    """Upload legal documents (PDF, DOC, XLS) to an opportunity. Creator only."""
    opp = await db.get(Opportunity, uuid.UUID(opportunity_id))
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    if opp.creator_id != user.id:
        raise HTTPException(status_code=403, detail="Not your opportunity")

    results = []
    for idx, f in enumerate(files):
        content_type = f.content_type or "application/octet-stream"

        if content_type not in ALLOWED_DOCUMENT_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported document type: {content_type}. Allowed: PDF, DOC, DOCX, XLS, XLSX",
            )

        content = await f.read()
        if len(content) > MAX_DOCUMENT_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large: {f.filename} exceeds 25 MB",
            )

        file_obj = io.BytesIO(content)
        s3_key = await upload_opportunity_media(
            file=file_obj,
            filename=f.filename or "document",
            opportunity_id=opportunity_id,
            media_type="document",
            content_type=content_type,
        )
        url = get_public_url(s3_key)

        media = OpportunityMedia(
            opportunity_id=uuid.UUID(opportunity_id),
            media_type="document",
            s3_key=s3_key,
            url=url,
            filename=f.filename,
            size_bytes=len(content),
            content_type=content_type,
            sort_order=idx,
            is_cover=False,
        )
        db.add(media)
        await db.flush()
        await db.refresh(media)

        results.append(
            {
                "id": str(media.id),
                "media_type": media.media_type,
                "url": media.url,
                "filename": media.filename,
                "size_bytes": media.size_bytes,
                "content_type": media.content_type,
            }
        )

    await db.flush()
    return results


# ═══════════════════════════════════════════════════════════════════════════════
# Shield Assessment Documents (gated behind EOI approval)
# ═══════════════════════════════════════════════════════════════════════════════


@router.post("/opportunity/{opportunity_id}/assessment-document")
async def upload_assessment_document(
    opportunity_id: str,
    category: str = Query(...),
    subcategory: str = Query(...),
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[dict]:
    """Upload an evidence document attached to a Shield assessment sub-item."""
    from app.core.assessments import find_subitem

    opp = await db.get(Opportunity, uuid.UUID(opportunity_id))
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    is_admin = user.role in ("admin", "super_admin")
    if opp.creator_id != user.id and not is_admin:
        raise HTTPException(status_code=403, detail="Not your opportunity")

    if find_subitem(category, subcategory) is None:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown assessment sub-item {category}/{subcategory}",
        )

    results = []
    for idx, f in enumerate(files):
        content_type = f.content_type or "application/octet-stream"
        if content_type not in ALLOWED_DOCUMENT_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported document type: {content_type}",
            )
        content = await f.read()
        if len(content) > MAX_DOCUMENT_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large: {f.filename} exceeds 25 MB",
            )

        file_obj = io.BytesIO(content)
        s3_key = await upload_opportunity_media(
            file=file_obj,
            filename=f.filename or "document",
            opportunity_id=opportunity_id,
            media_type="document",
            content_type=content_type,
        )
        url = get_public_url(s3_key)

        media = OpportunityMedia(
            opportunity_id=uuid.UUID(opportunity_id),
            media_type="document",
            s3_key=s3_key,
            url=url,
            filename=f.filename,
            size_bytes=len(content),
            content_type=content_type,
            sort_order=idx,
            is_cover=False,
            assessment_category_code=category,
            assessment_subcategory_code=subcategory,
        )
        db.add(media)
        await db.flush()
        await db.refresh(media)
        results.append(
            {
                "id": str(media.id),
                "filename": media.filename,
                "size_bytes": media.size_bytes,
                "content_type": media.content_type,
                "category": category,
                "subcategory": subcategory,
            }
        )
    await db.flush()
    return results


@router.get("/opportunity/{opportunity_id}/assessment-document/{media_id}")
async def download_assessment_document(
    opportunity_id: str,
    media_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Return the signed URL for an assessment document.

    Access rules:
      - Creator: always allowed.
      - Admin / super_admin: always allowed.
      - Any other user: allowed only if they have an EOI on this opportunity
        whose status is past SUBMITTED (i.e. super-admin has moved it
        forward in the pipeline). Else 403 EOI_REQUIRED.
    """
    from app.core.assessments import subitem_is_sensitive
    from app.models.expression_of_interest import EOIStatus, ExpressionOfInterest

    media = await db.get(OpportunityMedia, uuid.UUID(media_id))
    if not media or media.assessment_subcategory_code is None:
        raise HTTPException(status_code=404, detail="Document not found")
    if str(media.opportunity_id) != opportunity_id:
        raise HTTPException(status_code=404, detail="Document not found")

    opp = await db.get(Opportunity, uuid.UUID(opportunity_id))
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    is_privileged = opp.creator_id == user.id or user.role in ("admin", "super_admin", "approver")

    if not is_privileged and subitem_is_sensitive(
        media.assessment_category_code or "", media.assessment_subcategory_code
    ):
        approved_statuses = {
            EOIStatus.BUILDER_CONNECTED.value,
            EOIStatus.DEAL_IN_PROGRESS.value,
            EOIStatus.PAYMENT_DONE.value,
            EOIStatus.DEAL_COMPLETED.value,
            EOIStatus.TOKEN_PAID.value,
        }
        eoi_result = await db.execute(
            select(ExpressionOfInterest.status).where(
                ExpressionOfInterest.user_id == user.id,
                ExpressionOfInterest.opportunity_id == opp.id,
            )
        )
        statuses = [row[0] for row in eoi_result.all()]
        vals = [s.value if hasattr(s, "value") else str(s) for s in statuses]
        if not any(v in approved_statuses for v in vals):
            raise HTTPException(status_code=403, detail="EOI_REQUIRED")

    return {
        "id": str(media.id),
        "url": media.url,
        "filename": media.filename,
        "content_type": media.content_type,
        "size_bytes": media.size_bytes,
    }


@router.get("/opportunity/{opportunity_id}/media")
async def list_my_opportunity_media(
    opportunity_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[dict]:
    """List all media/documents for an opportunity. Creator or admin only."""
    opp = await db.get(Opportunity, uuid.UUID(opportunity_id))
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    if opp.creator_id != user.id and user.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Not authorised")

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
            "content_type": m.content_type,
            "is_cover": m.is_cover,
            "sort_order": m.sort_order,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in media_list
    ]
