"""
Site Content (CMS) router – public read + admin CRUD for editable page text.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import require_super_admin
from app.models.site_content import SiteContent
from app.models.user import User

router = APIRouter(prefix="/site-content", tags=["site-content"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class ContentOut(BaseModel):
    id: str
    page: str
    section_tag: str
    content_type: str
    value: str
    description: str | None = None
    is_active: bool = True

class ContentCreate(BaseModel):
    page: str
    section_tag: str
    value: str
    content_type: str = "text"
    description: str | None = None

class ContentUpdate(BaseModel):
    value: str | None = None
    description: str | None = None
    is_active: bool | None = None


# ── Public endpoints ─────────────────────────────────────────────────────────

@router.get("/page/{page}", response_model=list[ContentOut])
async def get_page_content(page: str, db: AsyncSession = Depends(get_db)):
    """Get all active content entries for a page. Public endpoint."""
    stmt = (
        select(SiteContent)
        .where(SiteContent.page == page, SiteContent.is_active == True)
        .order_by(SiteContent.section_tag)
    )
    rows = (await db.execute(stmt)).scalars().all()
    return [
        ContentOut(
            id=str(r.id), page=r.page, section_tag=r.section_tag,
            content_type=r.content_type, value=r.value,
            description=r.description, is_active=r.is_active,
        )
        for r in rows
    ]


@router.get("/entry/{page}/{section_tag}")
async def get_single_content(page: str, section_tag: str, db: AsyncSession = Depends(get_db)):
    """Get a single content entry by page + section_tag. Public endpoint."""
    stmt = select(SiteContent).where(
        SiteContent.page == page,
        SiteContent.section_tag == section_tag,
        SiteContent.is_active == True,
    )
    row = (await db.execute(stmt)).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Content not found")
    return ContentOut(
        id=str(row.id), page=row.page, section_tag=row.section_tag,
        content_type=row.content_type, value=row.value,
        description=row.description, is_active=row.is_active,
    )


# ── Admin endpoints ──────────────────────────────────────────────────────────

@router.get("/admin/all", response_model=list[ContentOut])
async def list_all_content(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_super_admin),
):
    """List all content entries (including inactive). Super-admin only."""
    stmt = select(SiteContent).order_by(SiteContent.page, SiteContent.section_tag)
    rows = (await db.execute(stmt)).scalars().all()
    return [
        ContentOut(
            id=str(r.id), page=r.page, section_tag=r.section_tag,
            content_type=r.content_type, value=r.value,
            description=r.description, is_active=r.is_active,
        )
        for r in rows
    ]


@router.post("/admin", response_model=ContentOut)
async def create_content(
    body: ContentCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_super_admin),
):
    """Create a new content entry. Super-admin only."""
    # Check uniqueness
    existing = (await db.execute(
        select(SiteContent).where(
            SiteContent.page == body.page,
            SiteContent.section_tag == body.section_tag,
        )
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Content entry already exists for this page+section")

    entry = SiteContent(
        page=body.page,
        section_tag=body.section_tag,
        content_type=body.content_type,
        value=body.value,
        description=body.description,
        updated_by=admin.id,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return ContentOut(
        id=str(entry.id), page=entry.page, section_tag=entry.section_tag,
        content_type=entry.content_type, value=entry.value,
        description=entry.description, is_active=entry.is_active,
    )


@router.patch("/admin/{content_id}", response_model=ContentOut)
async def update_content(
    content_id: str,
    body: ContentUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_super_admin),
):
    """Update a content entry's value, description, or active flag. Super-admin only."""
    entry = await db.get(SiteContent, uuid.UUID(content_id))
    if not entry:
        raise HTTPException(status_code=404, detail="Content not found")

    if body.value is not None:
        entry.value = body.value
    if body.description is not None:
        entry.description = body.description
    if body.is_active is not None:
        entry.is_active = body.is_active
    entry.updated_by = admin.id

    await db.commit()
    await db.refresh(entry)
    return ContentOut(
        id=str(entry.id), page=entry.page, section_tag=entry.section_tag,
        content_type=entry.content_type, value=entry.value,
        description=entry.description, is_active=entry.is_active,
    )


@router.delete("/admin/{content_id}")
async def delete_content(
    content_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_super_admin),
):
    """Delete a content entry permanently. Super-admin only."""
    entry = await db.get(SiteContent, uuid.UUID(content_id))
    if not entry:
        raise HTTPException(status_code=404, detail="Content not found")
    await db.delete(entry)
    await db.commit()
    return {"deleted": True, "id": content_id}
