// ============================================================================
// WealthSpot Shared Types – Barrel Export
// ============================================================================

// Enums
export {
  UserRole,
  KycStatus,
  AssetType,
  PropertyStatus,
  InvestmentStatus,
  TransactionType,
  PostType,
  LoanStatus,
  KycDocumentType,
  DocumentVerificationStatus,
} from "./enums";

// Entity models
export type {
  User,
  UserCreate,
  UserUpdate,
  UserProfile,
  KycDocument,
  KycSubmission,
  Builder,
  BuilderCreate,
  Property,
  PropertyListItem,
  PropertyDetail,
  PropertyCreate,
  PropertyUpdate,
  PropertyFilters,
  Investment,
  InvestmentCreate,
  InvestmentRead,
  ConfirmPayment,
  InvestmentSummary,
  Transaction,
  PortfolioSummary,
  CommunityPost,
  CommunityPostCreate,
  CommunityReply,
  CommunityReplyCreate,
  Referral,
  AuditLog,
  Loan,
  LoanCreate,
} from "./models";

// API response types
export type {
  ApiResponse,
  ApiError,
  PaginatedResponse,
  TokenPair,
  RazorpayWebhookEvent,
  PresignedUploadUrl,
  AdminDashboardStats,
  LenderDashboardStats,
} from "./api";
