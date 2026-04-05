// ============================================================================
// WealthSpot Shared Enums
// Mirror of backend Python enums – keep in sync with services/api/app/models/
// ============================================================================

/** User roles on the platform */
export enum UserRole {
  INVESTOR = "investor",
  BUILDER = "builder",
  LENDER = "lender",
  FOUNDER = "founder",
  COMMUNITY_LEAD = "community_lead",
  KNOWLEDGE_CONTRIBUTOR = "knowledge_contributor",
  APPROVER = "approver",
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
}

/** KYC verification statuses */
export enum KycStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  UNDER_REVIEW = "UNDER_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

/** Real-estate asset types */
export enum AssetType {
  RESIDENTIAL = "Residential",
  COMMERCIAL = "Commercial",
  WAREHOUSING = "Warehousing",
  PLOTTED = "Plotted Development",
  MIXED_USE = "Mixed Use",
}

/** Property listing lifecycle */
export enum PropertyStatus {
  DRAFT = "draft",
  UNDER_REVIEW = "under_review",
  ACTIVE = "active",
  FUNDING = "funding",
  FUNDED = "funded",
  EXITED = "exited",
  REJECTED = "rejected",
}

/** Investment payment lifecycle */
export enum InvestmentStatus {
  INITIATED = "initiated",
  PAYMENT_PENDING = "payment_pending",
  PAYMENT_RECEIVED = "payment_received",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
}

/** Financial transaction types */
export enum TransactionType {
  INVESTMENT = "investment",
  RENTAL_PAYOUT = "rental_payout",
  EXIT_PAYOUT = "exit_payout",
  REFUND = "refund",
  FEE = "fee",
}

/** Community post categories */
export enum PostType {
  DISCUSSION = "discussion",
  QUESTION = "question",
  POLL = "poll",
  ANNOUNCEMENT = "announcement",
  INSIGHT = "insight",
}

/** Lender loan statuses */
export enum LoanStatus {
  ACTIVE = "active",
  REPAID = "repaid",
  DEFAULTED = "defaulted",
  PENDING = "pending",
}

/** KYC document types accepted */
export enum KycDocumentType {
  PAN = "PAN",
  AADHAAR = "AADHAAR",
  SELFIE = "SELFIE",
  ADDRESS_PROOF = "ADDRESS_PROOF",
}

/** KYC document verification status */
export enum DocumentVerificationStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

/** Approval request categories */
export enum ApprovalCategory {
  ROLE_ASSIGNMENT = "role_assignment",
  PILLAR_ACCESS = "pillar_access",
  OPPORTUNITY_LISTING = "opportunity_listing",
  PROPERTY_LISTING = "property_listing",
  KYC_VERIFICATION = "kyc_verification",
  COMMUNITY_PROJECT = "community_project",
  COMMUNITY_ANSWER = "community_answer",
  BUILDER_VERIFICATION = "builder_verification",
  TEMPLATE_UPLOAD = "template_upload",
}

/** Approval request lifecycle */
export enum ApprovalStatus {
  PENDING = "pending",
  IN_REVIEW = "in_review",
  APPROVED = "approved",
  REJECTED = "rejected",
  AUTO_APPROVED = "auto_approved",
  CANCELLED = "cancelled",
}

/** Approval priority */
export enum ApprovalPriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  URGENT = "urgent",
}

/** Vault types for opportunities */
export enum VaultType {
  WEALTH = "wealth",
  OPPORTUNITY = "opportunity",
  COMMUNITY = "community",
}

/** Opportunity lifecycle */
export enum OpportunityStatus {
  DRAFT = "draft",
  PENDING_APPROVAL = "pending_approval",
  APPROVED = "approved",
  ACTIVE = "active",
  FUNDING = "funding",
  FUNDED = "funded",
  REJECTED = "rejected",
  CLOSED = "closed",
}

/** Community vault sub-types */
export enum CommunitySubtype {
  CO_INVESTOR = "co_investor",
  CO_PARTNER = "co_partner",
}
