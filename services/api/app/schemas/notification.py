"""
Notification schemas.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel


class NotificationRead(BaseModel):
    id: uuid.UUID
    type: str
    channel: str
    title: str
    body: str
    data: dict | None = None
    is_read: bool
    read_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginatedNotifications(BaseModel):
    items: list[NotificationRead]
    total: int
    unread_count: int
    page: int
    total_pages: int


class MarkReadRequest(BaseModel):
    notification_ids: list[uuid.UUID] | None = None  # None = mark all read
