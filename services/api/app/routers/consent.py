import logging

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.consent_log import ConsentLog
from app.models.user import User
from app.schemas.consent import ConsentCreate, ConsentResponse

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
        consent_type=payload.consent_type,
        consented=payload.consented,
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
        f"Consent logged: user={current_user.id} type={payload.consent_type} consented={payload.consented}"
    )

    return log
