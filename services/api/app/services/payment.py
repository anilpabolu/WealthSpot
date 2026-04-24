"""
Razorpay payment service.
"""

import hashlib
import hmac
from decimal import Decimal

import razorpay  # type: ignore[import-untyped]

from app.core.config import get_settings

settings = get_settings()


def _get_client() -> razorpay.Client:
    return razorpay.Client(
        auth=(settings.razorpay_key_id, settings.razorpay_key_secret),
    )


def create_order(
    amount_inr: Decimal, receipt: str, notes: dict[str, str] | None = None
) -> dict[str, object]:
    """
    Create a Razorpay order.
    Amount is in INR (Decimal), converted to paise for Razorpay.
    """
    client = _get_client()
    amount_paise = int(amount_inr * 100)

    order_data: dict[str, object] = {
        "amount": amount_paise,
        "currency": "INR",
        "receipt": receipt,
        "payment_capture": 1,  # auto-capture
    }
    if notes:
        order_data["notes"] = notes

    return client.order.create(data=order_data)  # type: ignore[no-any-return]


def verify_payment_signature(
    order_id: str,
    payment_id: str,
    signature: str,
) -> bool:
    """Verify Razorpay payment-callback signature: HMAC-SHA256 of `${order_id}|${payment_id}`."""
    message = f"{order_id}|{payment_id}"
    expected = hmac.new(
        settings.razorpay_key_secret.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


def verify_webhook_signature(body: bytes, signature: str) -> bool:
    """Verify Razorpay webhook signature: HMAC-SHA256 of the raw request body."""
    expected = hmac.new(
        settings.razorpay_key_secret.encode("utf-8"),
        body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)
