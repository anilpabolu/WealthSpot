"""
Communication Platform router.

Endpoints:
    POST   /comm/events/publish                        publish an event to outbox
    POST   /comm/otp/issue                             issue OTP
    POST   /comm/otp/verify                            verify OTP

    GET    /comm/events                                list events
    POST   /comm/events                                create event
    GET    /comm/events/{id}                           get event
    PATCH  /comm/events/{id}                           update event

    GET    /comm/templates                             list templates
    POST   /comm/templates                             create template
    GET    /comm/templates/{id}                        get template
    POST   /comm/templates/{id}/versions              add template version

    GET    /comm/bindings                              list bindings
    POST   /comm/bindings                              create binding
    GET    /comm/bindings/{id}                         get binding
    PATCH  /comm/bindings/{id}                         update binding
    DELETE /comm/bindings/{id}                         soft-delete binding

    GET    /comm/providers                             list providers
    POST   /comm/providers                             create provider
    GET    /comm/providers/{id}                        get provider
    PATCH  /comm/providers/{id}                        update provider

    GET    /comm/suppression                           list suppression entries
    POST   /comm/suppression                           add suppression entry
    DELETE /comm/suppression/{channel}/{identifier}    remove suppression entry

    GET    /comm/messages                              list messages (admin)
    GET    /comm/messages/{id}                         get message detail

    GET    /comm/users/{user_id}/preferences           get user preferences
    PATCH  /comm/users/{user_id}/preferences           update user preferences

    GET    /comm/dashboard/kpis                        dashboard KPIs
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.comm.api import publish as comm_publish
from app.comm.exceptions import CommError, OtpInvalid, OtpRateLimited
from app.comm.models import (
    CommBinding,
    CommEvent,
    CommMessage,
    CommOutbox,
    CommProvider,
    CommSuppressionEntry,
    CommTemplate,
    CommTemplateVersion,
    CommUserProfile,
)
from app.comm.otp import issue_otp, verify_otp
from app.comm.schemas import (
    BindingCreate,
    BindingRead,
    BindingUpdate,
    DashboardKpis,
    EventCreate,
    EventRead,
    EventUpdate,
    MessageDetailRead,
    MessageRead,
    OtpRequest,
    OtpResponse,
    OtpVerifyRequest,
    OtpVerifyResponse,
    ProviderCreate,
    ProviderRead,
    ProviderUpdate,
    PublishRequest,
    PublishResponse,
    SuppressionCreate,
    SuppressionRead,
    TemplateCreate,
    TemplateRead,
    TemplateVersionCreate,
    TemplateVersionRead,
    UserProfileRead,
    UserProfileUpdate,
)
from app.comm.security import encrypt_provider_config
from app.core.database import get_db
from app.middleware.auth import get_current_user, require_role
from app.models.user import User, UserRole

router = APIRouter(prefix="/comm", tags=["comm"])

_AdminDep = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN))
_CurrentUser = Depends(get_current_user)


# ── Publish ──────────────────────────────────────────────────────────────────


@router.post(
    "/events/publish",
    response_model=PublishResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Publish a communication event",
)
async def publish_event(
    body: PublishRequest,
    db: AsyncSession = Depends(get_db),
    _: User = _CurrentUser,
):
    try:
        outbox_id = await comm_publish(
            event_name=body.event_name,
            payload=body.payload,
            session=db,
            version=body.version,
            correlation_id=body.correlation_id,
            idempotency_key=body.idempotency_key,
            tenant_id=body.tenant_id,
        )
        await db.commit()
        return PublishResponse(
            outbox_id=outbox_id,
            status="accepted",
            correlation_id=body.correlation_id,
        )
    except CommError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc


# ── OTP ──────────────────────────────────────────────────────────────────────


@router.post(
    "/otp/issue",
    response_model=OtpResponse,
    summary="Issue a one-time password via SMS",
)
async def otp_issue(body: OtpRequest):
    try:
        issue_otp(
            purpose=body.purpose,
            phone=body.phone,
            ip=body.ip or "0.0.0.0",
            length=body.length,
            ttl_seconds=body.ttl_seconds,
        )
        return OtpResponse(issued=True, purpose=body.purpose, phone=body.phone)
    except OtpRateLimited as exc:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(exc)) from exc


@router.post(
    "/otp/verify",
    response_model=OtpVerifyResponse,
    summary="Verify a one-time password",
)
async def otp_verify(body: OtpVerifyRequest):
    try:
        valid = verify_otp(
            purpose=body.purpose,
            phone=body.phone,
            code=body.code,
            max_attempts=body.max_attempts,
        )
        return OtpVerifyResponse(valid=valid)
    except OtpInvalid as exc:
        return OtpVerifyResponse(valid=False, reason=str(exc))


# ── Events ───────────────────────────────────────────────────────────────────


@router.get("/events", response_model=list[EventRead], summary="List registered events")
async def list_events(
    db: AsyncSession = Depends(get_db),
    _: User = _AdminDep,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    result = await db.execute(
        select(CommEvent)
        .where(CommEvent.deleted_at.is_(None))
        .offset(skip)
        .limit(limit)
        .order_by(CommEvent.event_name)
    )
    return result.scalars().all()


@router.post(
    "/events",
    response_model=EventRead,
    status_code=status.HTTP_201_CREATED,
    summary="Register a communication event",
)
async def create_event(
    body: EventCreate,
    db: AsyncSession = Depends(get_db),
    _: User = _AdminDep,
):
    event = CommEvent(**body.model_dump())
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


@router.get("/events/{event_id}", response_model=EventRead, summary="Get event by ID")
async def get_event(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = _AdminDep,
):
    result = await db.execute(
        select(CommEvent).where(CommEvent.id == event_id, CommEvent.deleted_at.is_(None))
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.patch("/events/{event_id}", response_model=EventRead, summary="Update event")
async def update_event(
    event_id: uuid.UUID,
    body: EventUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = _AdminDep,
):
    result = await db.execute(
        select(CommEvent).where(CommEvent.id == event_id, CommEvent.deleted_at.is_(None))
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(event, field, val)
    await db.commit()
    await db.refresh(event)
    return event


# ── Templates ────────────────────────────────────────────────────────────────


@router.get("/templates", response_model=list[TemplateRead], summary="List message templates")
async def list_templates(
    db: AsyncSession = Depends(get_db),
    _: User = _AdminDep,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    channel: str | None = None,
):
    stmt = (
        select(CommTemplate)
        .where(CommTemplate.deleted_at.is_(None))
        .offset(skip)
        .limit(limit)
        .order_by(CommTemplate.name)
    )
    if channel:
        stmt = stmt.where(CommTemplate.channel == channel)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/templates",
    response_model=TemplateRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create message template",
)
async def create_template(
    body: TemplateCreate,
    db: AsyncSession = Depends(get_db),
    _: User = _AdminDep,
):
    tmpl = CommTemplate(**body.model_dump())
    db.add(tmpl)
    await db.commit()
    await db.refresh(tmpl)
    return tmpl


@router.get(
    "/templates/{template_id}",
    response_model=TemplateRead,
    summary="Get template by ID",
)
async def get_template(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = _AdminDep,
):
    result = await db.execute(
        select(CommTemplate).where(
            CommTemplate.id == template_id,
            CommTemplate.deleted_at.is_(None),
        )
    )
    tmpl = result.scalar_one_or_none()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")
    return tmpl


@router.post(
    "/templates/{template_id}/versions",
    response_model=TemplateVersionRead,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new version to a template",
)
async def add_template_version(
    template_id: uuid.UUID,
    body: TemplateVersionCreate,
    db: AsyncSession = Depends(get_db),
    _: User = _AdminDep,
):
    # verify template exists
    result = await db.execute(
        select(CommTemplate).where(
            CommTemplate.id == template_id, CommTemplate.deleted_at.is_(None)
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Template not found")

    # get next version number
    count_result = await db.execute(
        select(func.count(CommTemplateVersion.id)).where(
            CommTemplateVersion.template_id == template_id
        )
    )
    next_ver = (count_result.scalar_one() or 0) + 1

    tv = CommTemplateVersion(
        template_id=template_id,
        version_no=next_ver,
        **body.model_dump(),
    )
    db.add(tv)
    await db.commit()
    await db.refresh(tv)
    return tv


# ── Bindings ─────────────────────────────────────────────────────────────────


@router.get("/bindings", response_model=list[BindingRead], summary="List event bindings")
async def list_bindings(
    db: AsyncSession = Depends(get_db),
    _: User = _AdminDep,
    event_name: str | None = None,
    channel: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    stmt = (
        select(CommBinding)
        .where(CommBinding.deleted_at.is_(None))
        .offset(skip)
        .limit(limit)
        .order_by(CommBinding.priority)
    )
    if event_name:
        stmt = stmt.where(CommBinding.event_name == event_name)
    if channel:
        stmt = stmt.where(CommBinding.channel == channel)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/bindings",
    response_model=BindingRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create event binding",
)
async def create_binding(
    body: BindingCreate,
    db: AsyncSession = Depends(get_db),
    _: User = _AdminDep,
):
    from app.comm.bindings import invalidate_bindings_cache

    binding = CommBinding(**body.model_dump())
    db.add(binding)
    await db.commit()
    await db.refresh(binding)
    invalidate_bindings_cache(body.event_name, body.event_version)
    return binding


@router.get("/bindings/{binding_id}", response_model=BindingRead, summary="Get binding by ID")
async def get_binding(
    binding_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = _AdminDep,
):
    result = await db.execute(
        select(CommBinding).where(CommBinding.id == binding_id, CommBinding.deleted_at.is_(None))
    )
    binding = result.scalar_one_or_none()
    if not binding:
        raise HTTPException(status_code=404, detail="Binding not found")
    return binding


@router.patch("/bindings/{binding_id}", response_model=BindingRead, summary="Update binding")
async def update_binding(
    binding_id: uuid.UUID,
    body: BindingUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = _AdminDep,
):
    from app.comm.bindings import invalidate_bindings_cache

    result = await db.execute(
        select(CommBinding).where(CommBinding.id == binding_id, CommBinding.deleted_at.is_(None))
    )
    binding = result.scalar_one_or_none()
    if not binding:
        raise HTTPException(status_code=404, detail="Binding not found")

    for field, val in body.model_dump(exclude_none=True).items():
        setattr(binding, field, val)
    await db.commit()
    await db.refresh(binding)
    invalidate_bindings_cache(binding.event_name, binding.event_version)
    return binding


@router.delete(
    "/bindings/{binding_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft-delete binding",
)
async def delete_binding(
    binding_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = _AdminDep,
):
    from datetime import UTC, datetime

    from app.comm.bindings import invalidate_bindings_cache

    result = await db.execute(
        select(CommBinding).where(CommBinding.id == binding_id, CommBinding.deleted_at.is_(None))
    )
    binding = result.scalar_one_or_none()
    if not binding:
        raise HTTPException(status_code=404, detail="Binding not found")

    binding.deleted_at = datetime.now(UTC)
    await db.commit()
    invalidate_bindings_cache(binding.event_name, binding.event_version)


# ── Providers ────────────────────────────────────────────────────────────────


@router.get("/providers", response_model=list[ProviderRead], summary="List providers")
async def list_providers(
    db: AsyncSession = Depends(get_db),
    _: User = _AdminDep,
):
    result = await db.execute(
        select(CommProvider)
        .where(CommProvider.deleted_at.is_(None))
        .order_by(CommProvider.priority)
    )
    return result.scalars().all()


@router.post(
    "/providers",
    response_model=ProviderRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create provider",
)
async def create_provider(
    body: ProviderCreate,
    db: AsyncSession = Depends(get_db),
    _: User = _AdminDep,
):
    config_enc = encrypt_provider_config(body.config)
    provider = CommProvider(
        channel=body.channel,
        kind=body.kind,
        name=body.name,
        config_encrypted=config_enc,
        priority=body.priority,
        is_active=body.is_active,
        failover_to_id=body.failover_to_id,
    )
    db.add(provider)
    await db.commit()
    await db.refresh(provider)
    return provider


@router.get(
    "/providers/{provider_id}",
    response_model=ProviderRead,
    summary="Get provider by ID",
)
async def get_provider(
    provider_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = _AdminDep,
):
    result = await db.execute(
        select(CommProvider).where(
            CommProvider.id == provider_id, CommProvider.deleted_at.is_(None)
        )
    )
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider


@router.patch(
    "/providers/{provider_id}",
    response_model=ProviderRead,
    summary="Update provider",
)
async def update_provider(
    provider_id: uuid.UUID,
    body: ProviderUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = _AdminDep,
):
    result = await db.execute(
        select(CommProvider).where(
            CommProvider.id == provider_id, CommProvider.deleted_at.is_(None)
        )
    )
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    if body.config is not None:
        provider.config_encrypted = encrypt_provider_config(body.config)
    for field in ("name", "priority", "is_active", "failover_to_id"):
        val = getattr(body, field, None)
        if val is not None:
            setattr(provider, field, val)
    await db.commit()
    await db.refresh(provider)
    return provider


# ── Suppression ──────────────────────────────────────────────────────────────


@router.get(
    "/suppression",
    response_model=list[SuppressionRead],
    summary="List suppression entries",
)
async def list_suppression(
    db: AsyncSession = Depends(get_db),
    _: User = _AdminDep,
    channel: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    stmt = (
        select(CommSuppressionEntry)
        .offset(skip)
        .limit(limit)
        .order_by(CommSuppressionEntry.added_at.desc())
    )
    if channel:
        stmt = stmt.where(CommSuppressionEntry.channel == channel)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/suppression",
    response_model=SuppressionRead,
    status_code=status.HTTP_201_CREATED,
    summary="Add suppression entry",
)
async def add_suppression(
    body: SuppressionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = _CurrentUser,
    _: User = _AdminDep,
):
    entry = CommSuppressionEntry(
        channel=body.channel,
        identifier=body.identifier,
        reason=body.reason,
        note=body.note,
        added_by=current_user.id,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.delete(
    "/suppression/{channel}/{identifier}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove suppression entry",
)
async def remove_suppression(
    channel: str,
    identifier: str,
    db: AsyncSession = Depends(get_db),
    _: User = _AdminDep,
):
    result = await db.execute(
        select(CommSuppressionEntry).where(
            CommSuppressionEntry.channel == channel,
            CommSuppressionEntry.identifier == identifier,
        )
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Suppression entry not found")
    await db.delete(entry)
    await db.commit()


# ── Messages ─────────────────────────────────────────────────────────────────


@router.get(
    "/messages",
    response_model=list[MessageRead],
    summary="List messages (admin)",
)
async def list_messages(
    db: AsyncSession = Depends(get_db),
    _: User = _AdminDep,
    channel: str | None = None,
    status_filter: str | None = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    stmt = select(CommMessage).offset(skip).limit(limit).order_by(CommMessage.created_at.desc())
    if channel:
        stmt = stmt.where(CommMessage.channel == channel)
    if status_filter:
        stmt = stmt.where(CommMessage.status == status_filter)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get(
    "/messages/{message_id}",
    response_model=MessageDetailRead,
    summary="Get message detail",
)
async def get_message(
    message_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = _AdminDep,
):
    result = await db.execute(select(CommMessage).where(CommMessage.id == message_id))
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    return msg


# ── User Preferences ─────────────────────────────────────────────────────────


@router.get(
    "/users/{user_id}/preferences",
    response_model=UserProfileRead,
    summary="Get user communication preferences",
)
async def get_user_preferences(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = _CurrentUser,
):
    # Users can view their own prefs; admins can view any
    if current_user.id != user_id and current_user.role not in (
        UserRole.ADMIN,
        UserRole.SUPER_ADMIN,
    ):
        raise HTTPException(status_code=403, detail="Not authorised")

    result = await db.execute(select(CommUserProfile).where(CommUserProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.patch(
    "/users/{user_id}/preferences",
    response_model=UserProfileRead,
    summary="Update user communication preferences",
)
async def update_user_preferences(
    user_id: uuid.UUID,
    body: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = _CurrentUser,
):
    if current_user.id != user_id and current_user.role not in (
        UserRole.ADMIN,
        UserRole.SUPER_ADMIN,
    ):
        raise HTTPException(status_code=403, detail="Not authorised")

    result = await db.execute(select(CommUserProfile).where(CommUserProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        # Auto-create

        profile = CommUserProfile(user_id=user_id)
        db.add(profile)

    for field, val in body.model_dump(exclude_none=True).items():
        setattr(profile, field, val)
    await db.commit()
    await db.refresh(profile)
    return profile


# ── Dashboard KPIs ───────────────────────────────────────────────────────────


@router.get(
    "/dashboard/kpis",
    response_model=DashboardKpis,
    summary="Communication platform KPIs",
)
async def dashboard_kpis(
    db: AsyncSession = Depends(get_db),
    _: User = _AdminDep,
    days: int = Query(7, ge=1, le=90),
):
    from datetime import UTC, datetime, timedelta

    since = datetime.now(UTC) - timedelta(days=days)

    kpis = DashboardKpis(period_days=days)

    for ch, ch_kpis in [
        ("email", kpis.email),
        ("sms", kpis.sms),
        ("whatsapp", kpis.whatsapp),
        ("in_app", kpis.in_app),
    ]:
        for stat, _col_name in [
            ("sent", "sent"),
            ("delivered", "delivered"),
            ("opened", "opened"),
            ("failed", "failed"),
        ]:
            result = await db.execute(
                select(func.count(CommMessage.id)).where(
                    CommMessage.channel == ch,
                    CommMessage.status == stat,
                    CommMessage.created_at >= since,
                )
            )
            setattr(ch_kpis, stat, result.scalar_one() or 0)

    # Outbox stats
    for stat, outbox_status in [("outbox_pending", "pending"), ("outbox_failed", "failed")]:
        result = await db.execute(
            select(func.count(CommOutbox.id)).where(
                CommOutbox.status == outbox_status,
                CommOutbox.created_at >= since,
            )
        )
        setattr(kpis, stat, result.scalar_one() or 0)

    return kpis
