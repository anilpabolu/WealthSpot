"""
IndianPincode model – reference table for pincode lookup.
"""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class IndianPincode(Base):
    __tablename__ = "indian_pincodes"

    pincode: Mapped[str] = mapped_column(String(10), primary_key=True)
    office_name: Mapped[str | None] = mapped_column(String(255))
    locality: Mapped[str | None] = mapped_column(String(255))
    district: Mapped[str | None] = mapped_column(String(100))
    state: Mapped[str | None] = mapped_column(String(100))
    region: Mapped[str | None] = mapped_column(String(100))
    division: Mapped[str | None] = mapped_column(String(100))
    circle: Mapped[str | None] = mapped_column(String(100))
    delivery: Mapped[str] = mapped_column(String(10), default="Delivery")
