"""
Lender & Loan schemas.
"""

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.community import LoanStatus


class LoanCreate(BaseModel):
    property_id: uuid.UUID
    principal: int = Field(gt=0, description="Loan amount in paise")
    interest_rate: float = Field(gt=0, le=100)
    tenure_months: int = Field(gt=0, le=360)


class LoanRead(BaseModel):
    id: uuid.UUID
    lender_id: uuid.UUID
    property_id: uuid.UUID
    principal: int
    interest_rate: float
    tenure_months: int
    amount_repaid: int
    status: LoanStatus
    next_payment_date: datetime | None = None
    created_at: datetime

    # Populated via join
    property_title: str | None = None
    property_city: str | None = None

    model_config = {"from_attributes": True}


class LoanSummary(BaseModel):
    active_loans: int
    total_lent: Decimal
    total_interest_earned: Decimal
    upcoming_payments: int


class PaginatedLoans(BaseModel):
    items: list[LoanRead]
    total: int
    page: int
    total_pages: int


class LoanRepayment(BaseModel):
    """Record a repayment against a loan."""
    amount: int = Field(gt=0, description="Repayment amount in paise")
    reference_id: str | None = None
