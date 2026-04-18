"""
Import all models so SQLAlchemy relationship() string references resolve correctly.
This module must be imported before any model-related queries run.
"""
from app.models.user import User, KycDocument, BankDetail, UserRole, KycStatus  # noqa: F401
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
from app.models.opportunity_investment import OpportunityInvestment, OppInvestmentStatus  # noqa: F401
from app.models.company import Company, EntityType, VerificationStatus  # noqa: F401
from app.models.pincode import IndianPincode  # noqa: F401
from app.models.platform_config import PlatformConfig  # noqa: F401
from app.models.user_point import UserPoint  # noqa: F401
from app.models.role_group import RoleGroup, GroupMessage  # noqa: F401
from app.models.notification import (  # noqa: F401
    Notification, NotificationChannel, NotificationType,
)
from app.models.expression_of_interest import (  # noqa: F401
    ExpressionOfInterest, EOIStatus,
)
from app.models.builder_question import (  # noqa: F401
    BuilderQuestion, EOIQuestionAnswer, QuestionType,
)
from app.models.comm_mapping import OpportunityCommMapping  # noqa: F401
from app.models.opportunity_like import OpportunityLike, UserActivity  # noqa: F401
from app.models.property_referral import PropertyReferralCode  # noqa: F401
from app.models.app_video import AppVideo  # noqa: F401
from app.models.eoi_stage_history import EoiStageHistory  # noqa: F401
from app.models.vault_feature_flag import VaultFeatureFlag  # noqa: F401
from app.models.admin_invite import AdminInvite  # noqa: F401
from app.models.profiling import (  # noqa: F401
    VaultProfileQuestion, UserProfileAnswer,
    OpportunityCustomQuestion, OpportunityApplicationAnswer,
    ProfileMatchScore, PersonalityDimension,
)
from app.models.builder_update import BuilderUpdate, BuilderUpdateAttachment  # noqa: F401
from app.models.appreciation_event import AppreciationEvent  # noqa: F401
from app.models.vault_explorer import VaultExplorer  # noqa: F401
