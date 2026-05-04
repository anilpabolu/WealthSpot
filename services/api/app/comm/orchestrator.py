"""Orchestration engine — fan-out pipeline from a CommOutbox row."""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.comm.audience import matches
from app.comm.bindings import load_active_bindings
from app.comm.exceptions import CommError
from app.comm.pipeline import GateContext, evaluate_gates
from app.comm.providers import (
    EmailEnvelope,
    EmailProvider,
    SmsEnvelope,
    WhatsAppEnvelope,
    build_email_provider,
    build_sms_provider,
    build_whatsapp_provider,
)
from app.comm.render import render
from app.comm.security import decrypt_provider_config

log = logging.getLogger(__name__)


async def orchestrate_outbox_row(outbox_id: uuid.UUID, session: AsyncSession) -> None:
    """Process a single outbox row end-to-end."""
    from app.comm.models import CommOutbox

    # Claim the row
    stmt = (
        update(CommOutbox)
        .where(
            CommOutbox.id == outbox_id,
            CommOutbox.status == "pending",
        )
        .values(
            status="claimed",
            claimed_at=datetime.now(UTC),
            attempts=CommOutbox.attempts + 1,
        )
        .returning(CommOutbox)
    )
    result = await session.execute(stmt)
    await session.flush()
    outbox = result.scalar_one_or_none()

    if outbox is None:
        log.debug("outbox row %s already claimed or not found — skip", outbox_id)
        return

    try:
        await _do_fan_out(outbox, session)
        await session.execute(
            update(CommOutbox)
            .where(CommOutbox.id == outbox_id)
            .values(status="done", updated_at=datetime.now(UTC))
        )
    except Exception as exc:
        log.error("outbox %s failed: %s", outbox_id, exc, exc_info=True)
        await session.execute(
            update(CommOutbox)
            .where(CommOutbox.id == outbox_id)
            .values(
                status="failed",
                error=str(exc)[:500],
                updated_at=datetime.now(UTC),
            )
        )

    await session.commit()


async def _do_fan_out(outbox: Any, session: AsyncSession) -> None:
    """Resolve bindings, evaluate pipeline, send per channel."""
    bindings = await load_active_bindings(outbox.event_name, outbox.version, session)

    if not bindings:
        log.debug("no bindings for %s v%s", outbox.event_name, outbox.version)
        return

    payload: dict[str, Any] = outbox.payload or {}
    user_id: str | None = payload.get("user_id")

    # Load user / profile
    user, profile = await _load_user_and_profile(user_id, session)

    for binding in bindings:
        # Audience gate
        audience_ctx = {
            "user": {"id": user_id},
            "payload": payload,
            "tenant_id": str(outbox.tenant_id) if outbox.tenant_id else None,
        }
        if not matches(binding.audience_rule, audience_ctx):
            log.debug("binding %s: audience gate failed — skip", binding.id)
            continue

        # Gate chain
        gate_ctx = GateContext(
            user_id=user_id,
            user_email=user.email if user else None,
            user_phone=user.phone if user else None,
            channel=binding.channel,
            event_name=outbox.event_name,
            is_promotional=await _is_promotional(outbox.event_name, outbox.version, session),
            binding=binding,
            profile=profile,
        )
        should_send, reason = await evaluate_gates(gate_ctx, session)
        if not should_send:
            log.info(
                "outbox %s binding %s: gate blocked reason=%s",
                outbox.id,
                binding.id,
                reason,
            )
            await _record_message(
                outbox=outbox,
                binding=binding,
                recipient=_recipient_for_channel(binding.channel, user, profile),
                status="suppressed",
                error=reason,
                session=session,
            )
            continue

        # Send
        await _send_via_binding(outbox, binding, user, profile, payload, session)


async def _send_via_binding(
    outbox: Any,
    binding: Any,
    user: Any | None,
    profile: Any | None,
    payload: dict[str, Any],
    session: AsyncSession,
) -> None:
    from app.comm.models import CommTemplateVersion

    # Resolve template version
    tv_stmt = (
        select(CommTemplateVersion)
        .where(
            CommTemplateVersion.template_id == binding.template_id,
            CommTemplateVersion.locale == (binding.locale or "en-IN"),
            CommTemplateVersion.status == "active",
        )
        .order_by(CommTemplateVersion.version_no.desc())
        .limit(1)
    )
    result = await session.execute(tv_stmt)
    tv = result.scalar_one_or_none()

    if tv is None:
        # Fallback to any locale active version
        tv_stmt2 = (
            select(CommTemplateVersion)
            .where(
                CommTemplateVersion.template_id == binding.template_id,
                CommTemplateVersion.status == "active",
            )
            .order_by(CommTemplateVersion.version_no.desc())
            .limit(1)
        )
        result2 = await session.execute(tv_stmt2)
        tv = result2.scalar_one_or_none()

    if tv is None:
        log.warning(
            "binding %s: no active template version for template_id=%s",
            binding.id,
            binding.template_id,
        )
        return

    subject, html, text = render(
        body_mjml=tv.body_mjml,
        body_html=tv.body_html,
        body_text=tv.body_text,
        subject=tv.subject,
        variables=payload,
    )

    # Resolve provider
    provider_row = await _get_best_provider(binding.channel, session)
    if provider_row is None:
        log.warning("binding %s: no active provider for channel %s", binding.id, binding.channel)
        return

    config = decrypt_provider_config(provider_row.config_encrypted)

    channel = binding.channel
    recipient = _recipient_for_channel(channel, user, profile)
    if not recipient:
        log.warning("binding %s: no recipient for channel %s user=%s", binding.id, channel, getattr(user, 'id', None))
        return

    msg_id = await _record_message(
        outbox=outbox,
        binding=binding,
        recipient=recipient,
        status="sending",
        tv=tv,
        provider_id=provider_row.id,
        subject=subject,
        session=session,
    )

    try:
        if channel == "email":
            provider: EmailProvider = build_email_provider(provider_row.kind, config)  # type: ignore[assignment]
            env = EmailEnvelope(
                to=recipient,
                subject=subject or "(no subject)",
                html=html,
                text=text,
                correlation_id=str(outbox.correlation_id or outbox.id),
            )
            result_obj = await provider.send(env)

        elif channel == "sms":
            from app.comm.dlt import assert_compliant

            dlt_header_id = config.get("dlt_header_id")
            if dlt_header_id and text:
                await assert_compliant(session, content=text, header_id=dlt_header_id)

            provider = build_sms_provider(provider_row.kind, config)  # type: ignore[assignment]
            env = SmsEnvelope(  # type: ignore[assignment]
                to=recipient,
                body=text or html or "",
                sender_id=config.get("sender_id", "WLTHSP"),
                dlt_header_id=dlt_header_id,
                correlation_id=str(outbox.correlation_id or outbox.id),
            )
            result_obj = await provider.send(env)

        elif channel == "whatsapp":
            provider = build_whatsapp_provider(provider_row.kind, config)  # type: ignore[assignment]
            env = WhatsAppEnvelope(  # type: ignore[assignment]
                to=recipient,
                template_name=config.get("wa_template_name", tv.body_text or ""),
                language_code="en",
                correlation_id=str(outbox.correlation_id or outbox.id),
            )
            result_obj = await provider.send(env)

        elif channel == "in_app":
            from app.comm.inapp import write_in_app

            await write_in_app(
                user_id=user.id if user else payload.get("user_id"),  # type: ignore[arg-type]
                title=subject or outbox.event_name,
                body=text or "",
                data=payload,
                session=session,
            )
            result_obj = None

        else:
            log.warning("unknown channel %s — skip", channel)
            return

        if result_obj is None or result_obj.success:
            await _update_message_status(msg_id, "sent", session)
        else:
            await _update_message_status(msg_id, "failed", session, error=result_obj.error)

    except CommError as exc:
        log.error("send failed binding=%s: %s", binding.id, exc)
        await _update_message_status(msg_id, "failed", session, error=str(exc))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _load_user_and_profile(user_id: str | None, session: AsyncSession):
    if not user_id:
        return None, None
    try:
        from app.comm.models import CommUserProfile
        from app.models.user import User  # type: ignore[import-not-found]

        u_result = await session.execute(
            select(User).where(User.id == user_id)  # type: ignore[attr-defined]
        )
        user = u_result.scalar_one_or_none()

        p_result = await session.execute(
            select(CommUserProfile).where(CommUserProfile.user_id == user_id)
        )
        profile = p_result.scalar_one_or_none()
        return user, profile
    except Exception as exc:
        log.warning("could not load user/profile user_id=%s: %s", user_id, exc)
        return None, None


async def _is_promotional(event_name: str, version: int, session: AsyncSession) -> bool:
    from app.comm.models import CommEvent

    result = await session.execute(
        select(CommEvent.is_promotional).where(
            CommEvent.event_name == event_name,
            CommEvent.version == version,
        )
    )
    row = result.scalar_one_or_none()
    return bool(row)


async def _get_best_provider(channel: str, session: AsyncSession):
    from app.comm.models import CommProvider

    result = await session.execute(
        select(CommProvider)
        .where(
            CommProvider.channel == channel,
            CommProvider.is_active.is_(True),
            CommProvider.deleted_at.is_(None),
        )
        .order_by(CommProvider.priority.asc())
        .limit(1)
    )
    return result.scalar_one_or_none()


def _recipient_for_channel(
    channel: str, user: Any | None, profile: Any | None
) -> str | None:
    if channel == "email":
        return getattr(user, "email", None)
    elif channel == "sms" or channel == "whatsapp":
        if profile and profile.whatsapp_phone:
            return profile.whatsapp_phone
        return getattr(user, "phone", None)
    # in_app — user_id used by inapp.write_in_app
    return getattr(user, "id", None) and str(user.id)  # type: ignore[union-attr]


async def _record_message(
    *,
    outbox: Any,
    binding: Any,
    recipient: str | None,
    status: str,
    tv: Any = None,
    provider_id: Any = None,
    subject: str | None = None,
    error: str | None = None,
    session: AsyncSession,
) -> uuid.UUID:
    from app.comm.models import CommMessage

    row = CommMessage(
        correlation_id=str(outbox.correlation_id or outbox.id),
        event_outbox_id=outbox.id,
        user_id=outbox.payload.get("user_id"),
        channel=binding.channel,
        provider_id=provider_id,
        template_version_id=tv.id if tv else None,
        locale=(binding.locale or "en-IN"),
        recipient=recipient or "",
        subject=subject,
        payload_snapshot=outbox.payload,
        status=status,
        error=error,
        tenant_id=outbox.tenant_id,
    )
    session.add(row)
    await session.flush()
    return row.id


async def _update_message_status(
    msg_id: uuid.UUID,
    status: str,
    session: AsyncSession,
    error: str | None = None,
) -> None:
    from app.comm.models import CommMessage

    values: dict[str, Any] = {
        "status": status,
        "updated_at": datetime.now(UTC),
    }
    if status == "sent":
        values["sent_at"] = datetime.now(UTC)
    if error:
        values["error"] = error[:500]

    await session.execute(
        update(CommMessage).where(CommMessage.id == msg_id).values(**values)
    )
