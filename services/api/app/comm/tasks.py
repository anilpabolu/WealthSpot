"""Celery tasks for the communication platform."""

from __future__ import annotations

import asyncio
import logging
import uuid

from celery import shared_task

log = logging.getLogger(__name__)


def _run_async(coro):
    """Run a coroutine in a dedicated event loop (Celery worker thread)."""
    return asyncio.get_event_loop().run_until_complete(coro)


@shared_task(
    name="comm.dispatch_outbox_batch",
    bind=True,
    max_retries=0,
    queue="comm.orchestrator",
    ignore_result=True,
)
def dispatch_outbox_batch(self, batch_size: int | None = None):
    """
    Polled beat task: claim up to `batch_size` pending outbox rows and
    dispatch an `orchestrate_event` task per row.
    """
    from app.core.config import get_settings

    settings = get_settings()
    limit = batch_size or settings.comm_outbox_batch_size

    async def _run():
        from datetime import UTC, datetime

        from sqlalchemy import select, update

        from app.comm.models import CommOutbox
        from app.core.database import async_session_factory

        async with async_session_factory() as session:
            result = await session.execute(
                select(CommOutbox.id)
                .where(CommOutbox.status == "pending")
                .order_by(CommOutbox.created_at.asc())
                .limit(limit)
                .with_for_update(skip_locked=True)
            )
            ids = [row[0] for row in result.all()]
            if ids:
                await session.execute(
                    update(CommOutbox)
                    .where(CommOutbox.id.in_(ids))
                    .values(claimed_at=datetime.now(UTC))
                )
                await session.commit()
            return ids

    outbox_ids = _run_async(_run())
    for oid in outbox_ids:
        orchestrate_event.delay(str(oid))

    if outbox_ids:
        log.info("dispatch_outbox_batch: dispatched %d rows", len(outbox_ids))


@shared_task(
    name="comm.orchestrate_event",
    bind=True,
    max_retries=3,
    default_retry_delay=30,
    queue="comm.orchestrator",
    acks_late=True,
    reject_on_worker_lost=True,
)
def orchestrate_event(self, outbox_id: str):
    """Process a single outbox row through the full fan-out pipeline."""
    oid = uuid.UUID(outbox_id)

    async def _run():
        from app.comm.orchestrator import orchestrate_outbox_row
        from app.core.database import async_session_factory

        async with async_session_factory() as session:
            await orchestrate_outbox_row(oid, session)

    try:
        _run_async(_run())
    except Exception as exc:
        log.error("orchestrate_event %s failed: %s", outbox_id, exc, exc_info=True)
        raise self.retry(exc=exc) from exc
