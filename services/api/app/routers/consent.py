import logging

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.consent_log import ConsentLog
from app.models.user import User
from app.schemas.consent import ConsentCreate, ConsentResponse, ConsentStatusResponse

router = APIRouter(prefix="/consent", tags=["Consent"])
logger = logging.getLogger(__name__)


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
    await db.commit()
    await db.refresh(log)

    logger.info(
        f"Consent logged: user={current_user.id} context={payload.context} version={payload.consent_version}"
    )

    return log


@router.get("/status", response_model=ConsentStatusResponse)
async def check_consent_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    CURRENT_VERSION = "v1.0"

    stmt = (
        select(ConsentLog)
        .where(
            ConsentLog.user_id == current_user.id,
            ConsentLog.consent_version == CURRENT_VERSION,
            ConsentLog.regulatory_accepted.is_(True),
            ConsentLog.privacy_accepted.is_(True),
        )
        .order_by(ConsentLog.created_at.desc())
        .limit(1)
    )

    result = await db.execute(stmt)
    log = result.scalars().first()

    return ConsentStatusResponse(has_consented=log is not None, consent_version=CURRENT_VERSION)
