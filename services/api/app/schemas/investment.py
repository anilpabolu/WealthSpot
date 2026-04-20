"""
Investment & Transaction schemas.
"""

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.investment import InvestmentStatus, TransactionType


class InvestmentCreate(BaseModel):
    property_id: uuid.UUID
    units: int = Field(gt=0)
    amount: Decimal = Field(gt=0)


class InvestmentRead(BaseModel):
    id: uuid.UUID
    property_id: uuid.UUID
    property_name: str | None = None
    units: int
    amount: Decimal
    unit_price: Decimal
    status: InvestmentStatus
    razorpay_order_id: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class InvestmentSummary(BaseModel):
    total_invested: Decimal
    current_value: Decimal
    total_returns: Decimal
    xirr: float
    properties_count: int
    monthly_income: Decimal


class ConfirmPayment(BaseModel):
    investment_id: uuid.UUID
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str


class TransactionRead(BaseModel):
    id: uuid.UUID
    investment_id: uuid.UUID
    type: TransactionType
    amount: Decimal
    description: str | None = None
    reference_id: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginatedInvestments(BaseModel):
    investments: list[InvestmentRead]
    total: int
    page: int
    page_size: int


# ── Portfolio ────────────────────────────────────────────────────────────────


class AssetAllocation(BaseModel):
    asset_type: str
    percentage: float
    amount: Decimal


class CityDistribution(BaseModel):
    city: str
    count: int
    amount: Decimal


class MonthlyReturn(BaseModel):
    month: str
    returns: float
    invested: float


class PortfolioSummary(BaseModel):
    total_invested: Decimal
    current_value: Decimal
    total_returns: Decimal = Decimal("0")
    unrealized_gains: Decimal = Decimal("0")
    avg_irr: float = 0.0
    xirr: float
    properties_count: int = 0
    cities_count: int = 0
    monthly_income: Decimal
    asset_allocation: list[AssetAllocation]
    city_distribution: list[CityDistribution]
    monthly_returns: list[MonthlyReturn] = []


class PortfolioProperty(BaseModel):
    property_id: uuid.UUID
    property_name: str
    city: str
    asset_type: str
    invested: Decimal
    current_value: Decimal
    irr: float
    units: int
    investment_count: int = 1
    original_unit_price: Decimal = Decimal("0")
    current_unit_price: Decimal = Decimal("0")
    appreciation_amount: Decimal = Decimal("0")
    appreciation_pct: float = 0.0
    status: str

    model_config = {"from_attributes": True}
