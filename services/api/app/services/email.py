"""
Email sending service – SMTP-based OTP delivery.
Falls back to logging when SMTP is not configured.
"""

import logging
import smtplib
from email.message import EmailMessage
from functools import partial

import anyio

from app.core.config import get_settings

logger = logging.getLogger(__name__)


async def send_otp_email(to_email: str, otp: str) -> bool:
    """Send OTP verification email via SMTP. Returns True if sent."""
    settings = get_settings()

    if not settings.smtp_host:
        logger.warning("SMTP not configured — OTP for %s logged only", to_email)
        return False

    msg = EmailMessage()
    msg["Subject"] = f"WealthSpot – Your Verification Code: {otp}"
    from_addr = settings.smtp_from_email or settings.smtp_username
    msg["From"] = f"{settings.smtp_from_name} <{from_addr}>"
    msg["To"] = to_email
    msg.set_content(
        f"Your WealthSpot verification code is: {otp}\n\n"
        f"This code expires in 10 minutes.\n\n"
        f"If you didn't request this, please ignore this email."
    )
    msg.add_alternative(
        f"""<html><body style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:0;background:#f9fafb">
<div style="text-align:center;padding:40px 24px;background:#ffffff;border-radius:16px;margin:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <div style="margin-bottom:24px">
        <span style="font-size:24px;font-weight:bold;color:#1a1a1a">Wealth<span style="color:#6366f1">Spot</span></span>
    </div>
    <h2 style="color:#1a1a1a;margin:0 0 8px;font-size:20px">Verification Code</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px">Use this code to verify your WealthSpot account</p>
    <div style="background:#f3f4f6;border-radius:12px;padding:20px;margin:0 auto 24px;max-width:280px">
        <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#2563eb;font-family:monospace">{otp}</span>
    </div>
    <p style="color:#9ca3af;font-size:12px;margin:0">This code expires in 10 minutes. Do not share it with anyone.</p>
</div>
</body></html>""",
        subtype="html",
    )

    try:
        await anyio.to_thread.run_sync(partial(_send_smtp, msg))
        logger.info("OTP email sent to %s", to_email)
        return True
    except Exception:
        logger.exception("Failed to send OTP email to %s", to_email)
        return False


def _send_smtp(msg: EmailMessage) -> None:
    """Blocking SMTP send — executed in thread pool."""
    settings = get_settings()
    if settings.smtp_port == 465:
        with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            if settings.smtp_username and settings.smtp_password:
                server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(msg)
    else:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            server.starttls()
            if settings.smtp_username and settings.smtp_password:
                server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(msg)
