"""
Bank Details router – CRUD with Fernet encryption and full audit trail.
All sensitive fields (account number, IFSC, etc.) are encrypted at rest.
"""

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.community import AuditLog
from app.models.user import BankDetail, User
from app.schemas.user import BankDetailCreate, BankDetailOut, BankDetailUpdate
from app.services.encryption import decrypt, encrypt, mask_account_number

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bank", tags=["bank-details"])


async def _audit(
    db: AsyncSession,
    *,
    actor_id: uuid.UUID,
    action: str,
    resource_type: str,
    resource_id: str | None = None,
    old_value: dict | None = None,
    new_value: dict | None = None,
    request: Request | None = None,
) -> None:
    ip = None
    ua = None
    if request:
        ip = request.client.host if request.client else None
        ua = request.headers.get("user-agent")
    log = AuditLog(
        actor_id=actor_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        old_value=old_value,
        new_value=new_value,
        ip_address=ip,
        user_agent=ua,
    )
    db.add(log)


def _to_response(detail: BankDetail) -> BankDetailOut:
    """Decrypt fields and build the response object."""
    return BankDetailOut(
        id=detail.id,
        account_holder_name=decrypt(detail.account_holder_name_enc),
        account_number_masked=mask_account_number(decrypt(detail.account_number_enc)),
        ifsc_code=decrypt(detail.ifsc_code_enc),
        bank_name=decrypt(detail.bank_name_enc),
        branch_name=decrypt(detail.branch_name_enc) if detail.branch_name_enc else None,
        account_type=detail.account_type,
        is_primary=detail.is_primary,
        is_verified=detail.is_verified,
        created_at=detail.created_at,
        updated_at=detail.updated_at,
    )


# ── Create ───────────────────────────────────────────────────────────────────


@router.post("", response_model=BankDetailOut)
async def create_bank_detail(
    body: BankDetailCreate,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BankDetailOut:
    """Add a new bank account (encrypted at rest)."""
    detail = BankDetail(
        user_id=user.id,
        account_holder_name_enc=encrypt(body.account_holder_name),
        account_number_enc=encrypt(body.account_number),
        ifsc_code_enc=encrypt(body.ifsc_code),
        bank_name_enc=encrypt(body.bank_name),
        branch_name_enc=encrypt(body.branch_name) if body.branch_name else None,
        account_type=body.account_type,
    )
    db.add(detail)
    await db.flush()

    await _audit(
        db,
        actor_id=user.id,
        action="bank.create",
        resource_type="bank_detail",
        resource_id=str(detail.id),
        new_value={
            "bank_name": body.bank_name,
            "account_number_masked": mask_account_number(body.account_number),
            "ifsc_code": body.ifsc_code,
            "account_type": body.account_type,
        },
        request=request,
    )

    return _to_response(detail)


# ── List ─────────────────────────────────────────────────────────────────────


@router.get("", response_model=list[BankDetailOut])
async def list_bank_details(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[BankDetailOut]:
    """List all bank accounts for the current user."""
    result = await db.execute(
        select(BankDetail)
        .where(BankDetail.user_id == user.id)
        .order_by(BankDetail.created_at.desc())
    )
    return [_to_response(d) for d in result.scalars().all()]


# ── Get Single ───────────────────────────────────────────────────────────────


@router.get("/{bank_id}", response_model=BankDetailOut)
async def get_bank_detail(
    bank_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BankDetailOut:
    """Get a single bank account detail."""
    result = await db.execute(
        select(BankDetail).where(
            BankDetail.id == bank_id,
            BankDetail.user_id == user.id,
        )
    )
    detail = result.scalar_one_or_none()
    if not detail:
        raise HTTPException(status_code=404, detail="Bank account not found")
    return _to_response(detail)


# ── Update ───────────────────────────────────────────────────────────────────


@router.put("/{bank_id}", response_model=BankDetailOut)
async def update_bank_detail(
    bank_id: uuid.UUID,
    body: BankDetailUpdate,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BankDetailOut:
    """Update bank account details."""
    result = await db.execute(
        select(BankDetail).where(
            BankDetail.id == bank_id,
            BankDetail.user_id == user.id,
        )
    )
    detail = result.scalar_one_or_none()
    if not detail:
        raise HTTPException(status_code=404, detail="Bank account not found")

    old_value: dict = {}
    new_value: dict = {}
    updates = body.model_dump(exclude_unset=True)

    field_map = {
        "account_holder_name": "account_holder_name_enc",
        "account_number": "account_number_enc",
        "ifsc_code": "ifsc_code_enc",
        "bank_name": "bank_name_enc",
        "branch_name": "branch_name_enc",
    }

    for field, val in updates.items():
        if field in field_map:
            enc_field = field_map[field]
            old_enc = getattr(detail, enc_field)
            old_plain = decrypt(old_enc) if old_enc else None
            # Mask account numbers in audit log
            if field == "account_number":
                old_value[field] = mask_account_number(old_plain) if old_plain else None
                new_value[field] = mask_account_number(val)
            else:
                old_value[field] = old_plain
                new_value[field] = val
            setattr(detail, enc_field, encrypt(val) if val else None)
        elif field == "account_type":
            old_value[field] = detail.account_type
            new_value[field] = val
            detail.account_type = val

    await _audit(
        db,
        actor_id=user.id,
        action="bank.update",
        resource_type="bank_detail",
        resource_id=str(detail.id),
        old_value=old_value,
        new_value=new_value,
        request=request,
    )

    await db.flush()
    return _to_response(detail)


# ── Delete ───────────────────────────────────────────────────────────────────


@router.delete("/{bank_id}")
async def delete_bank_detail(
    bank_id: uuid.UUID,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Delete a bank account."""
    result = await db.execute(
        select(BankDetail).where(
            BankDetail.id == bank_id,
            BankDetail.user_id == user.id,
        )
    )
    detail = result.scalar_one_or_none()
    if not detail:
        raise HTTPException(status_code=404, detail="Bank account not found")

    await _audit(
        db,
        actor_id=user.id,
        action="bank.delete",
        resource_type="bank_detail",
        resource_id=str(detail.id),
        old_value={
            "bank_name": decrypt(detail.bank_name_enc),
            "account_number_masked": mask_account_number(decrypt(detail.account_number_enc)),
            "ifsc_code": decrypt(detail.ifsc_code_enc),
        },
        request=request,
    )

    await db.delete(detail)
    await db.flush()
    return {"message": "Bank account deleted"}
