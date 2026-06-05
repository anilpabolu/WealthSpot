"""canonicalize_property_specs_keys

Migrate every opportunity's ``property_specs`` JSON from the legacy key set written
by the old builder forms to the canonical key set written by the create-opportunity
wizard (the single source of truth):

    unit_configurations  -> configurations  (fields: type, super_built_up_sqft, price_per_sqft)
    possession_date      -> possession_year (4-digit year parsed from the quarter string)
    land_parcel_sqft     -> land_parcel_area_sqft

The per-unit fields the wizard does not capture (carpet_area_sqft, bathrooms,
balconies, total_units) are intentionally dropped. ``plot_configurations`` is already
canonical and left untouched. Idempotent: rows already on the new keys are skipped.

Revision ID: 62db48849e24
Revises: 073_source_clicks
Create Date: 2026-06-05 08:20:45.448469

"""

import json
import re
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "62db48849e24"
down_revision: Union[str, None] = "073_source_clicks"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _canonicalize(specs: dict) -> dict | None:
    """Return a new specs dict if anything changed, else None."""
    changed = False
    out = dict(specs)

    # unit_configurations -> configurations
    if "unit_configurations" in out:
        if "configurations" not in out:
            new_cfgs = []
            for c in out.get("unit_configurations") or []:
                if not isinstance(c, dict):
                    continue
                item = {}
                t = c.get("type") or c.get("bhk_type")
                if t is not None:
                    item["type"] = t
                if c.get("super_built_up_sqft") is not None:
                    item["super_built_up_sqft"] = c["super_built_up_sqft"]
                if c.get("price_per_sqft") is not None:
                    item["price_per_sqft"] = c["price_per_sqft"]
                new_cfgs.append(item)
            out["configurations"] = new_cfgs
        del out["unit_configurations"]
        changed = True

    # land_parcel_sqft -> land_parcel_area_sqft
    if "land_parcel_sqft" in out:
        if "land_parcel_area_sqft" not in out:
            out["land_parcel_area_sqft"] = out["land_parcel_sqft"]
        del out["land_parcel_sqft"]
        changed = True

    # possession_date ("Q4 2026" / "Ready to Move") -> possession_year (int)
    if "possession_date" in out:
        if "possession_year" not in out:
            m = re.search(r"(\d{4})", str(out.get("possession_date") or ""))
            if m:
                out["possession_year"] = int(m.group(1))
        del out["possession_date"]
        changed = True

    return out if changed else None


def upgrade() -> None:
    bind = op.get_bind()
    rows = bind.execute(
        sa.text("SELECT id, property_specs FROM opportunities WHERE property_specs IS NOT NULL")
    ).fetchall()
    for opp_id, specs in rows:
        if not isinstance(specs, dict):
            continue
        new_specs = _canonicalize(specs)
        if new_specs is not None:
            bind.execute(
                sa.text(
                    "UPDATE opportunities SET property_specs = CAST(:specs AS jsonb) WHERE id = :id"
                ),
                {"specs": json.dumps(new_specs), "id": str(opp_id)},
            )


def downgrade() -> None:
    """Best-effort reverse rename. The dropped per-unit fields are unrecoverable."""
    bind = op.get_bind()
    rows = bind.execute(
        sa.text("SELECT id, property_specs FROM opportunities WHERE property_specs IS NOT NULL")
    ).fetchall()
    for opp_id, specs in rows:
        if not isinstance(specs, dict):
            continue
        changed = False
        out = dict(specs)
        if "configurations" in out:
            out["unit_configurations"] = out.pop("configurations")
            changed = True
        if "land_parcel_area_sqft" in out:
            out["land_parcel_sqft"] = out.pop("land_parcel_area_sqft")
            changed = True
        if "possession_year" in out:
            out["possession_date"] = f"Q4 {out.pop('possession_year')}"
            changed = True
        if changed:
            bind.execute(
                sa.text(
                    "UPDATE opportunities SET property_specs = CAST(:specs AS jsonb) WHERE id = :id"
                ),
                {"specs": json.dumps(out), "id": str(opp_id)},
            )
