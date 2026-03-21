// ─── API Configuration ────────────────────────────────────
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'

// ─── Platform Constants ──────────────────────────────
export const PLATFORM_FEE_RATE = 0.015 // 1.5%
export const MIN_INVESTMENT = 10_000 // ₹10,000
export const MAX_CREDIT_RATIO = 0.50 // 50% of platform fee
export const TDS_RESIDENT = 0.10 // 10%
export const TDS_NRI = 0.20 // 20%
export const WEALTHPASS_PRICE = 499 // ₹499/year

// ─── KYC Statuses ─────────────────────────────────────
export const KYC_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
} as const

export type KycStatus = (typeof KYC_STATUS)[keyof typeof KYC_STATUS]

// ─── Property Statuses ────────────────────────────────
export const PROPERTY_STATUS = {
  DRAFT: 'draft',
  UNDER_REVIEW: 'under_review',
  ACTIVE: 'active',
  FUNDING: 'funding',
  FUNDED: 'funded',
  EXITED: 'exited',
  REJECTED: 'rejected',
} as const

export type PropertyStatus = (typeof PROPERTY_STATUS)[keyof typeof PROPERTY_STATUS]

// ─── Investment Statuses ──────────────────────────────
export const INVESTMENT_STATUS = {
  INITIATED: 'initiated',
  PAYMENT_PENDING: 'payment_pending',
  PAYMENT_RECEIVED: 'payment_received',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const

export type InvestmentStatus = (typeof INVESTMENT_STATUS)[keyof typeof INVESTMENT_STATUS]

// ─── Asset Types ──────────────────────────────────────
export const ASSET_TYPES = {
  RESIDENTIAL: 'Residential',
  COMMERCIAL: 'Commercial',
  WAREHOUSING: 'Warehousing',
  PLOTTED: 'Plotted Development',
  MIXED_USE: 'Mixed Use',
} as const

export type AssetType = (typeof ASSET_TYPES)[keyof typeof ASSET_TYPES]

// ─── User Roles ───────────────────────────────────────
export const USER_ROLES = {
  INVESTOR: 'investor',
  BUILDER: 'builder',
  LENDER: 'lender',
  ADMIN: 'admin',
  FOUNDER: 'founder',
  COMMUNITY_LEAD: 'community_lead',
  APPROVER: 'approver',
  SUPER_ADMIN: 'super_admin',
} as const

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]

/** Roles that can access the Approvals page */
export const APPROVAL_ROLES: UserRole[] = ['admin', 'approver', 'super_admin']

/** Pretty labels for user roles */
export const ROLE_LABELS: Record<UserRole, string> = {
  investor: 'Investor',
  builder: 'Builder (Real Estate)',
  lender: 'Lender',
  admin: 'Admin',
  founder: 'Founder (Startup)',
  community_lead: 'Community Lead',
  approver: 'Approver',
  super_admin: 'Super Admin',
}

// ─── Indian Cities ────────────────────────────────────
export const INDIAN_CITIES = [
  'Mumbai',
  'Bengaluru',
  'Delhi NCR',
  'Hyderabad',
  'Pune',
  'Chennai',
  'Ahmedabad',
  'Kolkata',
  'Jaipur',
  'Lucknow',
  'Goa',
] as const
