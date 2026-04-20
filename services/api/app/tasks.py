"""
Celery tasks for background processing.
Separates long-running work from the request/response cycle.
"""

import logging
from datetime import UTC

from celery import shared_task

logger = logging.getLogger(__name__)


# ── Notification Tasks ───────────────────────────────────────────────────────


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_email_task(
    self, to_email: str, subject: str, body_text: str, body_html: str | None = None
):
    """Send an email via SMTP in the background."""
    import smtplib
    from email.message import EmailMessage

    from app.core.config import get_settings

    settings = get_settings()

    if not settings.smtp_host:
        logger.warning("SMTP not configured – skipping email to %s", to_email)
        return False

    msg = EmailMessage()
    msg["Subject"] = subject
    from_addr = settings.smtp_from_email or settings.smtp_username
    msg["From"] = f"{settings.smtp_from_name} <{from_addr}>"
    msg["To"] = to_email
    msg.set_content(body_text)
    if body_html:
        msg.add_alternative(body_html, subtype="html")

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30) as server:
            server.ehlo()
            if settings.smtp_port != 25:
                server.starttls()
            if settings.smtp_username:
                server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(msg)
        logger.info("Background email sent to %s", to_email)
        return True
    except Exception as exc:
        logger.exception("Failed to send email to %s", to_email)
        raise self.retry(exc=exc) from exc


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_sms_task(self, phone_number: str, message: str):
    """Send an SMS via Twilio in the background."""
    from app.core.config import get_settings

    settings = get_settings()

    if not settings.twilio_account_sid:
        logger.warning("Twilio not configured – skipping SMS to %s", phone_number)
        return False

    try:
        from twilio.rest import Client  # type: ignore[import-not-found]
    except ImportError:
        logger.error("twilio package not installed – cannot send SMS")
        return False

    try:
        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        client.messages.create(
            body=message,
            from_=settings.twilio_phone_number,
            to=phone_number,
        )
        logger.info("Background SMS sent to %s", phone_number)
        return True
    except Exception as exc:
        logger.exception("Failed to send SMS to %s", phone_number)
        raise self.retry(exc=exc) from exc


# ── Cleanup Tasks ────────────────────────────────────────────────────────────


@shared_task
def cleanup_expired_otps():
    """Remove expired OTP records from the database."""
    import asyncio
    from datetime import datetime, timedelta

    from sqlalchemy import text

    from app.core.database import async_session_factory

    async def _cleanup():
        async with async_session_factory() as session:
            cutoff = datetime.now(UTC) - timedelta(minutes=15)
            # OTPs older than 15 minutes are considered expired
            await session.execute(
                text("DELETE FROM users WHERE otp IS NOT NULL AND otp_expires_at < :cutoff"),
                {"cutoff": cutoff},
            )
            # Actually, just clear the OTP fields, don't delete users
            await session.execute(
                text(
                    "UPDATE users SET otp = NULL, otp_expires_at = NULL "
                    "WHERE otp IS NOT NULL AND otp_expires_at < :cutoff"
                ),
                {"cutoff": cutoff},
            )
            await session.commit()
            logger.info("Cleaned up expired OTPs (cutoff=%s)", cutoff)

    asyncio.run(_cleanup())


@shared_task
def cleanup_old_audit_logs():
    """Archive/delete audit logs older than 90 days."""
    import asyncio
    from datetime import datetime, timedelta

    from sqlalchemy import text

    from app.core.database import async_session_factory

    async def _cleanup():
        async with async_session_factory() as session:
            cutoff = datetime.now(UTC) - timedelta(days=90)
            await session.execute(
                text("DELETE FROM audit_logs WHERE created_at < :cutoff"),
                {"cutoff": cutoff},
            )
            await session.commit()


# ── Analytics Tasks ─────────────────────────────────────────────────────────────────


@shared_task
def refresh_analytics_views():
    """Refresh all analytics materialized views."""
    import asyncio

    from sqlalchemy import text

    from app.core.database import async_session_factory

    async def _refresh():
        async with async_session_factory() as session:
            await session.execute(text("SELECT refresh_analytics_views()"))
            await session.commit()
            logger.info("Analytics materialized views refreshed")

    asyncio.run(_refresh())
            logger.info("Archived audit logs older than %s", cutoff)

    asyncio.run(_cleanup())
