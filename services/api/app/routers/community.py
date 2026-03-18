"""
Community router – posts, replies, upvotes.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.community import CommunityPost, CommunityReply, PostType
from app.models.user import User

router = APIRouter(prefix="/community", tags=["community"])


# ── Schemas (local to router for simplicity) ─────────────────────────────────


class PostCreate(BaseModel):
    title: str = Field(min_length=3, max_length=500)
    body: str = Field(min_length=10)
    post_type: PostType = PostType.DISCUSSION
    category: str | None = None


class ReplyCreate(BaseModel):
    body: str = Field(min_length=1)


class PostRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    author_name: str | None = None
    post_type: PostType
    title: str
    body: str
    category: str | None = None
    upvotes: int
    reply_count: int
    is_pinned: bool
    created_at: str

    model_config = {"from_attributes": True}


class ReplyRead(BaseModel):
    id: uuid.UUID
    post_id: uuid.UUID
    user_id: uuid.UUID
    author_name: str | None = None
    body: str
    upvotes: int
    created_at: str

    model_config = {"from_attributes": True}


# ── Endpoints ────────────────────────────────────────────────────────────────


@router.get("/posts", response_model=list[PostRead])
async def list_posts(
    db: AsyncSession = Depends(get_db),
    category: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
) -> list[PostRead]:
    """List community posts (public)."""
    query = select(CommunityPost)
    if category:
        query = query.where(CommunityPost.category == category)
    query = (
        query
        .order_by(CommunityPost.is_pinned.desc(), CommunityPost.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(query)
    posts = result.scalars().all()

    items: list[PostRead] = []
    for p in posts:
        item = PostRead(
            id=p.id,
            user_id=p.user_id,
            author_name=p.author.full_name if p.author else None,
            post_type=p.post_type,
            title=p.title,
            body=p.body,
            category=p.category,
            upvotes=p.upvotes,
            reply_count=p.reply_count,
            is_pinned=p.is_pinned,
            created_at=p.created_at.isoformat(),
        )
        items.append(item)
    return items


@router.post("/posts", response_model=PostRead, status_code=status.HTTP_201_CREATED)
async def create_post(
    body: PostCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PostRead:
    """Create a community post."""
    post = CommunityPost(
        user_id=user.id,
        post_type=body.post_type,
        title=body.title,
        body=body.body,
        category=body.category,
    )
    db.add(post)
    await db.flush()

    return PostRead(
        id=post.id,
        user_id=post.user_id,
        author_name=user.full_name,
        post_type=post.post_type,
        title=post.title,
        body=post.body,
        category=post.category,
        upvotes=0,
        reply_count=0,
        is_pinned=False,
        created_at=post.created_at.isoformat(),
    )


@router.get("/posts/{post_id}/replies", response_model=list[ReplyRead])
async def list_replies(
    post_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> list[ReplyRead]:
    """List replies for a post."""
    query = (
        select(CommunityReply)
        .where(CommunityReply.post_id == post_id)
        .order_by(CommunityReply.created_at.asc())
    )
    result = await db.execute(query)
    replies = result.scalars().all()

    return [
        ReplyRead(
            id=r.id,
            post_id=r.post_id,
            user_id=r.user_id,
            author_name=r.author.full_name if r.author else None,
            body=r.body,
            upvotes=r.upvotes,
            created_at=r.created_at.isoformat(),
        )
        for r in replies
    ]


@router.post("/posts/{post_id}/replies", response_model=ReplyRead, status_code=201)
async def create_reply(
    post_id: uuid.UUID,
    body: ReplyCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReplyRead:
    """Reply to a community post."""
    # Verify post exists
    post_result = await db.execute(
        select(CommunityPost).where(CommunityPost.id == post_id)
    )
    post = post_result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    reply = CommunityReply(
        post_id=post_id,
        user_id=user.id,
        body=body.body,
    )
    db.add(reply)

    # Increment reply count
    post.reply_count += 1

    await db.flush()

    return ReplyRead(
        id=reply.id,
        post_id=reply.post_id,
        user_id=reply.user_id,
        author_name=user.full_name,
        body=reply.body,
        upvotes=0,
        created_at=reply.created_at.isoformat(),
    )


@router.post("/posts/{post_id}/upvote")
async def upvote_post(
    post_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, int]:
    """Upvote a post (idempotent for simplicity)."""
    result = await db.execute(
        select(CommunityPost).where(CommunityPost.id == post_id)
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    post.upvotes += 1
    await db.flush()
    return {"upvotes": post.upvotes}
