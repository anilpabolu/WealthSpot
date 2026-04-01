"""
Notification model – in-app, email, and push notification tracking.
"""

import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from typing import Any

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class NotificationChannel(str, PyEnum):
    IN_APP = "in_app"
    EMAIL = "email"
    PUSH = "push"
    SMS = "sms"


class NotificationType(str, PyEnum):
    INVESTMENT_CONFIRMED = "investment_confirmed"
    PAYMENT_RECEIVED = "payment_received"
    PAYOUT_CREDITED = "payout_credited"
    KYC_APPROVED = "kyc_approved"
    KYC_REJECTED = "kyc_rejected"
    PROPERTY_FUNDED = "property_funded"
    PROPERTY_LISTED = "property_listed"
    COMMUNITY_REPLY = "community_reply"
    REFERRAL_REWARD = "referral_reward"
    SYSTEM_ANNOUNCEMENT = "system_announcement"
    ENQUIRY = "enquiry"
    EXPRESSION_OF_INTEREST = "expression_of_interest"
    BUILDER_CONNECT = "builder_connect"


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    channel: Mapped[str] = mapped_column(String(20), nullable=False, default="in_app")
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    data: Mapped[dict[str, Any] | None] = mapped_column(JSONB)  # extra context (property_id, etc.)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )

    user = relationship("User", lazy="joined")

    def __repr__(self) -> str:
        return f"<Notification {self.type} user={self.user_id} read={self.is_read}>"
