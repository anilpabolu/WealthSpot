"""
Notification service – create & dispatch notifications.
"""

from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification, NotificationType


async def create_notification(
    db: AsyncSession,
    *,
    user_id: UUID,
    type: str,
    title: str,
    body: str,
    channel: str = "in_app",
    data: dict[str, Any] | None = None,
) -> Notification:
    """Create and persist a notification."""
    notification = Notification(
        user_id=user_id,
        type=type,
        channel=channel,
        title=title,
        body=body,
        data=data,
    )
    db.add(notification)
    await db.flush()
    return notification


async def notify_investment_confirmed(
    db: AsyncSession,
    user_id: UUID,
    property_title: str,
    amount: float,
    units: int,
) -> Notification:
    """Send notification when an investment is confirmed."""
    return await create_notification(
        db,
        user_id=user_id,
        type=NotificationType.INVESTMENT_CONFIRMED,
        title="Investment Confirmed!",
        body=f"Your investment of ₹{amount:,.0f} ({units} units) in {property_title} has been confirmed.",
        data={"property_title": property_title, "amount": amount, "units": units},
    )


async def notify_kyc_status_change(
    db: AsyncSession,
    user_id: UUID,
    new_status: str,
    reason: str | None = None,
) -> Notification:
    """Notify user when KYC status changes."""
    type_map = {
        "APPROVED": NotificationType.KYC_APPROVED,
        "REJECTED": NotificationType.KYC_REJECTED,
    }
    ntype = type_map.get(new_status, "kyc_update")

    body = f"Your KYC verification has been {new_status.lower()}."
    if reason:
        body += f" Reason: {reason}"

    return await create_notification(
        db,
        user_id=user_id,
        type=ntype,
        title=f"KYC {new_status.title()}",
        body=body,
        data={"kyc_status": new_status, "reason": reason},
    )


async def notify_payout(
    db: AsyncSession,
    user_id: UUID,
    property_title: str,
    amount: float,
    payout_type: str = "rental",
) -> Notification:
    """Notify user of a payout (rental or exit)."""
    return await create_notification(
        db,
        user_id=user_id,
        type=NotificationType.PAYOUT_CREDITED,
        title=f"{payout_type.title()} Payout Credited",
        body=f"₹{amount:,.0f} {payout_type} payout for {property_title} has been credited to your account.",
        data={"property_title": property_title, "amount": amount, "type": payout_type},
    )
