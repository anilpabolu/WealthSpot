"""
Community router – posts, replies, per-user likes, approval flow for Q&A.

Post type rules
───────────────
• discussion → replies are public and immediately visible
• question   → replies go to approval_requests (category=community_answer);
               only approved replies are returned to regular users
• insight    → only admin / super_admin / community_lead may create
• poll / announcement → no special routing (treated like discussion for replies)
"""

import uuid
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_current_user, get_optional_user
from app.models.approval import ApprovalCategory, ApprovalPriority, ApprovalRequest
from app.models.community import (
    CommunityPost,
    CommunityPostLike,
    CommunityReply,
    CommunityReplyLike,
    PostType,
)
from app.models.platform_config import PlatformConfig
from app.models.user import User
from app.schemas.community import (
    AuthorRead,
    LikeResponse,
    PaginatedPosts,
    PostCreate,
    PostListItem,
    PostRead,
    ReplyCreate,
    ReplyRead,
)
from app.services.points import award_points

router = APIRouter(prefix="/community", tags=["community"])

# Roles that may create insight posts
_INSIGHT_ROLES = {"admin", "super_admin", "community_lead", "knowledge_contributor"}


# ── Helpers ──────────────────────────────────────────────────────────────────

def _author(user: User | None) -> AuthorRead | None:
    if not user:
        return None
    return AuthorRead(id=user.id, full_name=user.full_name, avatar_url=getattr(user, "avatar_url", None))


def _post_list_item(post: CommunityPost, liked: bool = False) -> PostListItem:
    tags = post.tags if isinstance(post.tags, list) else (list(post.tags) if post.tags else None)
    return PostListItem(
        id=post.id,
        post_type=post.post_type,
        title=post.title,
        body_preview=post.body[:200],
        category=post.category,
        tags=tags,
        upvotes=post.upvotes,
        reply_count=post.reply_count,
        is_pinned=post.is_pinned,
        author=_author(post.author),
        created_at=post.created_at,
        user_has_liked=liked,
    )


def _post_read(post: CommunityPost, liked: bool = False) -> PostRead:
    tags = post.tags if isinstance(post.tags, list) else (list(post.tags) if post.tags else None)
    return PostRead(
        id=post.id,
        user_id=post.user_id,
        post_type=post.post_type,
        title=post.title,
        body=post.body,
        category=post.category,
        tags=tags,
        upvotes=post.upvotes,
        reply_count=post.reply_count,
        is_pinned=post.is_pinned,
        created_at=post.created_at,
        updated_at=post.updated_at,
        author=_author(post.author),
        user_has_liked=liked,
    )


def _reply_read(reply: CommunityReply, liked: bool = False) -> ReplyRead:
    return ReplyRead(
        id=reply.id,
        post_id=reply.post_id,
        user_id=reply.user_id,
        body=reply.body,
        upvotes=reply.upvotes,
        is_approved=reply.is_approved,
        approval_status=None,
        created_at=reply.created_at,
        author=_author(reply.author),
        user_has_liked=liked,
    )


async def _get_community_config(db: AsyncSession) -> dict:
    """Return community platform configs as {key: value}."""
    result = await db.execute(
        select(PlatformConfig).where(PlatformConfig.section == "community")
    )
    configs = result.scalars().all()
    out: dict = {}
    for cfg in configs:
        v = cfg.value
        if isinstance(v, (int, float)):
            out[cfg.key] = v
        elif isinstance(v, dict):
            out[cfg.key] = v.get("value", v)
        else:
            try:
                out[cfg.key] = int(v)
            except (TypeError, ValueError):
                out[cfg.key] = v
    return out


# ── Endpoints ────────────────────────────────────────────────────────────────


@router.get("/posts", response_model=PaginatedPosts)
async def list_posts(
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
    post_type: PostType | None = Query(None, alias="type"),
    category: str | None = Query(None),
    search: str | None = Query(None),
    sort: str = Query("latest", pattern="^(latest|popular|pinned)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
) -> PaginatedPosts:
    """List community posts with filters (public)."""
    base = select(CommunityPost)

    if post_type:
        base = base.where(CommunityPost.post_type == post_type)
    if category and category != "all":
        base = base.where(CommunityPost.category == category)
    if search:
        like = f"%{search}%"
        base = base.where(
            CommunityPost.title.ilike(like) | CommunityPost.body.ilike(like)
        )

    # Sorting
    if sort == "popular":
        base = base.order_by(CommunityPost.upvotes.desc(), CommunityPost.created_at.desc())
    elif sort == "pinned":
        base = base.order_by(CommunityPost.is_pinned.desc(), CommunityPost.created_at.desc())
    else:
        base = base.order_by(CommunityPost.is_pinned.desc(), CommunityPost.created_at.desc())

    # Count
    count_q = select(func.count()).select_from(base.subquery())
    total = (await db.execute(count_q)).scalar_one()

    # Paginate
    paged = base.offset((page - 1) * page_size).limit(page_size)
    posts = (await db.execute(paged)).scalars().all()

    # Liked by current user?
    liked_ids: set[uuid.UUID] = set()
    if current_user:
        liked_q = select(CommunityPostLike.post_id).where(
            CommunityPostLike.user_id == current_user.id,
            CommunityPostLike.post_id.in_([p.id for p in posts]),
        )
        liked_ids = set((await db.execute(liked_q)).scalars().all())

    items = [_post_list_item(p, p.id in liked_ids) for p in posts]
    return PaginatedPosts(
        items=items,
        total=total,
        page=page,
        total_pages=max(1, ceil(total / page_size)),
    )


@router.post("/posts", response_model=PostRead, status_code=status.HTTP_201_CREATED)
async def create_post(
    body: PostCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PostRead:
    """Create a community post.  Insight posts are restricted to privileged roles."""
    if body.post_type == PostType.INSIGHT and user.role not in _INSIGHT_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only platform owners and knowledge contributors can create Insight posts.",
        )

    # Word-count validation using platform config
    cfg = await _get_community_config(db)
    max_words: int = int(cfg.get("post_max_words", 300))
    min_words: int = int(cfg.get("post_min_words", 10))
    word_count = len(body.body.split())
    if word_count < min_words:
        raise HTTPException(status_code=422, detail=f"Post body must be at least {min_words} words.")
    if word_count > max_words:
        raise HTTPException(status_code=422, detail=f"Post body must not exceed {max_words} words.")

    tags = body.tags or []
    post = CommunityPost(
        user_id=user.id,
        post_type=body.post_type,
        title=body.title,
        body=body.body,
        category=body.category or body.post_type.value,
        tags=tags,
    )
    db.add(post)
    await db.flush()
    await db.refresh(post)

    # Award points
    action = "question_asked" if body.post_type == PostType.QUESTION else "post_created"
    await award_points(
        db, user_id=str(user.id), action=action,
        reference_type="community_post", reference_id=str(post.id),
    )

    return _post_read(post)


@router.get("/posts/{post_id}", response_model=PostRead)
async def get_post(
    post_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> PostRead:
    result = await db.execute(select(CommunityPost).where(CommunityPost.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    liked = False
    if current_user:
        lq = select(CommunityPostLike).where(
            CommunityPostLike.post_id == post_id,
            CommunityPostLike.user_id == current_user.id,
        )
        liked = (await db.execute(lq)).scalar_one_or_none() is not None
    return _post_read(post, liked)


# ── Replies ───────────────────────────────────────────────────────────────────


@router.get("/posts/{post_id}/replies", response_model=list[ReplyRead])
async def list_replies(
    post_id: uuid.UUID,
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> list[ReplyRead]:
    """
    List replies for a post.
    • For question posts: only approved replies are returned to non-admin users.
    • For other types: all replies.
    """
    # Check post type to decide filter
    post_result = await db.execute(select(CommunityPost).where(CommunityPost.id == post_id))
    post = post_result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    query = select(CommunityReply).where(CommunityReply.post_id == post_id)

    is_privileged = current_user and current_user.role in {"admin", "super_admin", "approver", "community_lead"}
    if post.post_type == PostType.QUESTION and not is_privileged:
        query = query.where(CommunityReply.is_approved.is_(True))

    page = max(1, page)
    page_size = max(1, min(page_size, 100))
    query = query.order_by(CommunityReply.created_at.asc()).offset((page - 1) * page_size).limit(page_size)
    replies = (await db.execute(query)).scalars().all()

    # Liked by current user?
    liked_ids: set[uuid.UUID] = set()
    if current_user and replies:
        liked_q = select(CommunityReplyLike.reply_id).where(
            CommunityReplyLike.user_id == current_user.id,
            CommunityReplyLike.reply_id.in_([r.id for r in replies]),
        )
        liked_ids = set((await db.execute(liked_q)).scalars().all())

    return [_reply_read(r, r.id in liked_ids) for r in replies]


@router.post("/posts/{post_id}/replies", response_model=ReplyRead, status_code=201)
async def create_reply(
    post_id: uuid.UUID,
    body: ReplyCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReplyRead:
    """
    Reply to a post.
    • discussion / insight / poll / announcement → reply is immediately visible.
    • question → reply is submitted for approval (is_approved=False).
    """
    post_result = await db.execute(select(CommunityPost).where(CommunityPost.id == post_id))
    post = post_result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    needs_approval = post.post_type == PostType.QUESTION

    reply = CommunityReply(
        post_id=post_id,
        user_id=user.id,
        body=body.body,
        is_approved=not needs_approval,
    )
    db.add(reply)
    await db.flush()

    approval_request: ApprovalRequest | None = None
    if needs_approval:
        approval_request = ApprovalRequest(
            requester_id=user.id,
            category=ApprovalCategory.COMMUNITY_ANSWER,
            priority=ApprovalPriority.NORMAL,
            title=f"Answer to: {post.title[:100]}",
            description=body.body[:500],
            resource_type="community_reply",
            resource_id=str(reply.id),
            payload={"post_id": str(post_id), "reply_id": str(reply.id), "body": body.body},
        )
        db.add(approval_request)
        await db.flush()
        reply.approval_request_id = approval_request.id
    else:
        # Only increment reply_count for immediately-visible replies
        post.reply_count += 1

    await db.flush()
    await db.refresh(reply)

    return ReplyRead(
        id=reply.id,
        post_id=reply.post_id,
        user_id=reply.user_id,
        body=reply.body,
        upvotes=0,
        is_approved=reply.is_approved,
        approval_status="pending_review" if needs_approval else None,
        created_at=reply.created_at,
        author=AuthorRead(id=user.id, full_name=user.full_name),
    )


# ── Likes ─────────────────────────────────────────────────────────────────────


@router.post("/posts/{post_id}/like", response_model=LikeResponse)
async def toggle_post_like(
    post_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LikeResponse:
    """Toggle a per-user like on a post (idempotent)."""
    post_result = await db.execute(select(CommunityPost).where(CommunityPost.id == post_id))
    post = post_result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing = (await db.execute(
        select(CommunityPostLike).where(
            CommunityPostLike.post_id == post_id,
            CommunityPostLike.user_id == user.id,
        )
    )).scalar_one_or_none()

    if existing:
        await db.delete(existing)
        post.upvotes = max(0, post.upvotes - 1)
        liked = False
    else:
        db.add(CommunityPostLike(post_id=post_id, user_id=user.id))
        post.upvotes += 1
        liked = True

    await db.flush()
    return LikeResponse(liked=liked, like_count=post.upvotes)


@router.post("/posts/{post_id}/replies/{reply_id}/like", response_model=LikeResponse)
async def toggle_reply_like(
    post_id: uuid.UUID,
    reply_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LikeResponse:
    """Toggle a per-user like on a reply (idempotent)."""
    reply_result = await db.execute(
        select(CommunityReply).where(
            CommunityReply.id == reply_id,
            CommunityReply.post_id == post_id,
        )
    )
    reply = reply_result.scalar_one_or_none()
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")

    existing = (await db.execute(
        select(CommunityReplyLike).where(
            CommunityReplyLike.reply_id == reply_id,
            CommunityReplyLike.user_id == user.id,
        )
    )).scalar_one_or_none()

    if existing:
        await db.delete(existing)
        reply.upvotes = max(0, reply.upvotes - 1)
        liked = False
    else:
        db.add(CommunityReplyLike(reply_id=reply_id, user_id=user.id))
        reply.upvotes += 1
        liked = True

    await db.flush()
    return LikeResponse(liked=liked, like_count=reply.upvotes)


# ── Platform Config ───────────────────────────────────────────────────────────


@router.get("/config")
async def get_community_config(
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Return community platform config (word limits etc.) – public."""
    return await _get_community_config(db)



@router.post("/posts/{post_id}/upvote")
async def upvote_post(
    post_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, int]:
    """Upvote a post (idempotent toggle – uses like table to track uniqueness)."""
    result = await db.execute(
        select(CommunityPost).where(CommunityPost.id == post_id)
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Check if user already upvoted (reuse the like mechanism for dedup)
    existing = (await db.execute(
        select(CommunityPostLike).where(
            CommunityPostLike.post_id == post_id,
            CommunityPostLike.user_id == user.id,
        )
    )).scalar_one_or_none()

    if existing:
        # Already upvoted – idempotent, return current count
        pass
    else:
        db.add(CommunityPostLike(post_id=post_id, user_id=user.id))
        post.upvotes += 1
        await db.flush()

    return {"upvotes": post.upvotes}


# ── Unanswered Questions (for knowledge contributors) ────────────────────────


@router.get("/questions/unanswered", response_model=PaginatedPosts)
async def list_unanswered_questions(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
) -> PaginatedPosts:
    """
    Return question posts that have zero approved replies.
    Accessible to knowledge contributors, admins, and super_admins.
    """
    allowed = {"admin", "super_admin", "community_lead", "knowledge_contributor", "approver"}
    if user.role not in allowed:
        raise HTTPException(status_code=403, detail="Not authorized to view unanswered questions")

    # Subquery: IDs of question posts with at least one approved reply
    has_answer = (
        select(CommunityReply.post_id)
        .where(CommunityReply.is_approved.is_(True))
        .group_by(CommunityReply.post_id)
        .subquery()
    )

    base = (
        select(CommunityPost)
        .where(CommunityPost.post_type == PostType.QUESTION)
        .where(CommunityPost.id.notin_(select(has_answer.c.post_id)))
        .order_by(CommunityPost.created_at.desc())
    )

    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
    paged = base.offset((page - 1) * page_size).limit(page_size)
    posts = (await db.execute(paged)).scalars().all()

    items = [_post_list_item(p) for p in posts]
    return PaginatedPosts(
        items=items,
        total=total,
        page=page,
        total_pages=max(1, ceil(total / page_size)),
    )


@router.get("/questions/pending-answers")
async def list_pending_answers(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
) -> dict:
    """
    Return paginated unapproved replies to questions (for approval by admins).
    """
    allowed = {"admin", "super_admin", "approver"}
    if user.role not in allowed:
        raise HTTPException(status_code=403, detail="Not authorized")

    base = (
        select(CommunityReply)
        .join(CommunityPost, CommunityReply.post_id == CommunityPost.id)
        .where(CommunityPost.post_type == PostType.QUESTION)
        .where(CommunityReply.is_approved.is_(False))
    )

    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()

    query = base.order_by(CommunityReply.created_at.asc()).offset((page - 1) * page_size).limit(page_size)
    replies = (await db.execute(query)).scalars().all()

    return {
        "items": [_reply_read(r) for r in replies],
        "total": total,
        "page": page,
        "total_pages": max(1, ceil(total / page_size)),
    }
