"""
Webhook router – Clerk, Razorpay callbacks.
"""

import hashlib
import hmac
from typing import Any

from fastapi import APIRouter, HTTPException, Request

from app.core.config import get_settings

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

settings = get_settings()


@router.post("/clerk")
async def clerk_webhook(request: Request) -> dict[str, str]:
    """
    Handle Clerk webhook events (user.created, user.updated, etc.).
    In production: verify svix signature, then sync user data.
    """
    body = await request.json()
    event_type = body.get("type", "")

    # TODO: Verify Clerk webhook signature using svix
    # svix_id = request.headers.get("svix-id")
    # svix_timestamp = request.headers.get("svix-timestamp")
    # svix_signature = request.headers.get("svix-signature")

    if event_type == "user.created":
        # Sync new user to our DB
        pass
    elif event_type == "user.updated":
        # Update user profile
        pass
    elif event_type == "user.deleted":
        # Deactivate user
        pass

    return {"status": "ok"}


@router.post("/razorpay")
async def razorpay_webhook(request: Request) -> dict[str, str]:
    """
    Handle Razorpay payment webhooks.
    Verifies signature and processes payment events.
    """
    body = await request.body()
    signature = request.headers.get("x-razorpay-signature", "")

    # Verify signature
    if settings.razorpay_key_secret:
        expected = hmac.new(
            settings.razorpay_key_secret.encode(),
            body,
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(expected, signature):
            raise HTTPException(status_code=400, detail="Invalid signature")

    payload: dict[str, Any] = await request.json()
    event = payload.get("event", "")

    if event == "payment.captured":
        # Mark investment as confirmed
        pass
    elif event == "payment.failed":
        # Handle failure
        pass
    elif event == "refund.processed":
        # Handle refund
        pass

    return {"status": "ok"}
