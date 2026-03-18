"""
Community schemas – posts and replies.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.community import PostType


# ── Author (nested) ─────────────────────────────────────────────────────────

class AuthorRead(BaseModel):
    id: uuid.UUID
    full_name: str
    avatar_url: str | None = None

    model_config = {"from_attributes": True}


# ── Posts ────────────────────────────────────────────────────────────────────

class PostCreate(BaseModel):
    title: str = Field(max_length=500)
    body: str = Field(min_length=1)
    post_type: PostType = PostType.DISCUSSION
    category: str | None = None
    tags: list[str] | None = None


class PostRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    post_type: PostType
    title: str
    body: str
    category: str | None = None
    tags: list[str] | None = None
    upvotes: int
    reply_count: int
    is_pinned: bool
    created_at: datetime
    updated_at: datetime
    author: AuthorRead | None = None

    model_config = {"from_attributes": True}


class PostListItem(BaseModel):
    """Lightweight post for feed – body truncated."""
    id: uuid.UUID
    post_type: PostType
    title: str
    body_preview: str  # computed – first 200 chars
    category: str | None = None
    upvotes: int
    reply_count: int
    is_pinned: bool
    author: AuthorRead | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginatedPosts(BaseModel):
    items: list[PostListItem]
    total: int
    page: int
    total_pages: int


# ── Replies ──────────────────────────────────────────────────────────────────

class ReplyCreate(BaseModel):
    body: str = Field(min_length=1)


class ReplyRead(BaseModel):
    id: uuid.UUID
    post_id: uuid.UUID
    user_id: uuid.UUID
    body: str
    upvotes: int
    created_at: datetime
    author: AuthorRead | None = None

    model_config = {"from_attributes": True}
