"""
Knowledge Hub router – public read + admin CRUD for content tiles.

A tile (KnowledgeArticle) has a text body plus optional image/PDF attachments
(KnowledgeAsset). Public endpoints serve published tiles; create/edit/upload are
super-admin only.
"""

import io
import re
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.middleware.auth import require_super_admin
from app.models.knowledge_article import KnowledgeArticle, KnowledgeAsset
from app.models.user import User
from app.services.s3 import delete_file, get_public_url, upload_file

router = APIRouter(prefix="/knowledge", tags=["knowledge"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_PDF_TYPES = {"application/pdf"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/ogg", "video/quicktime"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_PDF_SIZE = 25 * 1024 * 1024  # 25 MB
MAX_VIDEO_SIZE = 150 * 1024 * 1024  # 150 MB


def _slugify(text: str) -> str:
    """Generate a URL-safe slug with a short unique suffix."""
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    if not slug:
        slug = "article"
    return f"{slug}-{uuid.uuid4().hex[:6]}"


# ── Schemas ──────────────────────────────────────────────────────────────────


class AssetOut(BaseModel):
    id: str
    asset_type: str
    url: str
    filename: str | None = None
    content_type: str | None = None
    sort_order: int = 0


class ArticleSummary(BaseModel):
    id: str
    slug: str
    title: str
    synopsis: str
    cover_image_url: str | None = None
    is_published: bool = True
    sort_order: int = 0
    image_count: int = 0
    pdf_count: int = 0
    video_count: int = 0


class ArticleDetail(ArticleSummary):
    body: str | None = None
    assets: list[AssetOut] = []


class ArticleCreate(BaseModel):
    title: str
    synopsis: str
    body: str | None = None
    cover_image_url: str | None = None
    is_published: bool = True
    sort_order: int = 0


class ArticleUpdate(BaseModel):
    title: str | None = None
    synopsis: str | None = None
    body: str | None = None
    cover_image_url: str | None = None
    is_published: bool | None = None
    sort_order: int | None = None


# ── Serializers ──────────────────────────────────────────────────────────────


def _asset_out(a: KnowledgeAsset) -> AssetOut:
    return AssetOut(
        id=str(a.id),
        asset_type=a.asset_type,
        url=a.url,
        filename=a.filename,
        content_type=a.content_type,
        sort_order=a.sort_order,
    )


def _summary(art: KnowledgeArticle) -> ArticleSummary:
    assets = art.assets or []
    return ArticleSummary(
        id=str(art.id),
        slug=art.slug,
        title=art.title,
        synopsis=art.synopsis,
        cover_image_url=art.cover_image_url,
        is_published=art.is_published,
        sort_order=art.sort_order,
        image_count=sum(1 for a in assets if a.asset_type == "image"),
        pdf_count=sum(1 for a in assets if a.asset_type == "pdf"),
        video_count=sum(1 for a in assets if a.asset_type == "video"),
    )


def _detail(art: KnowledgeArticle) -> ArticleDetail:
    base = _summary(art)
    return ArticleDetail(
        **base.model_dump(),
        body=art.body,
        assets=[_asset_out(a) for a in (art.assets or [])],
    )


# ── Public ───────────────────────────────────────────────────────────────────


@router.get("", response_model=list[ArticleSummary])
async def list_articles(db: AsyncSession = Depends(get_db)) -> list[ArticleSummary]:
    """Public list of published knowledge tiles."""
    stmt = (
        select(KnowledgeArticle)
        .options(selectinload(KnowledgeArticle.assets))
        .where(KnowledgeArticle.is_published.is_(True))
        .order_by(KnowledgeArticle.sort_order, KnowledgeArticle.created_at.desc())
    )
    rows = (await db.execute(stmt)).scalars().all()
    return [_summary(a) for a in rows]


@router.get("/{slug}", response_model=ArticleDetail)
async def get_article(slug: str, db: AsyncSession = Depends(get_db)) -> ArticleDetail:
    """Public full article + ordered assets."""
    stmt = (
        select(KnowledgeArticle)
        .options(selectinload(KnowledgeArticle.assets))
        .where(KnowledgeArticle.slug == slug, KnowledgeArticle.is_published.is_(True))
    )
    art = (await db.execute(stmt)).scalar_one_or_none()
    if not art:
        raise HTTPException(status_code=404, detail="Article not found")
    return _detail(art)


# ── Admin ────────────────────────────────────────────────────────────────────


@router.get("/admin/all", response_model=list[ArticleDetail])
async def admin_list_articles(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_super_admin),
) -> list[ArticleDetail]:
    """Admin list of ALL tiles (including unpublished), with assets."""
    stmt = (
        select(KnowledgeArticle)
        .options(selectinload(KnowledgeArticle.assets))
        .order_by(KnowledgeArticle.sort_order, KnowledgeArticle.created_at.desc())
    )
    rows = (await db.execute(stmt)).scalars().all()
    return [_detail(a) for a in rows]


@router.post("/admin", response_model=ArticleDetail)
async def create_article(
    body: ArticleCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_super_admin),
) -> ArticleDetail:
    art = KnowledgeArticle(
        slug=_slugify(body.title),
        title=body.title,
        synopsis=body.synopsis,
        body=body.body,
        cover_image_url=body.cover_image_url,
        is_published=body.is_published,
        sort_order=body.sort_order,
        created_by=admin.id,
    )
    db.add(art)
    await db.flush()
    await db.refresh(art, attribute_names=["assets"])
    return _detail(art)


@router.patch("/admin/{article_id}", response_model=ArticleDetail)
async def update_article(
    article_id: str,
    body: ArticleUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_super_admin),
) -> ArticleDetail:
    art = await db.get(KnowledgeArticle, uuid.UUID(article_id))
    if not art:
        raise HTTPException(status_code=404, detail="Article not found")
    for field in ("title", "synopsis", "body", "cover_image_url", "is_published", "sort_order"):
        val = getattr(body, field)
        if val is not None:
            setattr(art, field, val)
    await db.flush()
    await db.refresh(art, attribute_names=["assets"])
    return _detail(art)


@router.delete("/admin/{article_id}")
async def delete_article(
    article_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_super_admin),
) -> dict:
    stmt = (
        select(KnowledgeArticle)
        .options(selectinload(KnowledgeArticle.assets))
        .where(KnowledgeArticle.id == uuid.UUID(article_id))
    )
    art = (await db.execute(stmt)).scalar_one_or_none()
    if not art:
        raise HTTPException(status_code=404, detail="Article not found")
    for asset in art.assets or []:
        try:
            await delete_file(asset.s3_key)
        except Exception:  # noqa: BLE001 — best-effort storage cleanup
            pass
    await db.delete(art)
    await db.flush()
    return {"deleted": True, "id": article_id}


@router.post("/admin/{article_id}/assets", response_model=list[AssetOut])
async def upload_assets(
    article_id: str,
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_super_admin),
) -> list[AssetOut]:
    """Upload one or more images / PDFs to a tile."""
    art = await db.get(KnowledgeArticle, uuid.UUID(article_id))
    if not art:
        raise HTTPException(status_code=404, detail="Article not found")

    # Continue sort order after existing assets.
    existing = (
        (await db.execute(select(KnowledgeAsset).where(KnowledgeAsset.article_id == art.id)))
        .scalars()
        .all()
    )
    next_order = (max((a.sort_order for a in existing), default=-1)) + 1

    results: list[AssetOut] = []
    for f in files:
        content_type = f.content_type or "application/octet-stream"
        if content_type in ALLOWED_IMAGE_TYPES:
            asset_type, max_size = "image", MAX_IMAGE_SIZE
        elif content_type in ALLOWED_PDF_TYPES:
            asset_type, max_size = "pdf", MAX_PDF_SIZE
        elif content_type in ALLOWED_VIDEO_TYPES:
            asset_type, max_size = "video", MAX_VIDEO_SIZE
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {content_type}")

        content = await f.read()
        if len(content) > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"File too large: {f.filename} exceeds {max_size // (1024 * 1024)} MB",
            )

        safe_name = (f.filename or "upload").replace(" ", "_")
        key = f"knowledge/{article_id}/{uuid.uuid4().hex}_{safe_name}"
        await upload_file(io.BytesIO(content), key, content_type)
        url = get_public_url(key)

        asset = KnowledgeAsset(
            article_id=art.id,
            asset_type=asset_type,
            s3_key=key,
            url=url,
            filename=f.filename,
            content_type=content_type,
            size_bytes=len(content),
            sort_order=next_order,
        )
        db.add(asset)
        await db.flush()
        await db.refresh(asset)
        next_order += 1

        # Auto-assign first image as cover if none set yet.
        if asset_type == "image" and not art.cover_image_url:
            art.cover_image_url = url
            await db.flush()

        results.append(_asset_out(asset))

    return results


@router.delete("/admin/{article_id}/assets/{asset_id}")
async def delete_asset(
    article_id: str,
    asset_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_super_admin),
) -> dict:
    asset = await db.get(KnowledgeAsset, uuid.UUID(asset_id))
    if not asset or str(asset.article_id) != article_id:
        raise HTTPException(status_code=404, detail="Asset not found")
    try:
        await delete_file(asset.s3_key)
    except Exception:  # noqa: BLE001 — best-effort storage cleanup
        pass
    await db.delete(asset)
    await db.flush()
    return {"deleted": True, "id": asset_id}
