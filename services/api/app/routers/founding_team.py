import io
import logging
import uuid

from botocore.exceptions import BotoCoreError, ClientError  # type: ignore[import-untyped]
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import require_super_admin
from app.models.founding_team import FoundingTeamMember
from app.models.user import User
from app.schemas.founding_team import (
    FoundingTeamMemberCreate,
    FoundingTeamMemberResponse,
    FoundingTeamMemberUpdate,
)
from app.services.s3 import delete_file, get_public_url, upload_file
from app.services.upload_scan import validate_upload

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/founding-team", tags=["founding-team"])


def _ensure_clean(content: bytes, claimed_mime: str) -> None:
    ok, reason = validate_upload(content, claimed_mime)
    if not ok:
        raise HTTPException(status_code=400, detail=reason or "Invalid file content")


@router.get("", response_model=list[FoundingTeamMemberResponse])
async def list_active_members(db: AsyncSession = Depends(get_db)) -> list[FoundingTeamMember]:
    """List active founding team members (public endpoint)."""
    stmt = (
        select(FoundingTeamMember)
        .where(FoundingTeamMember.is_active.is_(True))
        .order_by(FoundingTeamMember.sort_order)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/admin", response_model=list[FoundingTeamMemberResponse])
async def admin_list_members(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_super_admin),
) -> list[FoundingTeamMember]:
    """List all founding team members (super-admin only)."""
    stmt = select(FoundingTeamMember).order_by(FoundingTeamMember.sort_order)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post("/admin", response_model=FoundingTeamMemberResponse)
async def create_member(
    data: FoundingTeamMemberCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_super_admin),
) -> FoundingTeamMember:
    """Create a new founding team member."""
    member = FoundingTeamMember(**data.model_dump())
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return member


@router.patch("/admin/{member_id}", response_model=FoundingTeamMemberResponse)
async def update_member(
    member_id: str,
    data: FoundingTeamMemberUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_super_admin),
) -> FoundingTeamMember:
    """Update a founding team member."""
    member = await db.get(FoundingTeamMember, uuid.UUID(member_id))
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(member, key, value)

    await db.commit()
    await db.refresh(member)
    return member


@router.delete("/admin/{member_id}", status_code=204)
async def delete_member(
    member_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_super_admin),
) -> None:
    """Delete a founding team member."""
    member = await db.get(FoundingTeamMember, uuid.UUID(member_id))
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    if member.photo_s3_key:
        try:
            await delete_file(member.photo_s3_key)
        except Exception:
            pass  # Best effort

    await db.delete(member)
    await db.commit()


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB


@router.post("/admin/{member_id}/photo", response_model=FoundingTeamMemberResponse)
async def upload_member_photo(
    member_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_super_admin),
) -> FoundingTeamMember:
    """Upload a photo for a founding team member."""
    member = await db.get(FoundingTeamMember, uuid.UUID(member_id))
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Photo must be an image (JPEG, PNG, WebP)")

    content = await file.read()
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Photo too large (max 5 MB)")
    _ensure_clean(content, content_type)

    if member.photo_s3_key:
        try:
            await delete_file(member.photo_s3_key)
        except Exception:
            pass  # Best effort

    file_obj = io.BytesIO(content)
    safe_name = (file.filename or "photo").replace(" ", "_")
    key = f"founding-team/{member_id}/{uuid.uuid4().hex}_{safe_name}"

    try:
        await upload_file(file_obj, key, content_type)
    except (ClientError, BotoCoreError, OSError) as exc:
        logger.error("S3 photo upload failed for member %s: %s", member_id, exc)
        raise HTTPException(
            status_code=502, detail="Media storage unavailable. Please try again."
        ) from None

    url = get_public_url(key)
    member.photo_url = url
    member.photo_s3_key = key
    await db.commit()
    await db.refresh(member)

    return member
