"""
Pincode lookup router – returns location details for an Indian pincode.
Checks the local DB first, then falls back to the India Post API.
"""

import logging
import re

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.pincode import IndianPincode
from app.schemas.company import PincodeInfo

router = APIRouter(prefix="/pincodes", tags=["pincodes"])
logger = logging.getLogger(__name__)

_PINCODE_PATTERN = re.compile(r"^\d{6}$")


@router.get("/{pincode}", response_model=list[PincodeInfo])
async def lookup_pincode(
    pincode: str,
    db: AsyncSession = Depends(get_db),
) -> list[PincodeInfo]:
    """Lookup location details for an Indian pincode.
    Tries DB first, falls back to India Post public API.
    """
    if not _PINCODE_PATTERN.match(pincode):
        raise HTTPException(status_code=400, detail="Invalid pincode format — must be exactly 6 digits")
    # 1 – Local DB
    result = await db.execute(
        select(IndianPincode).where(IndianPincode.pincode == pincode)
    )
    rows = result.scalars().all()
    if rows:
        return [
            PincodeInfo(
                pincode=r.pincode,
                office_name=r.office_name,
                locality=r.locality,
                district=r.district,
                state=r.state,
                region=r.region,
            )
            for r in rows
        ]

    # 2 – India Post API fallback
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"https://api.postalpincode.in/pincode/{pincode}")
            data = resp.json()
            if data and data[0].get("Status") == "Success":
                post_offices = data[0].get("PostOffice", [])
                return [
                    PincodeInfo(
                        pincode=pincode,
                        office_name=po.get("Name"),
                        locality=po.get("Block"),
                        district=po.get("District"),
                        state=po.get("State"),
                        region=po.get("Region"),
                    )
                    for po in post_offices[:5]
                ]
    except httpx.TimeoutException:
        logger.warning("India Post API timeout for pincode %s", pincode)
    except httpx.HTTPError as e:
        logger.warning("India Post API error for pincode %s: %s", pincode, e)

    return []
