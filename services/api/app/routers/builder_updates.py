"""
Builder Updates router – CRUD for builder/admin updates on opportunities,
plus file-attachment upload and delete.
"""

import io
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.middleware.auth import get_current_user, get_optional_user
from app.models.builder_update import (
    BuilderUpdate,
    BuilderUpdateAttachment,
    BuilderUpdateReadReceipt,
)
from app.models.opportunity import Opportunity
from app.models.user import User, UserRole
from app.schemas.builder_update import (
    BuilderUpdateAttachmentRead,
    BuilderUpdateCreate,
    BuilderUpdatePatch,
    BuilderUpdateRead,
)
from app.services.s3 import delete_file, get_public_url, upload_file

router = APIRouter(prefix="/builder-updates", tags=["builder-updates"])

MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024  # 25 MB


def _is_admin(user: User) -> bool:
    return user.role in (UserRole.ADMIN, UserRole.SUPER_ADMIN)


def _can_manage(user: User, opp: Opportunity) -> bool:
    return _is_admin(user) or opp.creator_id == user.id


# ── List updates for an opportunity ──────────────────────────────────────────


@router.get(
    "/opportunities/{opportunity_id}",
    response_model=list[BuilderUpdateRead],
)
async def list_updates(
    opportunity_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    """List all builder updates for an opportunity, newest first.

    When called with a valid Bearer token, each item includes ``is_read`` set
    based on whether the authenticated user has opened that update.
    """
    stmt = (
        select(BuilderUpdate)
        .where(BuilderUpdate.opportunity_id == opportunity_id)
        .options(selectinload(BuilderUpdate.attachments))
        .order_by(BuilderUpdate.created_at.desc())
    )
    rows = (await db.execute(stmt)).scalars().all()

    read_ids: set[uuid.UUID] = set()
    if user and rows:
        receipt_stmt = select(BuilderUpdateReadReceipt.update_id).where(
            BuilderUpdateReadReceipt.user_id == user.id,
            BuilderUpdateReadReceipt.update_id.in_([r.id for r in rows]),
        )
        read_ids = set((await db.execute(receipt_stmt)).scalars().all())

    return [
        BuilderUpdateRead.model_validate(row).model_copy(update={"is_read": row.id in read_ids})
        for row in rows
    ]


# ── Create update ────────────────────────────────────────────────────────────


@router.post(
    "/opportunities/{opportunity_id}",
    response_model=BuilderUpdateRead,
    status_code=201,
)
async def create_update(
    opportunity_id: uuid.UUID,
    body: BuilderUpdateCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    opp = await db.get(Opportunity, opportunity_id)
    if not opp:
        raise HTTPException(404, "Opportunity not found")
    if not _can_manage(user, opp):
        raise HTTPException(403, "Not authorised")

    update = BuilderUpdate(
        opportunity_id=opportunity_id,
        creator_id=user.id,
        title=body.title,
        description=body.description,
    )
    db.add(update)
    await db.flush()
    await db.refresh(update, attribute_names=["attachments", "creator"])
    await db.flush()
    return update


# ── Patch update ─────────────────────────────────────────────────────────────


@router.patch(
    "/{update_id}",
    response_model=BuilderUpdateRead,
)
async def patch_update(
    update_id: uuid.UUID,
    body: BuilderUpdatePatch,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    upd = await db.get(BuilderUpdate, update_id, options=[selectinload(BuilderUpdate.attachments)])
    if not upd:
        raise HTTPException(404, "Update not found")
    opp = await db.get(Opportunity, upd.opportunity_id)
    if not opp or not _can_manage(user, opp):
        raise HTTPException(403, "Not authorised")

    for field, val in body.model_dump(exclude_unset=True).items():
        setattr(upd, field, val)
    await db.flush()
    await db.refresh(upd, attribute_names=["attachments", "creator"])
    return upd


# ── Delete update (+ S3 cleanup) ────────────────────────────────────────────


@router.delete("/{update_id}", status_code=204)
async def delete_update(
    update_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    upd = await db.get(BuilderUpdate, update_id, options=[selectinload(BuilderUpdate.attachments)])
    if not upd:
        raise HTTPException(404, "Update not found")
    opp = await db.get(Opportunity, upd.opportunity_id)
    if not opp or not _can_manage(user, opp):
        raise HTTPException(403, "Not authorised")

    # Delete S3 objects
    for att in upd.attachments:
        try:
            await delete_file(att.s3_key)
        except Exception:
            pass  # best-effort S3 cleanup

    await db.delete(upd)
    await db.flush()


# ── Upload attachment ────────────────────────────────────────────────────────


@router.post(
    "/{update_id}/attachments",
    response_model=BuilderUpdateAttachmentRead,
    status_code=201,
)
async def upload_attachment(
    update_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    upd = await db.get(BuilderUpdate, update_id)
    if not upd:
        raise HTTPException(404, "Update not found")
    opp = await db.get(Opportunity, upd.opportunity_id)
    if not opp or not _can_manage(user, opp):
        raise HTTPException(403, "Not authorised")

    content = await file.read()
    if len(content) > MAX_ATTACHMENT_SIZE:
        raise HTTPException(400, f"File exceeds {MAX_ATTACHMENT_SIZE // (1024 * 1024)} MB limit")

    content_type = file.content_type or "application/octet-stream"
    safe_name = (file.filename or "file").replace(" ", "_")
    s3_key = f"builder-updates/{update_id}/{uuid.uuid4().hex}_{safe_name}"

    await upload_file(io.BytesIO(content), s3_key, content_type)
    url = get_public_url(s3_key)

    att = BuilderUpdateAttachment(
        update_id=update_id,
        filename=file.filename,
        s3_key=s3_key,
        url=url,
        content_type=content_type,
        size_bytes=len(content),
    )
    db.add(att)
    await db.flush()
    await db.refresh(att)
    return att


# ── Delete attachment ────────────────────────────────────────────────────────


@router.delete("/attachments/{attachment_id}", status_code=204)
async def delete_attachment(
    attachment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    att = await db.get(BuilderUpdateAttachment, attachment_id)
    if not att:
        raise HTTPException(404, "Attachment not found")
    upd = await db.get(BuilderUpdate, att.update_id)
    if not upd:
        raise HTTPException(404, "Update not found")
    opp = await db.get(Opportunity, upd.opportunity_id)
    if not opp or not _can_manage(user, opp):
        raise HTTPException(403, "Not authorised")

    try:
        await delete_file(att.s3_key)
    except Exception:
        pass

    await db.delete(att)
    await db.flush()


# ── Mark update as read ──────────────────────────────────────────────────────


@router.post("/{update_id}/mark-read", status_code=204)
async def mark_update_read(
    update_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Record that the current user has read this update (idempotent)."""
    upd = await db.get(BuilderUpdate, update_id)
    if not upd:
        raise HTTPException(404, "Update not found")

    existing = await db.execute(
        select(BuilderUpdateReadReceipt).where(
            BuilderUpdateReadReceipt.user_id == user.id,
            BuilderUpdateReadReceipt.update_id == update_id,
        )
    )
    if existing.scalar_one_or_none() is None:
        db.add(BuilderUpdateReadReceipt(user_id=user.id, update_id=update_id))
        await db.flush()

    return Response(status_code=204)


# ── Bulk unread counts ────────────────────────────────────────────────────────


@router.get("/unread-counts", response_model=dict[str, dict[str, int]])
async def unread_counts(
    opportunity_ids: list[uuid.UUID] = Query(..., alias="opportunity_ids"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Return unread and total update counts per opportunity for the current user.

    Example: GET /builder-updates/unread-counts?opportunity_ids=uuid1&opportunity_ids=uuid2

    Returns: ``{"<opportunityId>": {"unread": N, "total": M}, ...}``
    """
    if not opportunity_ids:
        return {}

    # All updates per opportunity
    total_stmt = select(BuilderUpdate.opportunity_id, BuilderUpdate.id).where(
        BuilderUpdate.opportunity_id.in_(opportunity_ids)
    )
    all_rows = (await db.execute(total_stmt)).all()
    update_ids_by_opp: dict[uuid.UUID, list[uuid.UUID]] = {}
    for opp_id, upd_id in all_rows:
        update_ids_by_opp.setdefault(opp_id, []).append(upd_id)

    all_update_ids = [upd_id for ids in update_ids_by_opp.values() for upd_id in ids]
    read_ids: set[uuid.UUID] = set()
    if all_update_ids:
        read_stmt = select(BuilderUpdateReadReceipt.update_id).where(
            BuilderUpdateReadReceipt.user_id == user.id,
            BuilderUpdateReadReceipt.update_id.in_(all_update_ids),
        )
        read_ids = set((await db.execute(read_stmt)).scalars().all())

    result: dict[str, dict[str, int]] = {}
    for opp_id in opportunity_ids:
        ids = update_ids_by_opp.get(opp_id, [])
        total = len(ids)
        unread = sum(1 for uid in ids if uid not in read_ids)
        result[str(opp_id)] = {"unread": unread, "total": total}

    return result
