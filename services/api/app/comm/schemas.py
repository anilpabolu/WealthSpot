"""Pydantic v2 DTOs for the WealthSpot Communication Platform."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

# ---------------------------------------------------------------------------
# Shared base
# ---------------------------------------------------------------------------


class _Resp(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Publish / OTP
# ---------------------------------------------------------------------------


class PublishRequest(BaseModel):
    event_name: str
    version: int = 1
    payload: dict[str, Any]
    correlation_id: str | None = None
    idempotency_key: str | None = None
    tenant_id: uuid.UUID | None = None


class PublishResponse(BaseModel):
    outbox_id: uuid.UUID
    status: str
    correlation_id: str | None


class OtpRequest(BaseModel):
    purpose: str
    phone: str
    ip: str | None = "0.0.0.0"
    length: int = Field(default=6, ge=4, le=8)
    ttl_seconds: int = Field(default=300, ge=60, le=600)


class OtpResponse(BaseModel):
    issued: bool
    purpose: str
    phone: str


class OtpVerifyRequest(BaseModel):
    purpose: str
    phone: str
    code: str
    max_attempts: int = Field(default=5, ge=1, le=10)


class OtpVerifyResponse(BaseModel):
    valid: bool
    reason: str | None = None


# ---------------------------------------------------------------------------
# Event DTOs
# ---------------------------------------------------------------------------


class EventRead(_Resp):
    id: uuid.UUID
    event_name: str
    version: int
    description: str | None
    category: str
    is_promotional: bool
    is_transactional: bool
    default_locale: str
    enabled: bool
    created_at: datetime
    updated_at: datetime


class EventCreate(BaseModel):
    event_name: str
    version: int = 1
    description: str | None = None
    payload_schema: dict[str, Any] = Field(default_factory=dict)
    category: str = "general"
    is_promotional: bool = False
    is_transactional: bool = True
    default_locale: str = "en-IN"
    enabled: bool = True


class EventUpdate(BaseModel):
    description: str | None = None
    category: str | None = None
    is_promotional: bool | None = None
    is_transactional: bool | None = None
    default_locale: str | None = None
    enabled: bool | None = None


# ---------------------------------------------------------------------------
# Provider DTOs
# ---------------------------------------------------------------------------


class ProviderRead(_Resp):
    id: uuid.UUID
    channel: str
    kind: str
    name: str
    priority: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ProviderCreate(BaseModel):
    channel: str
    kind: str
    name: str
    config: dict[str, Any] = Field(default_factory=dict)
    priority: int = 100
    is_active: bool = True
    failover_to_id: uuid.UUID | None = None


class ProviderUpdate(BaseModel):
    name: str | None = None
    config: dict[str, Any] | None = None
    priority: int | None = None
    is_active: bool | None = None
    failover_to_id: uuid.UUID | None = None


# ---------------------------------------------------------------------------
# Template DTOs
# ---------------------------------------------------------------------------


class TemplateRead(_Resp):
    id: uuid.UUID
    name: str
    channel: str
    status: str
    created_at: datetime
    updated_at: datetime


class TemplateCreate(BaseModel):
    name: str
    channel: str


class TemplateVersionRead(_Resp):
    id: uuid.UUID
    template_id: uuid.UUID
    version_no: int
    locale: str
    subject: str | None
    body_text: str | None
    body_html: str | None
    status: str
    created_at: datetime


class TemplateVersionCreate(BaseModel):
    locale: str = "en-IN"
    subject: str | None = None
    body_mjml: str | None = None
    body_html: str | None = None
    body_text: str | None = None
    variables: list[dict[str, Any]] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Binding DTOs
# ---------------------------------------------------------------------------


class BindingRead(_Resp):
    id: uuid.UUID
    event_name: str
    event_version: int
    channel: str
    template_id: uuid.UUID
    locale: str | None
    priority: int
    enabled: bool
    quiet_hours_aware: bool
    audience_rule: Any
    created_at: datetime
    updated_at: datetime


class BindingCreate(BaseModel):
    event_name: str
    event_version: int = 1
    channel: str
    template_id: uuid.UUID
    locale: str | None = None
    audience_rule: Any = True
    priority: int = 100
    enabled: bool = True
    throttle_rpm: int | None = None
    quiet_hours_aware: bool = True


class BindingUpdate(BaseModel):
    template_id: uuid.UUID | None = None
    locale: str | None = None
    audience_rule: Any = None
    priority: int | None = None
    enabled: bool | None = None
    throttle_rpm: int | None = None
    quiet_hours_aware: bool | None = None


# ---------------------------------------------------------------------------
# Suppression DTOs
# ---------------------------------------------------------------------------


class SuppressionRead(_Resp):
    channel: str
    identifier: str
    reason: str
    note: str | None
    added_at: datetime


class SuppressionCreate(BaseModel):
    channel: str
    identifier: str
    reason: str
    note: str | None = None


# ---------------------------------------------------------------------------
# Message DTOs
# ---------------------------------------------------------------------------


class MessageRead(_Resp):
    id: uuid.UUID
    channel: str
    recipient: str
    subject: str | None
    status: str
    attempts: int
    sent_at: datetime | None
    created_at: datetime


class MessageDetailRead(MessageRead):
    correlation_id: str | None
    locale: str
    payload_snapshot: dict[str, Any] | None
    error: str | None


# ---------------------------------------------------------------------------
# User profile DTOs
# ---------------------------------------------------------------------------


class UserProfileRead(_Resp):
    user_id: uuid.UUID
    locale: str
    timezone: str
    marketing_consent: bool
    transactional_email: bool
    transactional_sms: bool
    transactional_whatsapp: bool
    promotional_email: bool
    promotional_sms: bool
    promotional_whatsapp: bool


class UserProfileUpdate(BaseModel):
    locale: str | None = None
    timezone: str | None = None
    marketing_consent: bool | None = None
    transactional_email: bool | None = None
    transactional_sms: bool | None = None
    transactional_whatsapp: bool | None = None
    promotional_email: bool | None = None
    promotional_sms: bool | None = None
    promotional_whatsapp: bool | None = None


# ---------------------------------------------------------------------------
# Dashboard DTOs
# ---------------------------------------------------------------------------


class ChannelKpis(BaseModel):
    sent: int = 0
    delivered: int = 0
    opened: int = 0
    failed: int = 0


class DashboardKpis(BaseModel):
    period_days: int
    email: ChannelKpis = Field(default_factory=ChannelKpis)
    sms: ChannelKpis = Field(default_factory=ChannelKpis)
    whatsapp: ChannelKpis = Field(default_factory=ChannelKpis)
    in_app: ChannelKpis = Field(default_factory=ChannelKpis)
    outbox_pending: int = 0
    outbox_failed: int = 0
