"""
Template router – download blank opportunity template, upload filled template
for bulk property ingestion.
"""

import io

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services.s3 import upload_template as s3_upload_template, get_public_url

router = APIRouter(prefix="/templates", tags=["templates"])
_settings = get_settings()

# ── Column definitions for the opportunity template ────────────────────────
TEMPLATE_COLUMNS = [
    "title", "tagline", "description", "vault_type",
    "city", "state", "address_line1", "address_line2",
    "landmark", "locality", "pincode", "district", "country",
    "target_amount", "min_investment", "target_irr",
    "industry", "stage", "founder_name", "pitch_deck_url",
    "community_type", "collaboration_type",
]

VAULT_TYPES = "wealth | opportunity | community"
SAMPLE_ROW = [
    "Green Horizon Residency", "Premium living in tech corridor", "Luxury 2/3 BHK ...",
    "wealth", "Bengaluru", "Karnataka", "Plot 12, Whitefield", "Near ITPL",
    "Opposite Nexus Mall", "Whitefield", "560066", "Bengaluru Urban", "India",
    "50000000", "500000", "14.5",
    "", "", "", "",
    "", "",
]


@router.get("/opportunity")
async def download_opportunity_template(
    _user: User = Depends(get_current_user),
) -> StreamingResponse:
    """Generate and return a CSV template for bulk opportunity creation."""
    buf = io.StringIO()
    # header
    buf.write(",".join(TEMPLATE_COLUMNS) + "\n")
    # instructions row
    instructions = [
        "Required", "Optional", "Optional", f"Required: {VAULT_TYPES}",
        "City name", "State name", "Street address", "Floor / Wing",
        "Nearby landmark", "Area / Locality", "6-digit pincode", "District", "India",
        "Total amount in INR", "Minimum per investor", "Expected IRR %",
        "For opportunity vault", "Idea/MVP/Seed/Growth", "Founder name", "URL",
        "For community vault", "Capital+Time / Capital Only / ...",
    ]
    buf.write(",".join(f'"{i}"' for i in instructions) + "\n")
    # sample row
    buf.write(",".join(f'"{v}"' for v in SAMPLE_ROW) + "\n")

    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=opportunity_template.csv"},
    )


@router.post("/opportunity/upload")
async def upload_opportunity_template(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Upload a filled CSV template. Parses rows and returns previewed opportunities."""
    if not file.filename or not file.filename.endswith((".csv", ".CSV")):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")

    content = await file.read()
    if len(content) > _settings.max_upload_size_bytes:
        raise HTTPException(status_code=400, detail="File too large (max 5 MB)")

    # Store in S3 for audit
    file_obj = io.BytesIO(content)
    s3_key = await s3_upload_template(
        file=file_obj,
        filename=file.filename,
        user_id=str(user.id),
        content_type="text/csv",
    )

    # Parse CSV
    import csv
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))

    def _sanitize_csv_value(val: str) -> str:
        """Prevent CSV formula injection by escaping leading trigger characters."""
        stripped = val.lstrip()
        if stripped and stripped[0] in ("=", "+", "-", "@", "\t", "\r"):
            return "'" + val
        return val

    rows: list[dict] = []
    errors: list[str] = []
    for idx, row in enumerate(reader, start=2):
        # Skip instruction row (detect by checking if title starts with "Required")
        # Sanitize all cell values against CSV formula injection
        row = {k: _sanitize_csv_value((v or "").strip()) for k, v in row.items()}
        title_val = (row.get("title") or "").strip()
        if title_val.lower().startswith("required") or not title_val:
            continue

        vault_type = (row.get("vault_type") or "wealth").strip().lower()
        if vault_type not in ("wealth", "opportunity", "community"):
            errors.append(f"Row {idx}: Invalid vault_type '{vault_type}'")
            continue

        rows.append({
            "title": title_val,
            "tagline": (row.get("tagline") or "").strip() or None,
            "description": (row.get("description") or "").strip() or None,
            "vault_type": vault_type,
            "city": (row.get("city") or "").strip() or None,
            "state": (row.get("state") or "").strip() or None,
            "address_line1": (row.get("address_line1") or "").strip() or None,
            "address_line2": (row.get("address_line2") or "").strip() or None,
            "landmark": (row.get("landmark") or "").strip() or None,
            "locality": (row.get("locality") or "").strip() or None,
            "pincode": (row.get("pincode") or "").strip() or None,
            "district": (row.get("district") or "").strip() or None,
            "country": (row.get("country") or "India").strip(),
            "target_amount": _safe_float(row.get("target_amount")),
            "min_investment": _safe_float(row.get("min_investment")),
            "target_irr": _safe_float(row.get("target_irr")),
            "industry": (row.get("industry") or "").strip() or None,
            "stage": (row.get("stage") or "").strip() or None,
            "founder_name": (row.get("founder_name") or "").strip() or None,
            "pitch_deck_url": (row.get("pitch_deck_url") or "").strip() or None,
            "community_type": (row.get("community_type") or "").strip() or None,
            "collaboration_type": (row.get("collaboration_type") or "").strip() or None,
        })

    return {
        "s3_key": s3_key,
        "s3_url": get_public_url(s3_key),
        "parsed_count": len(rows),
        "error_count": len(errors),
        "errors": errors[:20],
        "preview": rows[:10],
    }


def _safe_float(val: str | None) -> float | None:
    if not val or not val.strip():
        return None
    try:
        return float(val.strip())
    except ValueError:
        return None
