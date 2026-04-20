"""
Webhook router – Clerk, Razorpay callbacks.
"""

import hashlib
import hmac
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.models.investment import Investment, InvestmentStatus
from app.models.property import Property, PropertyStatus
from app.models.user import User

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

settings = get_settings()
logger = logging.getLogger(__name__)


def _verify_clerk_signature(body: bytes, headers: dict[str, str]) -> bool:
    """Verify Clerk webhook signature using HMAC-SHA256.

    Clerk signs webhooks with the configured webhook secret.
    See: https://clerk.com/docs/integrations/webhooks
    """
    secret = settings.clerk_webhook_secret
    if not secret:
        if settings.app_env == "production":
            logger.error("CLERK_WEBHOOK_SECRET not configured in production – rejecting webhook")
            return False
        logger.warning("CLERK_WEBHOOK_SECRET not configured – skipping verification (dev only)")
        return True

    svix_id = headers.get("svix-id", "")
    svix_timestamp = headers.get("svix-timestamp", "")
    svix_signature = headers.get("svix-signature", "")

    if not svix_id or not svix_timestamp or not svix_signature:
        return False

    # Construct the signed content
    signed_content = f"{svix_id}.{svix_timestamp}.{body.decode('utf-8')}"

    # The secret may have a "whsec_" prefix that must be stripped
    secret_bytes = secret.encode("utf-8")
    if secret.startswith("whsec_"):
        import base64

        secret_bytes = base64.b64decode(secret[6:])

    expected = hmac.new(
        secret_bytes,
        signed_content.encode("utf-8"),
        hashlib.sha256,
    ).digest()

    import base64

    expected_b64 = base64.b64encode(expected).decode("utf-8")

    # svix-signature can contain multiple signatures separated by spaces
    for sig in svix_signature.split(" "):
        sig_value = sig.split(",", 1)[-1] if "," in sig else sig
        if hmac.compare_digest(expected_b64, sig_value):
            return True

    return False


@router.post("/clerk")
async def clerk_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """
    Handle Clerk webhook events (user.created, user.updated, user.deleted).
    Verifies svix signature, then syncs user data to our DB.
    """
    body = await request.body()

    if not _verify_clerk_signature(body, dict(request.headers)):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    payload: dict[str, Any] = await request.json()
    event_type = payload.get("type", "")
    data = payload.get("data", {})

    if event_type == "user.created":
        clerk_id = data.get("id", "")
        email = ""
        email_addresses = data.get("email_addresses", [])
        if email_addresses:
            email = email_addresses[0].get("email_address", "")

        full_name = f"{data.get('first_name', '')} {data.get('last_name', '')}".strip()
        avatar_url = data.get("image_url")
        phone = (
            data.get("phone_numbers", [{}])[0].get("phone_number")
            if data.get("phone_numbers")
            else None
        )

        if email:
            # Check if user already exists
            existing = await db.execute(select(User).where(User.email == email))
            if existing.scalar_one_or_none() is None:
                user = User(
                    clerk_id=clerk_id,
                    email=email,
                    full_name=full_name or email.split("@")[0],
                    avatar_url=avatar_url,
                    phone=phone,
                )
                db.add(user)
                await db.flush()
                logger.info("Clerk webhook: created user %s", email)
            else:
                # Link existing user to Clerk
                existing_user = (
                    await db.execute(select(User).where(User.email == email))
                ).scalar_one()
                existing_user.clerk_id = clerk_id
                if avatar_url:
                    existing_user.avatar_url = avatar_url
                await db.flush()
                logger.info(
                    "Clerk webhook: linked existing user %s to clerk_id %s", email, clerk_id
                )

    elif event_type == "user.updated":
        clerk_id = data.get("id", "")
        result = await db.execute(select(User).where(User.clerk_id == clerk_id))
        user = result.scalar_one_or_none()

        if user:
            first = data.get("first_name", "")
            last = data.get("last_name", "")
            if first or last:
                user.full_name = f"{first} {last}".strip()
            if data.get("image_url"):
                user.avatar_url = data["image_url"]
            if data.get("phone_numbers"):
                user.phone = data["phone_numbers"][0].get("phone_number")
            await db.flush()
            logger.info("Clerk webhook: updated user clerk_id=%s", clerk_id)

    elif event_type == "user.deleted":
        clerk_id = data.get("id", "")
        result = await db.execute(select(User).where(User.clerk_id == clerk_id))
        user = result.scalar_one_or_none()

        if user:
            user.is_active = False
            await db.flush()
            logger.info("Clerk webhook: deactivated user clerk_id=%s", clerk_id)

    return {"status": "ok"}


def _verify_razorpay_signature(body: bytes, signature: str) -> bool:
    """Verify Razorpay webhook signature using HMAC-SHA256."""
    secret = settings.razorpay_key_secret
    if not secret:
        if settings.app_env == "production":
            logger.error("RAZORPAY_KEY_SECRET not configured in production – rejecting webhook")
            return False
        logger.warning("RAZORPAY_KEY_SECRET not configured – skipping verification (dev only)")
        return True

    expected = hmac.new(
        secret.encode("utf-8"),
        body,
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(expected, signature)


@router.post("/razorpay")
async def razorpay_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """
    Handle Razorpay payment webhooks.
    Verifies signature and processes payment events.
    """
    body = await request.body()
    signature = request.headers.get("x-razorpay-signature", "")

    if not _verify_razorpay_signature(body, signature):
        raise HTTPException(status_code=400, detail="Invalid signature")

    payload: dict[str, Any] = await request.json()
    event = payload.get("event", "")
    payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
    razorpay_payment_id = payment_entity.get("id", "")

    if event == "payment.captured":
        # Find investment by razorpay_payment_id and confirm
        if razorpay_payment_id:
            result = await db.execute(
                select(Investment).where(Investment.razorpay_payment_id == razorpay_payment_id)
            )
            investment = result.scalar_one_or_none()
            if investment and investment.status == InvestmentStatus.PAYMENT_PENDING:
                # Use savepoint + row-level lock to prevent overselling
                async with db.begin_nested():
                    investment.status = InvestmentStatus.CONFIRMED

                    prop_result = await db.execute(
                        select(Property)
                        .where(Property.id == investment.property_id)
                        .with_for_update(of=Property)
                    )
                    prop = prop_result.scalar_one_or_none()
                    if prop:
                        if prop.sold_units + investment.units > prop.total_units:
                            logger.error(
                                "Razorpay webhook: oversell prevented for property %s",
                                prop.id,
                            )
                            investment.status = InvestmentStatus.CANCELLED
                        else:
                            prop.raised_amount += investment.amount
                            prop.sold_units += investment.units
                            prop.investor_count += 1
                            if prop.raised_amount >= prop.target_amount:
                                prop.status = PropertyStatus.FUNDED

                await db.flush()
                logger.info("Razorpay webhook: confirmed investment %s", investment.id)

    elif event == "payment.failed":
        if razorpay_payment_id:
            result = await db.execute(
                select(Investment).where(Investment.razorpay_payment_id == razorpay_payment_id)
            )
            investment = result.scalar_one_or_none()
            if investment and investment.status == InvestmentStatus.PAYMENT_PENDING:
                investment.status = InvestmentStatus.CANCELLED
                await db.flush()
                logger.info(
                    "Razorpay webhook: cancelled investment %s due to payment failure",
                    investment.id,
                )

    elif event == "refund.processed":
        refund_entity = payload.get("payload", {}).get("refund", {}).get("entity", {})
        refund_payment_id = refund_entity.get("payment_id", "")
        if refund_payment_id:
            result = await db.execute(
                select(Investment).where(Investment.razorpay_payment_id == refund_payment_id)
            )
            investment = result.scalar_one_or_none()
            if investment:
                investment.status = InvestmentStatus.CANCELLED
                await db.flush()
                logger.info("Razorpay webhook: refunded investment %s", investment.id)

    return {"status": "ok"}
