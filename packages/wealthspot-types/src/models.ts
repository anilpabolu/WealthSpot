// ============================================================================
// WealthSpot Entity Models
// TypeScript interfaces matching backend SQLAlchemy models
// ============================================================================

import type {
  UserRole,
  KycStatus,
  AssetType,
  PropertyStatus,
  InvestmentStatus,
  TransactionType,
  PostType,
  LoanStatus,
  DocumentVerificationStatus,
} from "./enums";

// ── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  clerk_id: string | null;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  kyc_status: KycStatus;
  pan_number: string | null;
  aadhaar_hash: string | null;
  referral_code: string | null;
  referred_by: string | null;
  wealth_pass_active: boolean;
  is_active: boolean;
  created_at: string; // ISO-8601
  updated_at: string;
}

export interface UserCreate {
  email: string;
  full_name: string;
  phone?: string;
  role?: UserRole;
  clerk_id?: string;
  referral_code?: string;
}

export interface UserUpdate {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

export interface UserProfile extends User {
  investment_count?: number;
  total_invested?: number;
  kyc_documents?: KycDocument[];
}

// ── KYC Document ────────────────────────────────────────────────────────────

export interface KycDocument {
  id: string;
  user_id: string;
  document_type: string;
  s3_key: string;
  verification_status: DocumentVerificationStatus;
  rejection_reason?: string | null;
  created_at: string;
}

export interface KycSubmission {
  document_type: string;
  file_key: string;
}

// ── Builder ─────────────────────────────────────────────────────────────────

export interface Builder {
  id: string;
  user_id: string;
  company_name: string;
  rera_number: string | null;
  cin: string | null;
  gstin: string | null;
  website: string | null;
  logo_url: string | null;
  description: string | null;
  verified: boolean;
  created_at: string;
}

export interface BuilderCreate {
  company_name: string;
  rera_number?: string;
  cin?: string;
  gstin?: string;
  website?: string;
  description?: string;
}

// ── Property ────────────────────────────────────────────────────────────────

export interface Property {
  id: string;
  builder_id: string;
  slug: string;
  title: string;
  tagline: string | null;
  description: string | null;
  asset_type: AssetType;
  status: PropertyStatus;
  city: string;
  state: string;
  locality: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  target_amount: number;
  raised_amount: number;
  min_investment: number;
  unit_price: number;
  total_units: number;
  sold_units: number;
  target_irr: number;
  rental_yield: number | null;
  area_sqft: number | null;
  bedrooms: number | null;
  possession_date: string | null;
  rera_id: string | null;
  cover_image: string | null;
  gallery: string[] | null;
  documents: Record<string, unknown> | null;
  amenities: string[] | null;
  investor_count: number;
  launch_date: string | null;
  created_at: string;
  updated_at: string;
}

/** Compact representation for marketplace cards */
export interface PropertyListItem {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  asset_type: AssetType;
  status: PropertyStatus;
  city: string;
  cover_image: string | null;
  target_amount: number;
  raised_amount: number;
  min_investment: number;
  target_irr: number;
  rental_yield: number | null;
  investor_count: number;
  funding_percentage: number;
}

export interface PropertyDetail extends Property {
  builder: Builder;
  funding_percentage: number;
}

export interface PropertyCreate {
  title: string;
  tagline?: string;
  description?: string;
  asset_type: AssetType;
  city: string;
  state: string;
  locality?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  target_amount: number;
  min_investment: number;
  unit_price: number;
  total_units: number;
  target_irr: number;
  rental_yield?: number;
  area_sqft?: number;
  bedrooms?: number;
  possession_date?: string;
  rera_id?: string;
  cover_image?: string;
  amenities?: string[];
}

export interface PropertyUpdate extends Partial<PropertyCreate> {
  status?: PropertyStatus;
}

export interface PropertyFilters {
  city?: string;
  asset_type?: AssetType;
  status?: PropertyStatus;
  min_amount?: number;
  max_amount?: number;
  min_irr?: number;
  search?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// ── Investment ──────────────────────────────────────────────────────────────

export interface Investment {
  id: string;
  user_id: string;
  property_id: string;
  units: number;
  amount: number;
  unit_price: number;
  status: InvestmentStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  payment_metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface InvestmentCreate {
  property_id: string;
  units: number;
}

export interface InvestmentRead extends Investment {
  property?: PropertyListItem;
}

export interface ConfirmPayment {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface InvestmentSummary {
  total_invested: number;
  active_investments: number;
  total_returns: number;
  monthly_income: number;
}

// ── Transaction ─────────────────────────────────────────────────────────────

export interface Transaction {
  id: string;
  investment_id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  reference_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ── Portfolio ───────────────────────────────────────────────────────────────

export interface PortfolioSummary {
  total_invested: number;
  current_value: number;
  total_returns: number;
  monthly_rental_income: number;
  properties_count: number;
  investments: InvestmentRead[];
}

// ── Community ───────────────────────────────────────────────────────────────

export interface CommunityPost {
  id: string;
  user_id: string;
  post_type: PostType;
  title: string;
  body: string;
  category: string | null;
  tags: string[] | null;
  upvotes: number;
  reply_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  author?: Pick<User, "id" | "full_name" | "avatar_url">;
}

export interface CommunityPostCreate {
  title: string;
  body: string;
  post_type?: PostType;
  category?: string;
  tags?: string[];
}

export interface CommunityReply {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  upvotes: number;
  created_at: string;
  author?: Pick<User, "id" | "full_name" | "avatar_url">;
}

export interface CommunityReplyCreate {
  body: string;
}

// ── Referral ────────────────────────────────────────────────────────────────

export interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string;
  code_used: string;
  reward_amount: number;
  reward_claimed: boolean;
  created_at: string;
  referrer?: Pick<User, "id" | "full_name">;
  referee?: Pick<User, "id" | "full_name">;
}

// ── Audit Log ───────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ── Loan ────────────────────────────────────────────────────────────────────

export interface Loan {
  id: string;
  lender_id: string;
  property_id: string;
  principal: number;
  interest_rate: number;
  tenure_months: number;
  amount_repaid: number;
  status: LoanStatus;
  next_payment_date: string | null;
  created_at: string;
  lender?: Pick<User, "id" | "full_name">;
  property?: Pick<Property, "id" | "title" | "slug">;
}

export interface LoanCreate {
  property_id: string;
  principal: number;
  interest_rate: number;
  tenure_months: number;
}
