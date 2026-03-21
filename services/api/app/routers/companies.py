"""
Companies router – CRUD for builder/developer company onboarding.
"""

import math
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_current_user, get_optional_user
from app.models.approval import ApprovalCategory, ApprovalRequest
from app.models.company import Company, VerificationStatus
from app.models.user import User, UserRole
from app.schemas.company import (
    CompanyCreateRequest,
    CompanyListItem,
    CompanyRead,
    PaginatedCompanies,
)
from app.services.points import award_points

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("", response_model=PaginatedCompanies)
async def list_companies(
    search: str | None = Query(None),
    verified_only: bool = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> PaginatedCompanies:
    """List companies for dropdown / search."""
    query = select(Company)
    count_q = select(func.count(Company.id))

    if verified_only:
        query = query.where(Company.verified == True)  # noqa: E712
        count_q = count_q.where(Company.verified == True)  # noqa: E712
    if search:
        like = f"%{search}%"
        query = query.where(
            Company.company_name.ilike(like) | Company.brand_name.ilike(like)
        )
        count_q = count_q.where(
            Company.company_name.ilike(like) | Company.brand_name.ilike(like)
        )

    total = (await db.execute(count_q)).scalar() or 0
    total_pages = max(1, math.ceil(total / page_size))

    query = query.order_by(Company.company_name).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = [CompanyListItem.model_validate(r) for r in result.scalars().all()]

    return PaginatedCompanies(items=items, total=total, page=page, total_pages=total_pages)


@router.get("/{company_id}", response_model=CompanyRead)
async def get_company(
    company_id: str,
    db: AsyncSession = Depends(get_db),
) -> CompanyRead:
    company = await db.get(Company, uuid.UUID(company_id))
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return CompanyRead.model_validate(company)


@router.post("", response_model=CompanyRead)
async def create_company(
    body: CompanyCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CompanyRead:
    """Onboard a new company — creates an approval request for verification."""
    company = Company(
        user_id=user.id,
        company_name=body.company_name,
        brand_name=body.brand_name,
        entity_type=body.entity_type,
        cin=body.cin,
        gstin=body.gstin,
        pan=body.pan,
        rera_number=body.rera_number,
        website=body.website,
        description=body.description,
        contact_name=body.contact_name,
        contact_email=body.contact_email,
        contact_phone=body.contact_phone,
        address_line1=body.address_line1,
        address_line2=body.address_line2,
        city=body.city,
        state=body.state,
        pincode=body.pincode,
        country=body.country,
        years_in_business=body.years_in_business,
        projects_completed=body.projects_completed or 0,
        total_area_developed=body.total_area_developed,
    )
    db.add(company)
    await db.flush()

    # Auto-create approval
    approval = ApprovalRequest(
        requester_id=user.id,
        category=ApprovalCategory.PROPERTY_LISTING,
        title=f"Company Onboarding: {body.company_name}",
        description=f"New company registration by {user.email}",
        resource_type="company",
        resource_id=str(company.id),
        payload={
            "company_name": body.company_name,
            "entity_type": body.entity_type.value,
            "city": body.city,
        },
    )
    db.add(approval)
    await db.flush()

    company.approval_id = approval.id

    # Auto-assign builder role if user is still a basic investor
    if user.role == UserRole.INVESTOR:
        user.role = UserRole.BUILDER
        await db.flush()

    # Award company onboarding points
    await award_points(
        db, user_id=str(user.id), action="company_onboarded",
        reference_type="company", reference_id=str(company.id),
        description=f"Onboarded {body.company_name}",
    )

    await db.flush()
    await db.refresh(company)

    return CompanyRead.model_validate(company)
