"""
Import all models so SQLAlchemy relationship() string references resolve correctly.
This module must be imported before any model-related queries run.
"""

from app.models.admin_invite import AdminInvite  # noqa: F401
from app.models.app_video import AppVideo  # noqa: F401
from app.models.appreciation_event import AppreciationEvent  # noqa: F401
from app.models.approval import (  # noqa: F401
    ApprovalCategory,
    ApprovalPriority,
    ApprovalRequest,
    ApprovalStatus,
)
from app.models.builder_question import (  # noqa: F401
    BuilderQuestion,
    EOIQuestionAnswer,
    QuestionType,
)
from app.models.builder_update import BuilderUpdate, BuilderUpdateAttachment  # noqa: F401
from app.models.comm_mapping import OpportunityCommMapping  # noqa: F401
from app.models.community import (  # noqa: F401
    AuditLog,
    CommunityPost,
    CommunityPostLike,
    CommunityReply,
    CommunityReplyLike,
    Loan,
    LoanStatus,
    PostType,
    Referral,
)
from app.models.company import Company, EntityType, VerificationStatus  # noqa: F401
from app.models.eoi_stage_history import EoiStageHistory  # noqa: F401
from app.models.expression_of_interest import (  # noqa: F401
    EOIStatus,
    ExpressionOfInterest,
)
from app.models.investment import (  # noqa: F401
    Investment,
    InvestmentStatus,
    Transaction,
    TransactionType,
)
from app.models.notification import (  # noqa: F401
    Notification,
    NotificationChannel,
    NotificationType,
)
from app.models.opportunity import Opportunity, OpportunityStatus, VaultType  # noqa: F401
from app.models.opportunity_assessment import (  # noqa: F401
    OpportunityAssessment,
    OpportunityRiskFlag,
)
from app.models.opportunity_investment import (  # noqa: F401
    OppInvestmentStatus,
    OpportunityInvestment,
)
from app.models.opportunity_like import OpportunityLike, UserActivity  # noqa: F401
from app.models.opportunity_media import OpportunityMedia  # noqa: F401
from app.models.pincode import IndianPincode  # noqa: F401
from app.models.platform_config import PlatformConfig  # noqa: F401
from app.models.profiling import (  # noqa: F401
    OpportunityApplicationAnswer,
    OpportunityCustomQuestion,
    PersonalityDimension,
    ProfileMatchScore,
    UserProfileAnswer,
    VaultProfileQuestion,
)
from app.models.property import AssetType, Builder, Property, PropertyStatus  # noqa: F401
from app.models.property_referral import PropertyReferralCode  # noqa: F401
from app.models.role_group import GroupMessage, RoleGroup  # noqa: F401
from app.models.user import BankDetail, KycDocument, KycStatus, User, UserRole  # noqa: F401
from app.models.user_point import UserPoint  # noqa: F401
from app.models.vault_explorer import VaultExplorer  # noqa: F401
from app.models.vault_feature_flag import VaultFeatureFlag  # noqa: F401
