"""
KYC router – submit personal details, upload documents to S3, track verification status.
All actions are audited in the audit_logs table.
"""

import logging
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.community import AuditLog
from app.models.user import KycDocument, KycStatus, User
from app.schemas.user import KycDetailsResponse, KycDocumentOut, KycStatusResponse, KycSubmission
from app.services.s3 import generate_presigned_url, upload_document

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/kyc", tags=["kyc"])
_settings = get_settings()

ALLOWED_DOC_TYPES = {"PAN", "AADHAAR", "SELFIE"}
MAX_FILE_SIZE = _settings.max_upload_size_bytes
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}


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


# ── Submit KYC Personal Details ──────────────────────────────────────────────


@router.post("/submit", response_model=KycStatusResponse)
async def submit_kyc(
    body: KycSubmission,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> KycStatusResponse:
    """Submit personal details for KYC verification."""
    if user.kyc_status == KycStatus.APPROVED:
        raise HTTPException(status_code=400, detail="KYC already approved")

    old_values = {
        "full_name": user.full_name,
        "pan_number": user.pan_number,
        "kyc_status": user.kyc_status.value,
    }

    user.full_name = body.full_name
    user.pan_number = body.pan_number.upper()
    user.date_of_birth = datetime.strptime(body.date_of_birth, "%Y-%m-%d").date()
    user.address_line1 = body.address
    user.city = body.city
    user.pincode = body.pincode
    user.kyc_status = KycStatus.IN_PROGRESS

    await _audit(
        db,
        actor_id=user.id,
        action="kyc.submit_details",
        resource_type="user",
        resource_id=str(user.id),
        old_value=old_values,
        new_value={
            "full_name": body.full_name,
            "pan_number": body.pan_number.upper(),
            "kyc_status": KycStatus.IN_PROGRESS.value,
        },
        request=request,
    )
    await db.flush()

    return KycStatusResponse(
        kyc_status=KycStatus.IN_PROGRESS,
        message="Personal details saved. Please upload your documents.",
    )


# ── Upload Document ──────────────────────────────────────────────────────────


@router.post("/documents/upload", response_model=KycDocumentOut)
async def upload_kyc_document(
    document_type: str,
    request: Request,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> KycDocumentOut:
    """Upload a KYC document (PAN, AADHAAR, or SELFIE) to S3."""
    doc_type = document_type.upper()
    if doc_type not in ALLOWED_DOC_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid document type. Allowed: {', '.join(ALLOWED_DOC_TYPES)}",
        )

    if user.kyc_status == KycStatus.APPROVED:
        raise HTTPException(status_code=400, detail="KYC already approved")

    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400, detail="File type not allowed. Accepted: JPG, PNG, WebP, PDF"
        )

    # Read file and check size
    file_data = await file.read()
    file_size = len(file_data)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum 5 MB allowed.")
    await file.seek(0)

    # Delete existing document of same type (replace)
    result = await db.execute(
        select(KycDocument).where(
            KycDocument.user_id == user.id,
            KycDocument.document_type == doc_type,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        await _audit(
            db,
            actor_id=user.id,
            action="kyc.replace_document",
            resource_type="kyc_document",
            resource_id=str(existing.id),
            old_value={"document_type": doc_type, "s3_key": existing.s3_key},
            new_value={"document_type": doc_type, "filename": file.filename},
            request=request,
        )
        await db.delete(existing)
        await db.flush()

    # Upload to S3
    s3_key = await upload_document(
        file.file,
        file.filename or "document",
        str(user.id),
        doc_type,
        content_type,
    )

    doc = KycDocument(
        user_id=user.id,
        document_type=doc_type,
        s3_key=s3_key,
        original_filename=file.filename,
        file_size_bytes=file_size,
        mime_type=content_type,
        verification_status="PENDING",
    )
    db.add(doc)
    await db.flush()

    await _audit(
        db,
        actor_id=user.id,
        action="kyc.upload_document",
        resource_type="kyc_document",
        resource_id=str(doc.id),
        new_value={
            "document_type": doc_type,
            "filename": file.filename,
            "file_size": file_size,
        },
        request=request,
    )

    download_url = generate_presigned_url(s3_key)

    return KycDocumentOut(
        id=doc.id,
        document_type=doc.document_type,
        s3_key=doc.s3_key,
        original_filename=doc.original_filename,
        file_size_bytes=doc.file_size_bytes,
        mime_type=doc.mime_type,
        verification_status=doc.verification_status,
        rejection_reason=doc.rejection_reason,
        download_url=download_url,
        created_at=doc.created_at,
    )


# ── List Documents ───────────────────────────────────────────────────────────


@router.get("/documents", response_model=list[KycDocumentOut])
async def list_kyc_documents(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[KycDocumentOut]:
    """List all KYC documents for the current user with download URLs."""
    result = await db.execute(
        select(KycDocument)
        .where(KycDocument.user_id == user.id)
        .order_by(KycDocument.created_at.desc())
    )
    docs = result.scalars().all()

    return [
        KycDocumentOut(
            id=d.id,
            document_type=d.document_type,
            s3_key=d.s3_key,
            original_filename=d.original_filename,
            file_size_bytes=d.file_size_bytes,
            mime_type=d.mime_type,
            verification_status=d.verification_status,
            rejection_reason=d.rejection_reason,
            download_url=generate_presigned_url(d.s3_key),
            created_at=d.created_at,
        )
        for d in docs
    ]


# ── Delete Document ──────────────────────────────────────────────────────────


@router.delete("/documents/{document_id}")
async def delete_kyc_document(
    document_id: uuid.UUID,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Delete a KYC document (only if not yet verified)."""
    result = await db.execute(
        select(KycDocument).where(
            KycDocument.id == document_id,
            KycDocument.user_id == user.id,
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.verification_status == "VERIFIED":
        raise HTTPException(status_code=400, detail="Cannot delete a verified document")

    await _audit(
        db,
        actor_id=user.id,
        action="kyc.delete_document",
        resource_type="kyc_document",
        resource_id=str(doc.id),
        old_value={
            "document_type": doc.document_type,
            "s3_key": doc.s3_key,
            "verification_status": doc.verification_status,
        },
        request=request,
    )

    await db.delete(doc)
    await db.flush()
    return {"message": "Document deleted"}


# ── Get KYC Status ───────────────────────────────────────────────────────────


@router.get("/status", response_model=KycStatusResponse)
async def get_kyc_status(
    user: User = Depends(get_current_user),
) -> KycStatusResponse:
    """Get the current KYC verification status."""
    messages = {
        KycStatus.NOT_STARTED: "Please complete your KYC to start investing.",
        KycStatus.IN_PROGRESS: "Your KYC submission is in progress. Please upload all required documents.",
        KycStatus.UNDER_REVIEW: "Your documents are under review. This usually takes 24-48 hours.",
        KycStatus.APPROVED: "Your identity has been verified successfully!",
        KycStatus.REJECTED: "Your KYC was rejected. Please re-submit with correct documents.",
    }
    return KycStatusResponse(
        kyc_status=user.kyc_status,
        message=messages.get(user.kyc_status, ""),
    )


# ── Get KYC Submitted Details ────────────────────────────────────────────────


@router.get("/details", response_model=KycDetailsResponse)
async def get_kyc_details(
    user: User = Depends(get_current_user),
) -> KycDetailsResponse:
    """Return the submitted KYC personal details (PAN is masked)."""
    pan_masked = None
    if user.pan_number:
        pan_masked = user.pan_number[:2] + "****" + user.pan_number[-2:]
    return KycDetailsResponse(
        kyc_status=user.kyc_status,
        full_name=user.full_name,
        pan_number_masked=pan_masked,
        date_of_birth=user.date_of_birth,
        address=user.address_line1,
        city=user.city,
        pincode=user.pincode,
    )


# ── Submit for Review ────────────────────────────────────────────────────────


@router.post("/submit-for-review", response_model=KycStatusResponse)
async def submit_for_review(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> KycStatusResponse:
    """Mark KYC as submitted for review (requires PAN + AADHAAR + SELFIE)."""
    if user.kyc_status == KycStatus.APPROVED:
        raise HTTPException(status_code=400, detail="KYC already approved")

    result = await db.execute(select(KycDocument).where(KycDocument.user_id == user.id))
    docs = result.scalars().all()
    doc_types = {d.document_type for d in docs}

    missing = ALLOWED_DOC_TYPES - doc_types
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing documents: {', '.join(missing)}. Upload all required documents first.",
        )

    old_status = user.kyc_status.value
    user.kyc_status = KycStatus.UNDER_REVIEW

    await _audit(
        db,
        actor_id=user.id,
        action="kyc.submit_for_review",
        resource_type="user",
        resource_id=str(user.id),
        old_value={"kyc_status": old_status},
        new_value={"kyc_status": KycStatus.UNDER_REVIEW.value},
        request=request,
    )
    await db.flush()

    return KycStatusResponse(
        kyc_status=KycStatus.UNDER_REVIEW,
        message="Your documents have been submitted for review. This usually takes 24-48 hours.",
    )
