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
  ApprovalCategory,
  ApprovalStatus,
  ApprovalPriority,
  VaultType,
  OpportunityStatus,
  FeatureKey,
  InviteStatus,
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
  roles: string[];
  primary_role: string;
  builder_approved: boolean;
  persona_selected_at: string | null;
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

// ── Approval Request ────────────────────────────────────────────────────────

export interface ApprovalRequest {
  id: string;
  requester_id: string;
  reviewer_id: string | null;
  category: ApprovalCategory;
  status: ApprovalStatus;
  priority: ApprovalPriority;
  title: string;
  description: string | null;
  resource_type: string | null;
  resource_id: string | null;
  payload: Record<string, unknown> | null;
  review_note: string | null;
  auto_approve: boolean;
  created_at: string;
  reviewed_at: string | null;
  updated_at: string;
  requester?: Pick<User, "id" | "email" | "full_name" | "avatar_url">;
  reviewer?: Pick<User, "id" | "email" | "full_name" | "avatar_url">;
}

export interface ApprovalCreate {
  category: ApprovalCategory;
  title: string;
  description?: string;
  priority?: ApprovalPriority;
  resource_type?: string;
  resource_id?: string;
  payload?: Record<string, unknown>;
}

export interface ApprovalReview {
  action: "approve" | "reject";
  review_note?: string;
}

export interface ApprovalStats {
  pending: number;
  in_review: number;
  approved: number;
  rejected: number;
}

// ── Opportunity ─────────────────────────────────────────────────────────────

export interface Opportunity {
  id: string;
  creator_id: string;
  vault_type: VaultType;
  status: OpportunityStatus;
  approval_id: string | null;
  title: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  target_amount: number | null;
  raised_amount: number;
  min_investment: number | null;
  target_irr: number | null;
  expected_irr: number | null;
  actual_irr: number | null;
  industry: string | null;
  stage: string | null;
  founder_name: string | null;
  pitch_deck_url: string | null;
  community_type: string | null;
  collaboration_type: string | null;
  community_subtype: string | null;
  community_details: Record<string, unknown> | null;
  cover_image: string | null;
  gallery: string[] | null;
  documents: Record<string, unknown> | null;
  template_s3_key: string | null;
  template_data: Record<string, unknown> | null;
  investor_count: number;
  launch_date: string | null;
  created_at: string;
  updated_at: string;
  creator?: Pick<User, "id" | "full_name" | "avatar_url">;
}

export interface VaultStats {
  vault_type: string;
  total_invested: number;
  investor_count: number;
  opportunity_count: number;
  expected_irr: number | null;
  actual_irr: number | null;
}

export interface OpportunityCreate {
  vault_type: VaultType;
  title: string;
  tagline?: string;
  description?: string;
  cover_image?: string;
  // Wealth fields
  city?: string;
  state?: string;
  address?: string;
  target_amount?: number;
  min_investment?: number;
  target_irr?: number;
  // Startup fields
  industry?: string;
  stage?: string;
  founder_name?: string;
  pitch_deck_url?: string;
  // Community fields
  community_type?: string;
  collaboration_type?: string;
  community_subtype?: string;
  community_details?: Record<string, unknown>;
}

// ── Platform Config ─────────────────────────────────────────────────────────

export interface PlatformConfig {
  id: string;
  section: string;
  key: string;
  value: unknown;
  description: string | null;
  is_active: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformConfigCreate {
  section: string;
  key: string;
  value: unknown;
  description?: string;
}

export interface PlatformConfigUpdate {
  value?: unknown;
  description?: string;
  is_active?: boolean;
}

export interface ControlCentreDashboard {
  total_users: number;
  role_distribution: Record<string, number>;
  pending_approvals: number;
  total_opportunities: number;
  active_configs: number;
}

// ── Profiling & Matching ────────────────────────────────────────────────────

export interface VaultProfileQuestion {
  id: string;
  vault_type: string;
  category: string;
  question_text: string;
  question_type: "choice" | "multi_choice" | "scale" | "slider" | "text";
  options: QuestionOption[] | SliderOptions | null;
  weight: number;
  dimension: string | null;
  sort_order: number;
  is_required: boolean;
  fun_fact: string | null;
  illustration: string | null;
}

export interface QuestionOption {
  value: string;
  label: string;
  weight: number;
  emoji?: string;
}

export interface SliderOptions {
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
  step: number;
}

export interface UserProfileAnswer {
  id: string;
  user_id: string;
  question_id: string;
  vault_type: string;
  answer_value: unknown;
  answer_score: number | null;
  created_at: string;
}

export interface UserProfileAnswerCreate {
  question_id: string;
  vault_type: string;
  answer_value: unknown;
}

export interface UserProfileAnswerBulk {
  vault_type: string;
  answers: UserProfileAnswerCreate[];
}

export interface OpportunityCustomQuestion {
  id: string;
  opportunity_id: string;
  question_text: string;
  question_type: string;
  options: QuestionOption[] | null;
  weight: number;
  dimension: string | null;
  sort_order: number;
  is_required: boolean;
  is_auto_generated: boolean;
  source_hint: string | null;
}

export interface OpportunityCustomQuestionCreate {
  question_text: string;
  question_type?: string;
  options?: QuestionOption[] | null;
  weight?: number;
  dimension?: string | null;
  sort_order?: number;
  is_required?: boolean;
}

export interface PersonalityDimension {
  user_id: string;
  vault_type: string;
  risk_appetite: number;
  domain_expertise: number;
  investment_capacity: number;
  time_commitment: number;
  network_strength: number;
  creativity_score: number;
  leadership_score: number;
  collaboration_score: number;
  raw_dimensions: Record<string, unknown>;
  computed_at: string;
}

export interface MatchScore {
  user_id: string;
  opportunity_id: string;
  overall_score: number;
  dimension_scores: Record<string, number>;
  breakdown: MatchBreakdown | null;
  computed_at: string;
}

export interface MatchBreakdown {
  tier: string;
  emoji: string;
  note: string;
  strengths: string[];
  areas_to_grow: string[];
}

export interface MatchedUser {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  overall_score: number;
  dimension_scores: Record<string, number>;
  top_strengths: string[];
  compatibility_note: string | null;
}

export interface ProfilingProgress {
  vault_type: string;
  total_questions: number;
  answered_questions: number;
  completion_pct: number;
  is_complete: boolean;
  personality: PersonalityDimension | null;
}

// ── Persona & Vault Feature Flags ───────────────────────────────────────────

export interface PersonaSelectionRequest {
  roles: string[];
  primary_role: string;
}

export interface VaultFeatureFlag {
  id: string;
  vault_type: string;
  role: string;
  feature_key: string;
  enabled: boolean;
  updated_at: string;
}

export interface VaultFeatureFlagUpdate {
  vault_type: string;
  role: string;
  feature_key: string;
  enabled: boolean;
}

export interface VaultFeatureMatrixUpdate {
  updates: VaultFeatureFlagUpdate[];
}

export interface MyFeatureFlags {
  wealth: Record<string, boolean>;
  opportunity: Record<string, boolean>;
  community: Record<string, boolean>;
}

export interface AdminInvite {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
}

export interface AdminInviteCreate {
  email: string;
  role: "admin" | "super_admin";
}
