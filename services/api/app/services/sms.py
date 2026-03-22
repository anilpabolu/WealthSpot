"""
SMS / WhatsApp sending service – Twilio-based OTP delivery.
Falls back to logging when Twilio is not configured.
"""

import logging

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

TWILIO_MSG_URL = "https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"


async def send_otp_sms(phone: str, otp: str) -> bool:
    """Send OTP via Twilio SMS. Returns True if sent."""
    settings = get_settings()

    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        logger.warning("Twilio not configured — SMS OTP for %s logged only", phone)
        return False

    body = f"Your WealthSpot verification code is: {otp}. Valid for 10 minutes."
    url = TWILIO_MSG_URL.format(sid=settings.twilio_account_sid)

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                url,
                auth=(settings.twilio_account_sid, settings.twilio_auth_token),
                data={
                    "From": settings.twilio_phone_number,
                    "To": phone,
                    "Body": body,
                },
            )
            resp.raise_for_status()
            sid = resp.json().get("sid", "unknown")
            logger.info("OTP SMS sent to %s (SID: %s)", phone, sid)
            return True
    except Exception:
        logger.exception("Failed to send OTP SMS to %s", phone)
        return False


async def send_otp_whatsapp(phone: str, otp: str) -> bool:
    """Send OTP via Twilio WhatsApp. Returns True if sent."""
    settings = get_settings()

    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        logger.warning("Twilio/WhatsApp not configured — WA OTP for %s logged only", phone)
        return False

    wa_from = settings.twilio_whatsapp_number or settings.twilio_phone_number
    body = f"Your WealthSpot verification code is: {otp}. Valid for 10 minutes."
    url = TWILIO_MSG_URL.format(sid=settings.twilio_account_sid)

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                url,
                auth=(settings.twilio_account_sid, settings.twilio_auth_token),
                data={
                    "From": f"whatsapp:{wa_from}",
                    "To": f"whatsapp:{phone}",
                    "Body": body,
                },
            )
            resp.raise_for_status()
            logger.info("OTP WhatsApp sent to %s", phone)
            return True
    except Exception:
        logger.exception("Failed to send OTP via WhatsApp to %s", phone)
        return False
