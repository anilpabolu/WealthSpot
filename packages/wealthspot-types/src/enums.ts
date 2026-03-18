// ============================================================================
// WealthSpot Shared Enums
// Mirror of backend Python enums – keep in sync with services/api/app/models/
// ============================================================================

/** User roles on the platform */
export enum UserRole {
  INVESTOR = "investor",
  BUILDER = "builder",
  LENDER = "lender",
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
