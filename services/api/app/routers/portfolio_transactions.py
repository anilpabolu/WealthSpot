"""
Portfolio transaction records router.
Allows investors to upload/manage acknowledgement documents for their holdings,
with GPT-4 Vision OCR for auto-extracting transaction metadata.
Builders can view transaction records for their opportunity's investors.
"""

import base64
import json
import uuid
from datetime import UTC, datetime
from decimal import Decimal

import httpx
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.middleware.auth import get_current_user, require_role
from app.models.investment import Investment, InvestmentStatus
from app.models.investment_transaction_record import InvestmentTransactionRecord
from app.models.opportunity import Opportunity
from app.models.opportunity_investment import OppInvestmentStatus, OpportunityInvestment
from app.models.user import User, UserRole
from app.services.s3 import generate_presigned_url, upload_file

router = APIRouter(prefix="/portfolio", tags=["portfolio-transactions"])
builder_router = APIRouter(prefix="/opportunities", tags=["portfolio-transactions"])

settings = get_settings()

_ALLOWED_MIME = {"application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"}
_MAX_BYTES = 10 * 1024 * 1024  # 10 MB


# ── Schemas ──────────────────────────────────────────────────────────────────


class TransactionRecordOut(BaseModel):
    id: uuid.UUID
    amount: float
    transaction_date: str
    reference_number: str | None
    description: str | None
    has_acknowledgement: bool
    ocr_raw_text: str | None
    created_at: str


class CreateTransactionRecordBody(BaseModel):
    amount: float
    transaction_date: str  # ISO date string
    reference_number: str | None = None
    description: str | None = None


# ── Helpers ───────────────────────────────────────────────────────────────────


def _record_to_out(rec: InvestmentTransactionRecord) -> TransactionRecordOut:
    return TransactionRecordOut(
        id=rec.id,
        amount=float(rec.amount),
        transaction_date=rec.transaction_date.isoformat(),
        reference_number=rec.reference_number,
        description=rec.description,
        has_acknowledgement=bool(rec.acknowledgement_s3_key),
        ocr_raw_text=rec.ocr_raw_text,
        created_at=rec.created_at.isoformat(),
    )


async def _resolve_holding(
    holding_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> tuple[uuid.UUID | None, uuid.UUID | None]:
    """
    Resolve holding_id to (opportunity_investment_id, legacy_investment_id).
    Returns (None, None) if not found or not owned by user.
    """
    # Try opportunity investment first
    opp_inv = await db.get(OpportunityInvestment, holding_id)
    if opp_inv and opp_inv.user_id == user_id and opp_inv.status == OppInvestmentStatus.CONFIRMED:
        return opp_inv.id, None

    # Try legacy property investment
    leg_inv = await db.get(Investment, holding_id)
    if leg_inv and leg_inv.user_id == user_id and leg_inv.status == InvestmentStatus.CONFIRMED:
        return None, leg_inv.id

    return None, None


async def _ocr_acknowledgement(file_bytes: bytes, content_type: str) -> str | None:
    """Call GPT-4 Vision to extract transaction metadata from an uploaded document."""
    if not settings.openai_api_key:
        return None

    is_image = content_type.startswith("image/")
    if not is_image:
        # For PDF, we skip OCR (would need pdf2image conversion)
        return None

    b64 = base64.b64encode(file_bytes).decode("utf-8")
    payload = {
        "model": "gpt-4o",
        "max_tokens": 300,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "You are an OCR assistant. Extract key transaction details from this "
                            "payment acknowledgement/receipt image. Return a JSON object with keys: "
                            "amount, date, reference_number, payer_name, payee_name, bank_name, "
                            "description. Use null for fields not found. Return ONLY valid JSON."
                        ),
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{content_type};base64,{b64}", "detail": "low"},
                    },
                ],
            }
        ],
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            # Validate it's parseable JSON
            json.loads(content)
            return content
    except Exception:
        return None


# ── Endpoints: Investor view ──────────────────────────────────────────────────


@router.get("/holdings/{holding_id}/transactions", response_model=list[TransactionRecordOut])
async def list_holding_transactions(
    holding_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[TransactionRecordOut]:
    """List all transaction records for a holding."""
    opp_inv_id, leg_inv_id = await _resolve_holding(holding_id, user.id, db)
    if opp_inv_id is None and leg_inv_id is None:
        raise HTTPException(status_code=404, detail="Holding not found")

    if opp_inv_id:
        result = await db.execute(
            select(InvestmentTransactionRecord)
            .where(
                InvestmentTransactionRecord.user_id == user.id,
                InvestmentTransactionRecord.opportunity_investment_id == opp_inv_id,
            )
            .order_by(InvestmentTransactionRecord.transaction_date.desc())
        )
    else:
        result = await db.execute(
            select(InvestmentTransactionRecord)
            .where(
                InvestmentTransactionRecord.user_id == user.id,
                InvestmentTransactionRecord.legacy_investment_id == leg_inv_id,
            )
            .order_by(InvestmentTransactionRecord.transaction_date.desc())
        )
    return [_record_to_out(r) for r in result.scalars().all()]


@router.post(
    "/holdings/{holding_id}/transactions",
    response_model=TransactionRecordOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_holding_transaction(
    holding_id: uuid.UUID,
    body: CreateTransactionRecordBody,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> TransactionRecordOut:
    """Manually add a transaction record for a holding."""
    opp_inv_id, leg_inv_id = await _resolve_holding(holding_id, user.id, db)
    if opp_inv_id is None and leg_inv_id is None:
        raise HTTPException(status_code=404, detail="Holding not found")

    try:
        txn_date = datetime.fromisoformat(body.transaction_date).replace(tzinfo=UTC)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="Invalid transaction_date format") from exc

    rec = InvestmentTransactionRecord(
        user_id=user.id,
        opportunity_investment_id=opp_inv_id,
        legacy_investment_id=leg_inv_id,
        amount=Decimal(str(body.amount)),
        transaction_date=txn_date,
        reference_number=body.reference_number,
        description=body.description,
    )
    db.add(rec)
    await db.commit()
    await db.refresh(rec)
    return _record_to_out(rec)


@router.post(
    "/holdings/{holding_id}/transactions/upload-ack",
    response_model=TransactionRecordOut,
    status_code=status.HTTP_201_CREATED,
)
async def upload_acknowledgement(
    holding_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> TransactionRecordOut:
    """
    Upload an acknowledgement document, run GPT-4 Vision OCR, and create
    a transaction record with auto-extracted metadata.
    """
    opp_inv_id, leg_inv_id = await _resolve_holding(holding_id, user.id, db)
    if opp_inv_id is None and leg_inv_id is None:
        raise HTTPException(status_code=404, detail="Holding not found")

    content_type = file.content_type or "application/octet-stream"
    if content_type not in _ALLOWED_MIME:
        raise HTTPException(
            status_code=415, detail="Unsupported file type. Allowed: PDF, JPEG, PNG, WEBP, GIF"
        )

    file_bytes = await file.read()
    if len(file_bytes) > _MAX_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 10 MB)")

    # Upload to S3
    import io

    ext = (
        (file.filename or "ack").rsplit(".", 1)[-1].lower()
        if file.filename and "." in file.filename
        else "bin"
    )
    s3_key = f"transaction-acks/{user.id}/{holding_id}/{uuid.uuid4().hex}.{ext}"
    await upload_file(io.BytesIO(file_bytes), s3_key, content_type)

    # OCR via GPT-4 Vision
    ocr_text = await _ocr_acknowledgement(file_bytes, content_type)

    # Extract amount and date from OCR if available
    amount = Decimal("0")
    txn_date = datetime.now(UTC)
    reference_number: str | None = None
    if ocr_text:
        try:
            ocr_data = json.loads(ocr_text)
            if ocr_data.get("amount"):
                try:
                    amount = Decimal(
                        str(ocr_data["amount"]).replace(",", "").replace("₹", "").strip()
                    )
                except Exception:
                    pass
            if ocr_data.get("date"):
                try:
                    # Try ISO format first, then common Indian formats
                    raw_date = str(ocr_data["date"]).strip()
                    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d %b %Y", "%d %B %Y"):
                        try:
                            txn_date = datetime.strptime(raw_date, fmt).replace(tzinfo=UTC)
                            break
                        except ValueError:
                            continue
                except Exception:
                    pass
            reference_number = ocr_data.get("reference_number")
        except Exception:
            pass

    rec = InvestmentTransactionRecord(
        user_id=user.id,
        opportunity_investment_id=opp_inv_id,
        legacy_investment_id=leg_inv_id,
        amount=amount,
        transaction_date=txn_date,
        reference_number=reference_number,
        acknowledgement_s3_key=s3_key,
        ocr_raw_text=ocr_text,
    )
    db.add(rec)
    await db.commit()
    await db.refresh(rec)
    return _record_to_out(rec)


@router.get("/holdings/{holding_id}/transactions/{record_id}/acknowledgement")
async def get_acknowledgement_url(
    holding_id: uuid.UUID,
    record_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Get a 5-minute presigned URL to view the acknowledgement document."""
    rec = await db.get(InvestmentTransactionRecord, record_id)
    if not rec or rec.user_id != user.id:
        raise HTTPException(status_code=404, detail="Record not found")
    if not rec.acknowledgement_s3_key:
        raise HTTPException(status_code=404, detail="No acknowledgement uploaded")

    url = generate_presigned_url(rec.acknowledgement_s3_key, expires_in=300)
    return {"url": url, "expires_in": 300}


# ── Endpoint: Builder view ────────────────────────────────────────────────────


@builder_router.get(
    "/{opportunity_id}/investors/{investor_user_id}/transactions",
    response_model=list[TransactionRecordOut],
)
async def builder_view_investor_transactions(
    opportunity_id: uuid.UUID,
    investor_user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.BUILDER, UserRole.ADMIN, UserRole.SUPER_ADMIN)),
) -> list[TransactionRecordOut]:
    """
    Builder: view all transaction records an investor has uploaded for a specific opportunity.
    Only accessible by the opportunity creator (builder) or admins.
    """
    # Verify the opportunity belongs to this builder (unless admin/super_admin)
    if user.role == UserRole.BUILDER:
        opp = await db.get(Opportunity, opportunity_id)
        if not opp or opp.creator_id != user.id:
            raise HTTPException(status_code=403, detail="Not your opportunity")

    # Find the OpportunityInvestment for this investor
    opp_inv_result = await db.execute(
        select(OpportunityInvestment).where(
            OpportunityInvestment.opportunity_id == opportunity_id,
            OpportunityInvestment.user_id == investor_user_id,
            OpportunityInvestment.status == OppInvestmentStatus.CONFIRMED,
        )
    )
    opp_inv = opp_inv_result.scalars().first()
    if not opp_inv:
        raise HTTPException(status_code=404, detail="Investment not found")

    result = await db.execute(
        select(InvestmentTransactionRecord)
        .where(
            InvestmentTransactionRecord.opportunity_investment_id == opp_inv.id,
        )
        .order_by(InvestmentTransactionRecord.transaction_date.desc())
    )
    return [_record_to_out(r) for r in result.scalars().all()]


@builder_router.get(
    "/{opportunity_id}/investors/{investor_user_id}/transactions/{record_id}/acknowledgement"
)
async def builder_get_acknowledgement_url(
    opportunity_id: uuid.UUID,
    investor_user_id: uuid.UUID,
    record_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.BUILDER, UserRole.ADMIN, UserRole.SUPER_ADMIN)),
) -> dict:
    """Builder: get a 5-minute presigned URL to view an investor's acknowledgement document."""
    if user.role == UserRole.BUILDER:
        opp = await db.get(Opportunity, opportunity_id)
        if not opp or opp.creator_id != user.id:
            raise HTTPException(status_code=403, detail="Not your opportunity")

    rec = await db.get(InvestmentTransactionRecord, record_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Record not found")
    if not rec.acknowledgement_s3_key:
        raise HTTPException(status_code=404, detail="No acknowledgement uploaded")

    url = generate_presigned_url(rec.acknowledgement_s3_key, expires_in=300)
    return {"url": url, "expires_in": 300}
