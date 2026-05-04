"""India DLT (Distributed Ledger Technology) compliance gate for SMS.

TRAI mandates that all commercial SMS sent in India must use pre-registered
DLT templates with a matching template ID. This module provides a pre-send
gate that:

1. Looks up the DLT templates registered for the SMS provider's header.
2. Regex-matches the outgoing message body against each template's pattern.
3. Raises `DltTemplateMismatch` if no pattern matches — the message must
   NEVER reach the provider in this case.

Phase 1: The gate is implemented but DLT templates are seeded via admin UI
(Command Control → Compliance → DLT Registry). If no templates are
registered the gate passes with a WARNING (permissive mode) so dev/test
environments aren't blocked. Set `DLT_STRICT=true` to make no-template a
hard failure.
"""

from __future__ import annotations

import logging
import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.comm.exceptions import DltTemplateMismatch
from app.comm.models import CommDltTemplate
from app.core.config import get_settings

logger = logging.getLogger(__name__)


async def assert_compliant(
    session: AsyncSession,
    *,
    content: str,
    header_id: str | None = None,
) -> str | None:
    """Assert that `content` matches at least one active DLT template.

    Returns the matched `template_id` if found, or None in permissive mode.

    Raises:
        DltTemplateMismatch: when strict mode is on and content matches no
            registered template, OR when templates exist but none match.
    """
    stmt = select(CommDltTemplate).where(CommDltTemplate.status == "active")
    if header_id:
        stmt = stmt.where(CommDltTemplate.header_id == header_id)
    result = await session.execute(stmt)
    templates = result.scalars().all()

    if not templates:
        settings = get_settings()
        strict = getattr(settings, "dlt_strict", False)
        if strict:
            raise DltTemplateMismatch(
                "DLT strict mode: no registered templates found for this header"
            )
        logger.warning(
            "DLT gate: no templates registered (header_id=%s) — passing in permissive mode",
            header_id,
        )
        return None

    for tpl in templates:
        pattern = tpl.content_pattern
        if not pattern:
            continue
        try:
            if re.search(pattern, content):
                return tpl.template_id
        except re.error:
            logger.warning("DLT template %s has invalid regex pattern", tpl.id)

    raise DltTemplateMismatch(
        f"SMS content does not match any registered DLT template "
        f"(header_id={header_id!r}, content_preview={content[:60]!r})"
    )
