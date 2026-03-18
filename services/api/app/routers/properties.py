"""
Properties router – CRUD, marketplace listing, filtering & search.
"""

import uuid
from decimal import Decimal
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.database import get_db
from app.middleware.auth import require_role
from app.models.property import AssetType, Builder, Property, PropertyStatus
from app.models.user import User, UserRole
from app.schemas.property import (
    PaginatedProperties,
    PropertyCreate,
    PropertyDetail,
    PropertyListItem,
    PropertyUpdate,
)

router = APIRouter(prefix="/properties", tags=["properties"])


# ── Public endpoints ─────────────────────────────────────────────────────────


@router.get("", response_model=PaginatedProperties)
async def list_properties(
    db: AsyncSession = Depends(get_db),
    city: str | None = Query(None),
    asset_type: AssetType | None = Query(None),
    property_status: PropertyStatus | None = Query(None, alias="status"),
    min_investment_min: Decimal | None = Query(None),
    min_investment_max: Decimal | None = Query(None),
    irr_min: Decimal | None = Query(None),
    irr_max: Decimal | None = Query(None),
    sort_by: str = Query("newest"),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
) -> PaginatedProperties:
    """Public marketplace listing with filtering & pagination."""
    query = select(Property).where(
        Property.status.in_([PropertyStatus.ACTIVE, PropertyStatus.FUNDING, PropertyStatus.FUNDED])
    )

    if city:
        query = query.where(Property.city.ilike(f"%{city}%"))
    if asset_type:
        query = query.where(Property.asset_type == asset_type)
    if property_status:
        query = query.where(Property.status == property_status)
    if min_investment_min is not None:
        query = query.where(Property.min_investment >= min_investment_min)
    if min_investment_max is not None:
        query = query.where(Property.min_investment <= min_investment_max)
    if irr_min is not None:
        query = query.where(Property.target_irr >= irr_min)
    if irr_max is not None:
        query = query.where(Property.target_irr <= irr_max)
    if search:
        query = query.where(
            Property.title.ilike(f"%{search}%")
            | Property.city.ilike(f"%{search}%")
            | Property.locality.ilike(f"%{search}%")
        )

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # Sort
    if sort_by == "irr_high":
        query = query.order_by(Property.target_irr.desc())
    elif sort_by == "irr_low":
        query = query.order_by(Property.target_irr.asc())
    elif sort_by == "price_low":
        query = query.order_by(Property.min_investment.asc())
    elif sort_by == "price_high":
        query = query.order_by(Property.min_investment.desc())
    elif sort_by == "funding":
        query = query.order_by(Property.raised_amount.desc())
    else:
        query = query.order_by(Property.created_at.desc())

    # Paginate
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    result = await db.execute(query)
    properties = result.scalars().all()

    return PaginatedProperties(
        properties=[PropertyListItem.model_validate(p) for p in properties],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if page_size else 1,
    )


@router.get("/featured", response_model=list[PropertyListItem])
async def featured_properties(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(6, ge=1, le=20),
) -> list[PropertyListItem]:
    """Top properties by funding percentage for homepage."""
    query = (
        select(Property)
        .where(Property.status.in_([PropertyStatus.ACTIVE, PropertyStatus.FUNDING]))
        .order_by(Property.raised_amount.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    return [PropertyListItem.model_validate(p) for p in result.scalars().all()]


@router.get("/cities", response_model=list[str])
async def property_cities(db: AsyncSession = Depends(get_db)) -> list[str]:
    """Distinct cities with active properties."""
    query = (
        select(Property.city)
        .where(Property.status.in_([PropertyStatus.ACTIVE, PropertyStatus.FUNDING]))
        .distinct()
        .order_by(Property.city)
    )
    result = await db.execute(query)
    return [row[0] for row in result.all()]


@router.get("/{slug}", response_model=PropertyDetail)
async def get_property(
    slug: str,
    db: AsyncSession = Depends(get_db),
) -> PropertyDetail:
    """Property detail by slug."""
    query = (
        select(Property)
        .options(joinedload(Property.builder))
        .where(Property.slug == slug)
    )
    result = await db.execute(query)
    prop = result.scalar_one_or_none()

    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    return PropertyDetail.model_validate(prop)


# ── Builder endpoints ────────────────────────────────────────────────────────


@router.post("", response_model=PropertyDetail, status_code=status.HTTP_201_CREATED)
async def create_property(
    body: PropertyCreate,
    user: User = Depends(require_role(UserRole.BUILDER, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> PropertyDetail:
    """Builder creates a new property listing."""
    # Find builder profile
    builder_result = await db.execute(
        select(Builder).where(Builder.user_id == user.id)
    )
    builder = builder_result.scalar_one_or_none()
    if not builder:
        raise HTTPException(status_code=400, detail="Builder profile not found")

    # Generate slug
    slug = body.title.lower().replace(" ", "-")
    slug = f"{slug}-{uuid.uuid4().hex[:6]}"

    prop = Property(
        builder_id=builder.id,
        slug=slug,
        title=body.title,
        tagline=body.tagline,
        description=body.description,
        asset_type=body.asset_type,
        city=body.city,
        state=body.state,
        locality=body.locality,
        target_amount=body.target_amount,
        min_investment=body.min_investment,
        unit_price=body.unit_price,
        total_units=body.total_units,
        target_irr=body.target_irr,
        rental_yield=body.rental_yield,
        area_sqft=body.area_sqft,
        possession_date=body.possession_date,
        rera_id=body.rera_id,
        amenities=body.amenities,
    )
    db.add(prop)
    await db.flush()

    return PropertyDetail.model_validate(prop)


@router.patch("/{slug}", response_model=PropertyDetail)
async def update_property(
    slug: str,
    body: PropertyUpdate,
    user: User = Depends(require_role(UserRole.BUILDER, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> PropertyDetail:
    """Update property details (builder or admin)."""
    query = select(Property).where(Property.slug == slug)
    result = await db.execute(query)
    prop = result.scalar_one_or_none()

    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(prop, field, value)

    await db.flush()
    return PropertyDetail.model_validate(prop)
