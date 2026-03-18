"""
Import all models so SQLAlchemy relationship() string references resolve correctly.
This module must be imported before any model-related queries run.
"""
from app.models.user import User, KycDocument, UserRole, KycStatus  # noqa: F401
from app.models.property import Property, Builder, AssetType, PropertyStatus  # noqa: F401
from app.models.investment import Investment, Transaction, InvestmentStatus, TransactionType  # noqa: F401
from app.models.community import (  # noqa: F401
    CommunityPost, CommunityReply, Referral, AuditLog, Loan, PostType, LoanStatus,
)
