"""SQLAlchemy ORM models for the WealthSpot Communication Platform (`comm.*` schema).

All tables are created by alembic revision 048_comm_schema.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, time
from enum import Enum as PyEnum
from typing import Any

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

# ---------------------------------------------------------------------------
# Enums (str-PyEnum matches project convention)
# ---------------------------------------------------------------------------


class CommChannel(str, PyEnum):
    EMAIL = "email"
    SMS = "sms"
    WHATSAPP = "whatsapp"
    IN_APP = "in_app"


class OutboxStatus(str, PyEnum):
    PENDING = "pending"
    CLAIMED = "claimed"
    DONE = "done"
    FAILED = "failed"


class MessageStatus(str, PyEnum):
    PENDING = "pending"
    SENDING = "sending"
    SENT = "sent"
    DELIVERED = "delivered"
    OPENED = "opened"
    CLICKED = "clicked"
    FAILED = "failed"
    SUPPRESSED = "suppressed"
    BOUNCED = "bounced"
    COMPLAINED = "complained"


class TemplateStatus(str, PyEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"
    RETIRED = "retired"


class ProviderKind(str, PyEnum):
    SMTP = "smtp"
    SES = "ses"
    SENDGRID = "sendgrid"
    MAILGUN = "mailgun"
    POSTMARK = "postmark"
    TWILIO = "twilio"
    MSG91 = "msg91"
    KALEYRA = "kaleyra"
    PLIVO = "plivo"
    AWS_SNS = "aws_sns"
    META_CLOUD = "meta_cloud"
    GUPSHUP = "gupshup"
    DIALOG_360 = "360dialog"
    STUB = "stub"


# ---------------------------------------------------------------------------
# Reusable column factories
# ---------------------------------------------------------------------------


def _uuid_pk() -> Mapped[uuid.UUID]:
    return mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


def _now() -> datetime:
    return datetime.now(UTC)


# ---------------------------------------------------------------------------
# User profile / preferences / consent
# ---------------------------------------------------------------------------


class CommUserProfile(Base):
    __tablename__ = "user_profiles"
    __table_args__ = {"schema": "comm"}

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    locale: Mapped[str] = mapped_column(String(16), nullable=False, default="en-IN")
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="Asia/Kolkata")
    whatsapp_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    marketing_consent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    transactional_email: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    transactional_sms: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    transactional_whatsapp: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    promotional_email: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    promotional_sms: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    promotional_whatsapp: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    quiet_hours_start: Mapped[time | None] = mapped_column(Time, nullable=True)
    quiet_hours_end: Mapped[time | None] = mapped_column(Time, nullable=True)
    frequency_cap_promotional_per_week: Mapped[int] = mapped_column(
        Integer, nullable=False, default=3
    )

    tenant_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class CommUserEventPreference(Base):
    __tablename__ = "user_event_preferences"
    __table_args__ = {"schema": "comm"}

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    event_category: Mapped[str] = mapped_column(String(50), primary_key=True)
    channel: Mapped[str] = mapped_column(String(20), primary_key=True)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )


class CommConsentRecord(Base):
    __tablename__ = "consent_records"
    __table_args__ = {"schema": "comm"}

    id: Mapped[uuid.UUID] = _uuid_pk()
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    channel: Mapped[str] = mapped_column(String(20), nullable=False)
    purpose: Mapped[str] = mapped_column(String(60), nullable=False)
    source: Mapped[str | None] = mapped_column(String(120), nullable=True)
    ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)
    consented_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )


# ---------------------------------------------------------------------------
# Event registry
# ---------------------------------------------------------------------------


class CommEvent(Base):
    __tablename__ = "events"
    __table_args__ = (
        UniqueConstraint("event_name", "version", name="uq_comm_events_name_version"),
        {"schema": "comm"},
    )

    id: Mapped[uuid.UUID] = _uuid_pk()
    event_name: Mapped[str] = mapped_column(String(120), nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    payload_schema: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False, default="general")
    is_promotional: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_transactional: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    default_locale: Mapped[str] = mapped_column(String(16), nullable=False, default="en-IN")
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    tenant_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


# ---------------------------------------------------------------------------
# Providers
# ---------------------------------------------------------------------------


class CommProvider(Base):
    __tablename__ = "providers"
    __table_args__ = {"schema": "comm"}

    id: Mapped[uuid.UUID] = _uuid_pk()
    channel: Mapped[str] = mapped_column(String(20), nullable=False)
    kind: Mapped[str] = mapped_column(String(30), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    config_encrypted: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    failover_to_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    tenant_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------


class CommTemplate(Base):
    __tablename__ = "templates"
    __table_args__ = {"schema": "comm"}

    id: Mapped[uuid.UUID] = _uuid_pk()
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    channel: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")
    owner_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    tenant_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class CommTemplateVersion(Base):
    __tablename__ = "template_versions"
    __table_args__ = {"schema": "comm"}

    id: Mapped[uuid.UUID] = _uuid_pk()
    template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("comm.templates.id", ondelete="CASCADE"),
        nullable=False,
    )
    version_no: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    locale: Mapped[str] = mapped_column(String(16), nullable=False, default="en-IN")
    subject: Mapped[str | None] = mapped_column(String(255), nullable=True)
    body_mjml: Mapped[str | None] = mapped_column(Text, nullable=True)
    body_html: Mapped[str | None] = mapped_column(Text, nullable=True)
    body_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    variables: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, nullable=False, default=list)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")
    approved_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    tenant_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )


# ---------------------------------------------------------------------------
# Bindings
# ---------------------------------------------------------------------------


class CommBinding(Base):
    __tablename__ = "bindings"
    __table_args__ = {"schema": "comm"}

    id: Mapped[uuid.UUID] = _uuid_pk()
    event_name: Mapped[str] = mapped_column(String(120), nullable=False)
    event_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    channel: Mapped[str] = mapped_column(String(20), nullable=False)
    template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("comm.templates.id", ondelete="RESTRICT"),
        nullable=False,
    )
    locale: Mapped[str | None] = mapped_column(String(16), nullable=True)
    audience_rule: Mapped[Any] = mapped_column(JSONB, nullable=False, default=lambda: True)
    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    throttle_rpm: Mapped[int | None] = mapped_column(Integer, nullable=True)
    schedule_cron: Mapped[str | None] = mapped_column(String(120), nullable=True)
    quiet_hours_aware: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    tenant_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


# ---------------------------------------------------------------------------
# Outbox
# ---------------------------------------------------------------------------


class CommOutbox(Base):
    __tablename__ = "outbox"
    __table_args__ = {"schema": "comm"}

    id: Mapped[uuid.UUID] = _uuid_pk()
    event_name: Mapped[str] = mapped_column(String(120), nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    correlation_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    idempotency_key: Mapped[str | None] = mapped_column(String(128), nullable=True, unique=True)
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    claimed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    claimed_by: Mapped[str | None] = mapped_column(String(128), nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )


# ---------------------------------------------------------------------------
# Messages
# ---------------------------------------------------------------------------


class CommMessage(Base):
    __tablename__ = "messages"
    __table_args__ = {"schema": "comm"}

    id: Mapped[uuid.UUID] = _uuid_pk()
    correlation_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    event_outbox_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    channel: Mapped[str] = mapped_column(String(20), nullable=False)
    provider_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    template_version_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    locale: Mapped[str] = mapped_column(String(16), nullable=False, default="en-IN")
    recipient: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[str | None] = mapped_column(String(255), nullable=True)
    payload_snapshot: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    idempotency_key: Mapped[str | None] = mapped_column(String(128), nullable=True, unique=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    opened_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    clicked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    cost_paise: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )


class CommMessageEvent(Base):
    __tablename__ = "message_events"
    __table_args__ = {"schema": "comm"}

    id: Mapped[uuid.UUID] = _uuid_pk()
    message_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("comm.messages.id", ondelete="CASCADE"),
        nullable=False,
    )
    event_type: Mapped[str] = mapped_column(String(40), nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    payload: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)


# ---------------------------------------------------------------------------
# Suppression list
# ---------------------------------------------------------------------------


class CommSuppressionEntry(Base):
    __tablename__ = "suppression_list"
    __table_args__ = {"schema": "comm"}

    channel: Mapped[str] = mapped_column(String(20), primary_key=True)
    identifier: Mapped[str] = mapped_column(String(255), primary_key=True)
    reason: Mapped[str] = mapped_column(String(60), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    added_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    added_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )


# ---------------------------------------------------------------------------
# OTP archive (cold storage; live OTPs in Redis)
# ---------------------------------------------------------------------------


class CommOtpArchive(Base):
    __tablename__ = "otp_archive"
    __table_args__ = {"schema": "comm"}

    id: Mapped[uuid.UUID] = _uuid_pk()
    purpose: Mapped[str] = mapped_column(String(60), nullable=False)
    phone_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)


# ---------------------------------------------------------------------------
# DLT compliance
# ---------------------------------------------------------------------------


class CommDltPrincipalEntity(Base):
    __tablename__ = "dlt_principal_entities"
    __table_args__ = {"schema": "comm"}

    id: Mapped[uuid.UUID] = _uuid_pk()
    entity_id: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    telecom_operator: Mapped[str | None] = mapped_column(String(60), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )


class CommDltTemplate(Base):
    __tablename__ = "dlt_templates"
    __table_args__ = {"schema": "comm"}

    id: Mapped[uuid.UUID] = _uuid_pk()
    principal_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("comm.dlt_principal_entities.id", ondelete="CASCADE"),
        nullable=False,
    )
    header_id: Mapped[str] = mapped_column(String(50), nullable=False)
    template_id: Mapped[str] = mapped_column(String(50), nullable=False)
    content_pattern: Mapped[str | None] = mapped_column(Text, nullable=True)
    dlt_category: Mapped[str] = mapped_column(String(30), nullable=False, default="transactional")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )


# ---------------------------------------------------------------------------
# WhatsApp
# ---------------------------------------------------------------------------


class CommWhatsAppTemplate(Base):
    __tablename__ = "whatsapp_templates"
    __table_args__ = {"schema": "comm"}

    id: Mapped[uuid.UUID] = _uuid_pk()
    meta_template_id: Mapped[str] = mapped_column(String(128), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    language: Mapped[str] = mapped_column(String(16), nullable=False, default="en")
    category: Mapped[str] = mapped_column(String(40), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="PENDING")
    components: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, nullable=False, default=list)
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )


class CommWhatsAppSession(Base):
    __tablename__ = "whatsapp_sessions"
    __table_args__ = {"schema": "comm"}

    waba_phone_number_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    recipient_phone: Mapped[str] = mapped_column(String(20), primary_key=True)
    last_inbound_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )


# ---------------------------------------------------------------------------
# Short links (click tracking)
# ---------------------------------------------------------------------------


class CommShortLink(Base):
    __tablename__ = "short_links"
    __table_args__ = {"schema": "comm"}

    slug: Mapped[str] = mapped_column(String(20), primary_key=True)
    target_url: Mapped[str] = mapped_column(Text, nullable=False)
    message_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    click_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )


# ---------------------------------------------------------------------------
# Audit log (append-only)
# ---------------------------------------------------------------------------


class CommAuditLog(Base):
    __tablename__ = "audit_logs"
    __table_args__ = {"schema": "comm"}

    id: Mapped[uuid.UUID] = _uuid_pk()
    actor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    action: Mapped[str] = mapped_column(String(120), nullable=False)
    target_table: Mapped[str] = mapped_column(String(120), nullable=False)
    target_id: Mapped[str] = mapped_column(String(128), nullable=False)
    before: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    after: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    request_id: Mapped[str | None] = mapped_column(String(128), nullable=True)


# ---------------------------------------------------------------------------
# Outbound webhooks
# ---------------------------------------------------------------------------


class CommOutboundWebhook(Base):
    __tablename__ = "outbound_webhooks"
    __table_args__ = {"schema": "comm"}

    id: Mapped[uuid.UUID] = _uuid_pk()
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    secret: Mapped[str | None] = mapped_column(String(128), nullable=True)
    event_filter: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )
