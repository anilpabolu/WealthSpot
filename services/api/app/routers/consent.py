import logging

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.consent_log import ConsentLog
from app.models.user import User
from app.schemas.consent import ConsentCreate, ConsentResponse, ConsentStatusResponse

router = APIRouter(prefix="/consent", tags=["Consent"])
logger = logging.getLogger(__name__)


CURRENT_VERSION = "v1.0"


@router.post("", response_model=ConsentResponse)
async def record_consent(
    payload: ConsentCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    log = ConsentLog(
        user_id=current_user.id,
        context=payload.context,
        consent_version=payload.consent_version,
        regulatory_accepted=payload.regulatory_accepted,
        privacy_accepted=payload.privacy_accepted,
        communication_accepted=payload.communication_accepted,
        target_id=payload.target_id,
        ip_address=ip_address,
        user_agent=user_agent,
        location=payload.location,
        device_details=payload.device_details,
    )
    db.add(log)

    # Mark the user as having consented for ONBOARDING so the status check
    # is a direct column read rather than a fragile log query.
    if payload.context == "ONBOARDING" and payload.regulatory_accepted and payload.privacy_accepted:
        current_user.has_onboarding_consent = True

    await db.commit()
    await db.refresh(log)

    logger.info(
        "Consent logged: user=%s context=%s version=%s",
        current_user.id,
        payload.context,
        payload.consent_version,
    )

    return log


@router.get("/status", response_model=ConsentStatusResponse)
async def check_consent_status(
    current_user: User = Depends(get_current_user),
):
    """Return consent status read directly from the user row — no log query needed."""
    return ConsentStatusResponse(
        has_consented=current_user.has_onboarding_consent,
        consent_version=CURRENT_VERSION,
    )
