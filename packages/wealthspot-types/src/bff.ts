// ============================================================================
// BFF View Types — canonical camelCase shapes served by the BFF layer.
//
// The @wealthspot/api-client transform layer converts all API responses
// from snake_case to camelCase.  These interfaces reflect the *post-transform*
// (camelCase) shape — never snake_case.
//
// Why here? To eliminate type drift between apps/web and apps/mobile and to
// ensure a single source of truth for what the BFF services return.
// ============================================================================

// ── Existing investment types (kept for backward compat) ────────────────────

export interface BffInvestment {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyCity: string;
  propertyImage: string;
  amount: number;
  units: number;
  status: string;
  paymentStatus: string;
  investedAt: string;
  maturityDate: string;
  currentValue: number;
  returns: number;
  returnPercentage: number;
}

export interface BffInvestmentSummary {
  totalInvested: number;
  currentValue: number;
  totalReturns: number;
  activeInvestments: number;
  propertiesCount: number;
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardUser {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  kycStatus: string;
  wealthPassActive: boolean;
}

export interface DashboardPortfolio {
  totalInvested: number;
  currentValue: number;
  totalReturns: number;
  monthlyRentalIncome: number;
  propertiesCount: number;
}

export interface DashboardTransaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  createdAt: string;
}

export interface DashboardProperty {
  id: string;
  slug: string;
  title: string;
  coverImage: string | null;
  city: string;
  fundingPercentage: number;
  status: string;
}

export interface DashboardView {
  user: DashboardUser;
  portfolio: DashboardPortfolio;
  recentTransactions: DashboardTransaction[];
  activeProperties: DashboardProperty[];
}

export interface BuilderDashboardListing {
  id: string;
  title: string;
  status: string;
  raisedAmount: number;
  targetAmount: number;
  investorCount: number;
  city?: string;
}

export interface BuilderDashboardStats {
  totalRaised: number;
  activeCount: number;
  investorCount: number;
}

export interface BuilderDashboardView {
  builder: { companyName: string; verified: boolean };
  listings: BuilderDashboardListing[];
  stats: BuilderDashboardStats;
}

// ── Portfolio ────────────────────────────────────────────────────────────────

export interface PortfolioPropertyHolding {
  propertyId: string;
  slug: string;
  title: string;
  city: string;
  coverImage: string | null;
  assetType: string;
  unitsHeld: number;
  investedAmount: number;
  currentValue: number;
  unrealizedGain: number;
  monthlyRental: number;
  status: string;
}

export interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  totalReturns: number;
  monthlyRentalIncome: number;
  propertiesCount: number;
  unrealizedGain: number;
}

export interface PortfolioTransaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  propertyTitle: string;
  createdAt: string;
}

export interface PortfolioView {
  summary: PortfolioSummary;
  holdings: PortfolioPropertyHolding[];
  transactions: PortfolioTransaction[];
}

// ── Marketplace ──────────────────────────────────────────────────────────────

export interface MarketplaceFilters {
  city?: string;
  assetType?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface MarketplaceCard {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  assetType: string;
  status: string;
  city: string;
  coverImage: string | null;
  targetAmount: number;
  raisedAmount: number;
  minInvestment: number;
  rentalYield: number | null;
  investorCount: number;
  fundingPercentage: number;
}

export interface MarketplaceView {
  properties: MarketplaceCard[];
  total: number;
  page: number;
  totalPages: number;
  filtersApplied: MarketplaceFilters;
}

export interface PropertyBuilder {
  companyName: string;
  reraNumber: string | null;
  verified: boolean;
  logoUrl: string | null;
}

export interface PropertyDetailView {
  property: MarketplaceCard & {
    description: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    areaSqft: number | null;
    bedrooms: number | null;
    possessionDate: string | null;
    reraId: string | null;
    gallery: string[] | null;
    documents: Record<string, unknown> | null;
    amenities: string[] | null;
    launchDate: string | null;
  };
  builder: PropertyBuilder;
  similarProperties: MarketplaceCard[];
}

// ── Community ────────────────────────────────────────────────────────────────

export interface CommunityAuthor {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface CommunityFeedItem {
  id: string;
  postType: string;
  title: string;
  bodyPreview: string;
  category: string | null;
  tags: string[] | null;
  upvotes: number;
  replyCount: number;
  isPinned: boolean;
  author: CommunityAuthor;
  createdAt: string;
}

export interface CommunityFeedView {
  posts: CommunityFeedItem[];
  total: number;
  page: number;
  totalPages: number;
  pinned: CommunityFeedItem[];
}

export interface CommunityReplyItem {
  id: string;
  body: string;
  upvotes: number;
  author: CommunityAuthor;
  createdAt: string;
}

export interface PostDetailView {
  post: CommunityFeedItem & { body: string };
  replies: CommunityReplyItem[];
}

// ── Admin ────────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  totalInvestors: number;
  totalBuilders: number;
  totalProperties: number;
  activeProperties: number;
  totalInvested: number;
  totalTransactions: number;
  kycPendingCount: number;
}

export interface AdminPendingKyc {
  userId: string;
  fullName: string;
  email: string;
  kycStatus: string;
  documentCount: number;
  submittedAt: string;
}

export interface AdminPendingProperty {
  id: string;
  title: string;
  builderName: string;
  city: string;
  targetAmount: number;
  submittedAt: string;
}

export interface AdminActivityItem {
  action: string;
  resourceType: string;
  resourceId: string | null;
  actorName: string;
  createdAt: string;
}

export interface AdminDashboardView {
  stats: AdminStats;
  pendingKyc: AdminPendingKyc[];
  pendingProperties: AdminPendingProperty[];
  recentActivity: AdminActivityItem[];
}

// ── KYC ─────────────────────────────────────────────────────────────────────

export interface KycDocumentItem {
  id: string;
  documentType: string;
  verificationStatus: string;
  rejectionReason: string | null;
  createdAt: string;
}

export interface KycSteps {
  panUploaded: boolean;
  panVerified: boolean;
  aadhaarUploaded: boolean;
  aadhaarVerified: boolean;
  selfieUploaded: boolean;
  selfieVerified: boolean;
}

export interface KycStatusView {
  kycStatus: string;
  documents: KycDocumentItem[];
  steps: KycSteps;
  progressPercentage: number;
}

