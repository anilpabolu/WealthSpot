"""Public SDK for publishing communication events."""

from __future__ import annotations

import logging
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.comm.exceptions import EventNotRegistered, PayloadValidationError

log = logging.getLogger(__name__)


async def publish(
    event_name: str,
    payload: dict[str, Any],
    *,
    session: AsyncSession,
    version: int = 1,
    correlation_id: str | None = None,
    idempotency_key: str | None = None,
    tenant_id: uuid.UUID | None = None,
) -> uuid.UUID:
    """
    Validate the event exists, write to CommOutbox, return outbox_id.
    The celery beat poller will pick it up within `comm_outbox_poll_seconds`.
    """
    from app.comm.models import CommEvent, CommOutbox

    # 1. Event registry check
    result = await session.execute(
        select(CommEvent).where(
            CommEvent.event_name == event_name,
            CommEvent.version == version,
            CommEvent.enabled.is_(True),
            CommEvent.deleted_at.is_(None),
        )
    )
    event = result.scalar_one_or_none()
    if event is None:
        raise EventNotRegistered(f"Event {event_name!r} v{version} is not registered or disabled")

    # 2. Basic payload type validation
    if not isinstance(payload, dict):
        raise PayloadValidationError("payload must be a dict")

    # 3. Idempotency check
    if idempotency_key:
        existing = await session.execute(
            select(CommOutbox.id).where(CommOutbox.idempotency_key == idempotency_key)
        )
        row = existing.scalar_one_or_none()
        if row is not None:
            log.debug("idempotent publish — returning existing outbox_id=%s", row)
            return row

    # 4. Write outbox row
    outbox = CommOutbox(
        event_name=event_name,
        version=version,
        payload=payload,
        correlation_id=correlation_id,
        idempotency_key=idempotency_key,
        tenant_id=tenant_id,
        status="pending",
    )
    session.add(outbox)
    await session.flush()
    log.debug("published event=%s v%s outbox_id=%s", event_name, version, outbox.id)
    return outbox.id


# ---------------------------------------------------------------------------
# Escape-hatch namespaces for direct one-off sends
# ---------------------------------------------------------------------------


class _EmailNamespace:
    """Direct email send, bypassing event/binding pipeline."""

    async def send(
        self,
        to: str,
        subject: str,
        html: str | None = None,
        text: str | None = None,
        correlation_id: str | None = None,
    ) -> bool:
        from app.comm.providers import EmailEnvelope, StubEmailProvider

        env = EmailEnvelope(
            to=to,
            subject=subject,
            html=html,
            text=text,
            correlation_id=correlation_id,
        )
        provider = StubEmailProvider()
        result = await provider.send(env)
        return result.success


class _SmsNamespace:
    """Direct SMS send, bypassing event/binding pipeline."""

    async def send(
        self,
        to: str,
        body: str,
        correlation_id: str | None = None,
    ) -> bool:
        from app.comm.providers import SmsEnvelope, StubSmsProvider

        env = SmsEnvelope(to=to, body=body, correlation_id=correlation_id)
        provider = StubSmsProvider()
        result = await provider.send(env)
        return result.success


class _WhatsAppNamespace:
    """Direct WhatsApp send, bypassing event/binding pipeline."""

    async def send(
        self,
        to: str,
        template_name: str,
        language_code: str = "en",
        components: list[dict[str, Any]] | None = None,
        correlation_id: str | None = None,
    ) -> bool:
        from app.comm.providers import StubWhatsAppProvider, WhatsAppEnvelope

        env = WhatsAppEnvelope(
            to=to,
            template_name=template_name,
            language_code=language_code,
            components=components or [],
            correlation_id=correlation_id,
        )
        provider = StubWhatsAppProvider()
        result = await provider.send(env)
        return result.success


email = _EmailNamespace()
sms = _SmsNamespace()
whatsapp = _WhatsAppNamespace()
