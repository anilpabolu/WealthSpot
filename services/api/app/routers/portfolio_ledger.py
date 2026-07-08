"""
Investment Ledger router – an editable, detailed per-investment ledger shown
under the Portfolio → Holdings section.

`GET /portfolio/ledger` returns a non-destructive merge of:
  - derived rows (one per the user's confirmed OpportunityInvestment / legacy
    Investment), pre-filled with defaults and overlaid with any saved edits, and
  - manual back-entries the user added (each referencing a listed asset).

Editing a derived row materializes an overlay entry (POST /ledger/overlay).
Manual rows are fully CRUD-able; derived rows cannot be deleted.

Document attachments reuse the S3 helpers and conventions from
`portfolio_transactions.py` (private object, presigned URL on view).
"""

import io
import logging
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.investment import Investment
from app.models.investment_ledger import (
    InvestmentLedgerCollateral,
    InvestmentLedgerDocument,
    InvestmentLedgerEntry,
)
from app.models.opportunity import Opportunity
from app.models.opportunity_investment import OpportunityInvestment
from app.models.property import Property
from app.models.user import User
from app.routers.portfolio import _extract_specs
from app.services.portfolio_ledger_service import (
    _coalesce,
    _derive_opp_code,
    _derive_prop_code,
    _f,
    apply_ledger_fields,
    get_asset_options,
    get_merged_ledger_rows,
    get_owned_ledger_entry,
    rebuild_ledger_collateral,
)
from app.services.s3 import delete_file, generate_presigned_url, upload_file

router = APIRouter(prefix="/portfolio", tags=["portfolio-ledger"])

_ALLOWED_MIME = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}
_MAX_BYTES = 25 * 1024 * 1024  # 25 MB


# ── Schemas ──────────────────────────────────────────────────────────────────


class CollateralIn(BaseModel):
    project: str | None = None
    unit_no: str | None = None
    configuration: str | None = None
    sbua: float | None = None
    unit_cost: float | None = None


class CollateralOut(CollateralIn):
    id: uuid.UUID


class DocumentOut(BaseModel):
    id: uuid.UUID
    filename: str | None
    content_type: str | None
    size_bytes: int | None
    created_at: str


class LedgerEntryFields(BaseModel):
    registered_name: str | None = None
    opportunity_code: str | None = None
    status: str | None = None
    configuration: str | None = None
    base_value: float | None = None
    gst: float | None = None
    gst_paid: bool = False
    total_value: float | None = None
    referred_by: str | None = None
    type_of_investment: str | None = None
    extra_sqft: float | None = None
    sweep_on_oc_loan: float | None = None
    latest_updates: str | None = None
    collateral: list[CollateralIn] = []


class CreateLedgerEntryBody(LedgerEntryFields):
    opportunity_id: uuid.UUID | None = None
    property_id: uuid.UUID | None = None


class OverlayLedgerBody(LedgerEntryFields):
    source_type: str  # 'opportunity' | 'property'
    source_id: uuid.UUID  # the OpportunityInvestment.id or Investment.id


class LedgerEntryOut(BaseModel):
    row_key: str
    kind: str  # 'derived' | 'manual'
    entry_id: uuid.UUID | None
    source_type: str | None  # 'opportunity' | 'property' | None
    source_id: uuid.UUID | None
    opportunity_id: uuid.UUID | None
    property_id: uuid.UUID | None
    project_name: str | None
    registered_name: str | None
    opportunity_code: str | None
    status: str | None
    configuration: str | None
    base_value: float | None
    gst: float | None
    gst_paid: bool
    total_value: float | None
    referred_by: str | None
    type_of_investment: str | None
    extra_sqft: float | None
    sweep_on_oc_loan: float | None
    latest_updates: str | None
    can_delete: bool
    invested_at: str | None
    documents: list[DocumentOut] = []
    collateral: list[CollateralOut] = []


class AssetOption(BaseModel):
    id: uuid.UUID
    title: str
    code: str


class AssetOptionsOut(BaseModel):
    opportunities: list[AssetOption]
    properties: list[AssetOption]


# ── Helpers ────────────────────────────────────────────────────────────────


def _collateral_out(c: InvestmentLedgerCollateral) -> CollateralOut:
    return CollateralOut(
        id=c.id,
        project=c.project,
        unit_no=c.unit_no,
        configuration=c.configuration,
        sbua=_f(c.sbua),
        unit_cost=_f(c.unit_cost),
    )


def _document_out(d: InvestmentLedgerDocument) -> DocumentOut:
    return DocumentOut(
        id=d.id,
        filename=d.filename,
        content_type=d.content_type,
        size_bytes=d.size_bytes,
        created_at=d.created_at.isoformat(),
    )


def _entry_out_manual(entry: InvestmentLedgerEntry) -> LedgerEntryOut:
    return LedgerEntryOut(
        row_key=f"manual-{entry.id}",
        kind="manual",
        entry_id=entry.id,
        source_type=None,
        source_id=None,
        opportunity_id=entry.opportunity_id,
        property_id=entry.property_id,
        project_name=None,  # resolved by the caller from the linked asset
        registered_name=entry.registered_name,
        opportunity_code=entry.opportunity_code,
        status=entry.status,
        configuration=entry.configuration,
        base_value=_f(entry.base_value),
        gst=_f(entry.gst),
        gst_paid=entry.gst_paid,
        total_value=_f(entry.total_value),
        referred_by=entry.referred_by,
        type_of_investment=entry.type_of_investment,
        extra_sqft=_f(entry.extra_sqft),
        sweep_on_oc_loan=_f(entry.sweep_on_oc_loan),
        latest_updates=entry.latest_updates,
        can_delete=True,
        invested_at=entry.created_at.isoformat(),
        documents=[_document_out(d) for d in entry.documents],
        collateral=[_collateral_out(c) for c in entry.collateral],
    )


# ── GET ledger ───────────────────────────────────────────────────────────────


@router.get("/ledger", response_model=list[LedgerEntryOut])
async def list_ledger(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[LedgerEntryOut]:
    """Merged ledger: derived rows (overlaid with saved edits) + manual back-entries."""
    data = await get_merged_ledger_rows(user.id, db)
    overlay_by_opp = data["overlay_by_opp"]
    overlay_by_leg = data["overlay_by_leg"]
    manual_entries = data["manual_entries"]
    opp_rows = data["opp_rows"]
    leg_rows = data["leg_rows"]
    opp_titles = data["opp_titles"]
    prop_titles = data["prop_titles"]

    rows: list[LedgerEntryOut] = []

    # ── Derived: opportunity investments ────────────────────────────────────
    for inv, opp in opp_rows:
        overlay = overlay_by_opp.get(inv.id)
        _, flat_cfgs = _extract_specs(opp.property_specs)
        base_default = float(inv.amount)
        gst_pct = float(opp.gst_percentage) if opp.gst_percentage else 0.0
        gst_default = round(base_default * gst_pct / 100, 2) if gst_pct else None
        total_default = base_default + (gst_default or 0.0)
        vault = opp.vault_type.value if hasattr(opp.vault_type, "value") else str(opp.vault_type)
        rows.append(
            LedgerEntryOut(
                row_key=f"opp-{inv.id}",
                kind="derived",
                entry_id=overlay.id if overlay else None,
                source_type="opportunity",
                source_id=inv.id,
                opportunity_id=opp.id,
                property_id=None,
                project_name=opp.title,
                registered_name=_coalesce(
                    overlay.registered_name if overlay else None, user.full_name
                ),
                opportunity_code=_coalesce(
                    overlay.opportunity_code if overlay else None, _derive_opp_code(opp)
                ),
                status=_coalesce(overlay.status if overlay else None, opp.status.value),
                configuration=_coalesce(
                    overlay.configuration if overlay else None, ", ".join(flat_cfgs) or None
                ),
                base_value=_f(overlay.base_value)
                if overlay and overlay.base_value is not None
                else base_default,
                gst=_f(overlay.gst) if overlay and overlay.gst is not None else gst_default,
                gst_paid=overlay.gst_paid if overlay else False,
                total_value=_f(overlay.total_value)
                if overlay and overlay.total_value is not None
                else total_default,
                referred_by=overlay.referred_by if overlay else None,
                type_of_investment=_coalesce(
                    overlay.type_of_investment if overlay else None, vault
                ),
                extra_sqft=_f(overlay.extra_sqft) if overlay else None,
                sweep_on_oc_loan=_f(overlay.sweep_on_oc_loan) if overlay else None,
                latest_updates=overlay.latest_updates if overlay else None,
                can_delete=False,
                invested_at=inv.invested_at.isoformat() if inv.invested_at else None,
                documents=[_document_out(d) for d in overlay.documents] if overlay else [],
                collateral=[_collateral_out(c) for c in overlay.collateral] if overlay else [],
            )
        )

    # ── Derived: legacy property investments ─────────────────────────────────
    for inv, prop in leg_rows:
        overlay = overlay_by_leg.get(inv.id)
        _, flat_cfgs = _extract_specs(prop.property_specs)
        base_default = float(inv.amount)
        asset = prop.asset_type.value if hasattr(prop.asset_type, "value") else str(prop.asset_type)
        rows.append(
            LedgerEntryOut(
                row_key=f"prop-{inv.id}",
                kind="derived",
                entry_id=overlay.id if overlay else None,
                source_type="property",
                source_id=inv.id,
                opportunity_id=None,
                property_id=prop.id,
                project_name=prop.title,
                registered_name=_coalesce(
                    overlay.registered_name if overlay else None, user.full_name
                ),
                opportunity_code=_coalesce(
                    overlay.opportunity_code if overlay else None, _derive_prop_code(prop)
                ),
                status=_coalesce(overlay.status if overlay else None, prop.status.value),
                configuration=_coalesce(
                    overlay.configuration if overlay else None, ", ".join(flat_cfgs) or None
                ),
                base_value=_f(overlay.base_value)
                if overlay and overlay.base_value is not None
                else base_default,
                gst=_f(overlay.gst) if overlay else None,
                gst_paid=overlay.gst_paid if overlay else False,
                total_value=_f(overlay.total_value)
                if overlay and overlay.total_value is not None
                else base_default,
                referred_by=_coalesce(overlay.referred_by if overlay else None, prop.referrer_name),
                type_of_investment=_coalesce(
                    overlay.type_of_investment if overlay else None, asset
                ),
                extra_sqft=_f(overlay.extra_sqft) if overlay else None,
                sweep_on_oc_loan=_f(overlay.sweep_on_oc_loan) if overlay else None,
                latest_updates=overlay.latest_updates if overlay else None,
                can_delete=False,
                invested_at=inv.created_at.isoformat() if inv.created_at else None,
                documents=[_document_out(d) for d in overlay.documents] if overlay else [],
                collateral=[_collateral_out(c) for c in overlay.collateral] if overlay else [],
            )
        )

    # ── Manual back-entries ──────────────────────────────────────────────────
    for e in manual_entries:
        out = _entry_out_manual(e)
        if e.opportunity_id:
            out.project_name = opp_titles.get(e.opportunity_id)
        elif e.property_id:
            out.project_name = prop_titles.get(e.property_id)
        rows.append(out)

    return rows


# ── Create manual back-entry ───────────────────────────────────────────────


@router.post("/ledger", response_model=LedgerEntryOut, status_code=status.HTTP_201_CREATED)
async def create_ledger_entry(
    body: CreateLedgerEntryBody,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> LedgerEntryOut:
    """Add a manual back-entry. Must reference a listed opportunity or property."""

    if body.opportunity_id is None and body.property_id is None:
        raise HTTPException(status_code=422, detail="An opportunity or property must be selected")
    project_name: str | None = None
    if body.opportunity_id is not None:
        opp = await db.get(Opportunity, body.opportunity_id)
        if not opp:
            raise HTTPException(status_code=404, detail="Opportunity not found")
        project_name = opp.title
    if body.property_id is not None:
        prop = await db.get(Property, body.property_id)
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")
        project_name = prop.title

    entry = InvestmentLedgerEntry(
        user_id=user.id,
        opportunity_id=body.opportunity_id,
        property_id=body.property_id,
    )
    apply_ledger_fields(entry, body)
    rebuild_ledger_collateral(entry, body.collateral)
    db.add(entry)
    await db.commit()
    await db.refresh(entry, attribute_names=["collateral", "documents"])
    out = _entry_out_manual(entry)
    out.project_name = project_name
    return out


# ── Update entry (manual or materialized overlay) ────────────────────────────


@router.put("/ledger/{entry_id}", response_model=LedgerEntryOut)
async def update_ledger_entry(
    entry_id: uuid.UUID,
    body: LedgerEntryFields,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> LedgerEntryOut:
    """Update an existing ledger entry (manual or overlay)."""
    entry = await get_owned_ledger_entry(entry_id, user.id, db)
    if not entry:
        raise HTTPException(status_code=404, detail="Ledger entry not found")
    apply_ledger_fields(entry, body)
    rebuild_ledger_collateral(entry, body.collateral)
    await db.commit()
    await db.refresh(entry, attribute_names=["collateral", "documents"])
    return _entry_out_manual(entry)


# ── Materialize / upsert overlay for a derived row ───────────────────────────


@router.post("/ledger/overlay", response_model=LedgerEntryOut)
async def save_ledger_overlay(
    body: OverlayLedgerBody,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> LedgerEntryOut:
    """Create or update the overlay entry that stores edits for a derived holding."""
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload

    if body.source_type == "opportunity":
        inv = await db.get(OpportunityInvestment, body.source_id)
        if not inv or inv.user_id != user.id:
            raise HTTPException(status_code=404, detail="Investment not found")
        existing_r = await db.execute(
            select(InvestmentLedgerEntry)
            .where(
                InvestmentLedgerEntry.user_id == user.id,
                InvestmentLedgerEntry.opportunity_investment_id == inv.id,
            )
            .options(
                selectinload(InvestmentLedgerEntry.collateral),
                selectinload(InvestmentLedgerEntry.documents),
            )
        )
        entry = existing_r.scalars().first()
        is_new = entry is None
        if entry is None:
            entry = InvestmentLedgerEntry(
                user_id=user.id,
                opportunity_investment_id=inv.id,
                opportunity_id=inv.opportunity_id,
            )
    elif body.source_type == "property":
        leg_inv = await db.get(Investment, body.source_id)
        if not leg_inv or leg_inv.user_id != user.id:
            raise HTTPException(status_code=404, detail="Investment not found")
        existing_r = await db.execute(
            select(InvestmentLedgerEntry)
            .where(
                InvestmentLedgerEntry.user_id == user.id,
                InvestmentLedgerEntry.legacy_investment_id == leg_inv.id,
            )
            .options(
                selectinload(InvestmentLedgerEntry.collateral),
                selectinload(InvestmentLedgerEntry.documents),
            )
        )
        entry = existing_r.scalars().first()
        is_new = entry is None
        if entry is None:
            entry = InvestmentLedgerEntry(
                user_id=user.id,
                legacy_investment_id=leg_inv.id,
                property_id=leg_inv.property_id,
            )
    else:
        raise HTTPException(status_code=422, detail="Invalid source_type")

    apply_ledger_fields(entry, body)
    rebuild_ledger_collateral(entry, body.collateral)
    if is_new:
        db.add(entry)
    await db.commit()
    await db.refresh(entry, attribute_names=["collateral", "documents"])
    out = _entry_out_manual(entry)
    out.kind = "derived"
    out.source_type = body.source_type
    out.source_id = body.source_id
    out.can_delete = False
    out.row_key = f"{'opp' if body.source_type == 'opportunity' else 'prop'}-{body.source_id}"
    return out


# ── Delete (manual only) ─────────────────────────────────────────────────────


@router.delete("/ledger/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ledger_entry(
    entry_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    """Delete a manual back-entry. Derived rows cannot be deleted."""
    entry = await get_owned_ledger_entry(entry_id, user.id, db)
    if not entry:
        raise HTTPException(status_code=404, detail="Ledger entry not found")
    if entry.opportunity_investment_id is not None or entry.legacy_investment_id is not None:
        raise HTTPException(status_code=400, detail="Derived rows cannot be deleted")
    await db.delete(entry)
    await db.commit()


# ── Documents ────────────────────────────────────────────────────────────────


@router.post(
    "/ledger/{entry_id}/documents",
    response_model=DocumentOut,
    status_code=status.HTTP_201_CREATED,
)
async def upload_ledger_document(
    entry_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DocumentOut:
    """Attach a document to a ledger entry."""
    entry = await get_owned_ledger_entry(entry_id, user.id, db)
    if not entry:
        raise HTTPException(status_code=404, detail="Ledger entry not found")
    content_type = file.content_type or "application/octet-stream"
    if content_type not in _ALLOWED_MIME:
        raise HTTPException(status_code=415, detail="Unsupported file type")
    file_bytes = await file.read()
    if len(file_bytes) > _MAX_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 25 MB)")

    ext = (
        (file.filename or "doc").rsplit(".", 1)[-1].lower()
        if file.filename and "." in file.filename
        else "bin"
    )
    s3_key = f"ledger-docs/{user.id}/{entry.id}/{uuid.uuid4().hex}.{ext}"
    await upload_file(io.BytesIO(file_bytes), s3_key, content_type)

    doc = InvestmentLedgerDocument(
        entry_id=entry.id,
        s3_key=s3_key,
        filename=file.filename,
        content_type=content_type,
        size_bytes=len(file_bytes),
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return _document_out(doc)


@router.get("/ledger/{entry_id}/documents/{doc_id}")
async def get_ledger_document_url(
    entry_id: uuid.UUID,
    doc_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Get a 5-minute presigned URL to view a ledger document."""
    entry = await get_owned_ledger_entry(entry_id, user.id, db)
    if not entry:
        raise HTTPException(status_code=404, detail="Ledger entry not found")
    doc = await db.get(InvestmentLedgerDocument, doc_id)
    if not doc or doc.entry_id != entry_id:
        raise HTTPException(status_code=404, detail="Document not found")
    url = generate_presigned_url(doc.s3_key, expires_in=300)
    return {"url": url, "expires_in": 300}


@router.delete("/ledger/{entry_id}/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ledger_document(
    entry_id: uuid.UUID,
    doc_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    """Delete a ledger document (and best-effort remove the S3 object)."""
    entry = await get_owned_ledger_entry(entry_id, user.id, db)
    if not entry:
        raise HTTPException(status_code=404, detail="Ledger entry not found")
    doc = await db.get(InvestmentLedgerDocument, doc_id)
    if not doc or doc.entry_id != entry_id:
        raise HTTPException(status_code=404, detail="Document not found")
    s3_key = doc.s3_key
    await db.delete(doc)
    await db.commit()
    try:
        await delete_file(s3_key)
    except Exception:
        logging.getLogger(__name__).warning(
            "Failed to delete S3 object %s for ledger doc %s", s3_key, doc_id, exc_info=True
        )


# ── Asset options for the back-entry picker ──────────────────────────────────


@router.get("/ledger/asset-options", response_model=AssetOptionsOut)
async def ledger_asset_options(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> AssetOptionsOut:
    """List opportunities and properties the user can back-enter against."""
    opportunities, properties = await get_asset_options(db)
    return AssetOptionsOut(
        opportunities=[
            AssetOption(id=o.id, title=o.title, code=_derive_opp_code(o)) for o in opportunities
        ],
        properties=[
            AssetOption(id=p.id, title=p.title, code=_derive_prop_code(p)) for p in properties
        ],
    )


async def _get_owned_entry(
    entry_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession
) -> InvestmentLedgerEntry:
    entry_r = await db.execute(
        select(InvestmentLedgerEntry)
        .where(
            InvestmentLedgerEntry.id == entry_id,
            InvestmentLedgerEntry.user_id == user_id,
        )
        .options(
            selectinload(InvestmentLedgerEntry.collateral),
            selectinload(InvestmentLedgerEntry.documents),
        )
    )
    entry = entry_r.scalars().first()
    if not entry:
        raise HTTPException(status_code=404, detail="Ledger entry not found")
    return entry
