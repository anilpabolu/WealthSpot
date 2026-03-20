"""
Import all models so SQLAlchemy relationship() string references resolve correctly.
This module must be imported before any model-related queries run.
"""
from app.models.user import User, KycDocument, UserRole, KycStatus  # noqa: F401
from app.models.property import Property, Builder, AssetType, PropertyStatus  # noqa: F401
from app.models.investment import Investment, Transaction, InvestmentStatus, TransactionType  # noqa: F401
from app.models.community import (  # noqa: F401
    CommunityPost, CommunityReply, CommunityPostLike, CommunityReplyLike,
    Referral, AuditLog, Loan, PostType, LoanStatus,
)
from app.models.approval import (  # noqa: F401
    ApprovalRequest, ApprovalCategory, ApprovalStatus, ApprovalPriority,
)
from app.models.opportunity import Opportunity, VaultType, OpportunityStatus  # noqa: F401
from app.models.opportunity_media import OpportunityMedia  # noqa: F401
from app.models.company import Company, EntityType, VerificationStatus  # noqa: F401
from app.models.pincode import IndianPincode  # noqa: F401
from app.models.platform_config import PlatformConfig  # noqa: F401
from app.models.user_point import UserPoint  # noqa: F401
from app.models.role_group import RoleGroup, GroupMessage  # noqa: F401
