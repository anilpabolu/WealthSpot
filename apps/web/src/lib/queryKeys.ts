/**
 * Centralized TanStack query-key factory.
 *
 * Every query key in the app derives from this single source of truth.
 * Invalidation patterns (e.g. `qc.invalidateQueries({ queryKey: Q.portfolio.all() })`)
 * automatically cover all sub-keys because TanStack matches array prefixes.
 *
 * Usage:
 *   import { Q } from '@/lib/queryKeys'
 *   queryKey: Q.portfolio.summary()
 *   queryKey: Q.portfolio.propertyDetail(propertyId)
 *   qc.invalidateQueries({ queryKey: Q.portfolio.all() })
 */

export const Q = {
  // ── User ──────────────────────────────────────────────────────────────
  user: {
    all: () => ['user'] as const,
    me: () => ['user', 'me'] as const,
  },

  // ── Profile ───────────────────────────────────────────────────────────
  profile: {
    all: () => ['profile'] as const,
    completion: () => ['profile', 'completion'] as const,
    full: () => ['profile', 'full'] as const,
  },

  // ── KYC / Bank ────────────────────────────────────────────────────────
  kyc: {
    all: () => ['kyc'] as const,
    status: () => ['kyc', 'status'] as const,
    details: () => ['kyc', 'details'] as const,
    documents: () => ['kyc', 'documents'] as const,
  },
  bank: {
    all: () => ['bank'] as const,
    details: () => ['bank', 'details'] as const,
  },

  // ── Portfolio ─────────────────────────────────────────────────────────
  portfolio: {
    all: () => ['portfolio'] as const,
    summary: () => ['portfolio', 'summary'] as const,
    properties: () => ['portfolio', 'properties'] as const,
    transactions: (limit?: number) =>
      limit !== undefined
        ? (['portfolio', 'transactions', limit] as const)
        : (['portfolio', 'transactions'] as const),
    holdingTransactions: (holdingId: string) =>
      ['portfolio', 'transactions', 'holding', holdingId] as const,
    vaultWise: () => ['portfolio', 'vault-wise'] as const,
    propertyDetail: (propertyId: string) =>
      ['portfolio', 'property-detail', propertyId] as const,
    holdings: () => ['portfolio', 'holdings'] as const,
    snapshotConfig: () => ['portfolio', 'snapshot-config'] as const,
    ackUrl: (holdingId: string, recordId: string) =>
      ['portfolio', 'ack-url', holdingId, recordId] as const,
  },

  // ── Properties ────────────────────────────────────────────────────────
  properties: {
    all: () => ['properties'] as const,
    list: (filters?: Record<string, unknown>) =>
      filters !== undefined ? (['properties', filters] as const) : (['properties'] as const),
    detail: (slug: string) => ['property', slug] as const,
    featured: () => ['properties', 'featured'] as const,
    cities: () => ['properties', 'cities'] as const,
    autocomplete: (query: string) => ['properties', 'autocomplete', query] as const,
  },

  // ── Opportunities ─────────────────────────────────────────────────────
  opportunities: {
    all: () => ['opportunities'] as const,
    list: (params?: Record<string, unknown>) =>
      params !== undefined ? (['opportunities', params] as const) : (['opportunities'] as const),
    byId: (id: string) => ['opportunities', id] as const,
    bySlug: (slug: string) => ['opportunities', 'slug', slug] as const,
  },
  opportunity: {
    all: () => ['opportunity'] as const,
    like: (id: string) => ['opportunity-like', id] as const,
    referralCode: (id: string) => ['property-referral-code', id] as const,
  },

  // ── Vault stats / config ──────────────────────────────────────────────
  vaultStats: {
    all: () => ['vault-stats'] as const,
  },
  vaultConfig: {
    all: () => ['vault-config'] as const,
  },
  vaultFeatures: {
    all: () => ['vault-features'] as const,
    matrix: () => ['vault-features', 'matrix'] as const,
    myFeatures: () => ['vault-features', 'my-features'] as const,
  },
  vaultMetricsConfig: {
    all: () => ['vault-metrics-config'] as const,
  },

  // ── Investments ───────────────────────────────────────────────────────
  investments: {
    all: () => ['investments'] as const,
    mine: () => ['investments', 'mine'] as const,
    summary: () => ['investments', 'summary'] as const,
    byId: (id: string) => ['investment', id] as const,
  },

  // ── Appreciation / IRR history ────────────────────────────────────────
  appreciationHistory: {
    all: () => ['appreciation-history'] as const,
    byOpportunity: (id: string) => ['appreciation-history', id] as const,
    portfolioOpportunity: (id: string) =>
      ['appreciation-history', 'opportunity', id] as const,
  },

  // ── Community ─────────────────────────────────────────────────────────
  community: {
    all: () => ['community'] as const,
    posts: () => ['community', 'posts'] as const,
    activities: (limit?: number) =>
      limit !== undefined
        ? (['user-activities', limit] as const)
        : (['user-activities'] as const),
  },

  // ── Analytics ─────────────────────────────────────────────────────────
  analytics: {
    all: () => ['analytics'] as const,
    dashboard: () => ['analytics', 'dashboard'] as const,
    vaultSummary: () => ['analytics', 'vault-summary'] as const,
    investmentTrends: (months: number) =>
      ['analytics', 'investment-trends', months] as const,
    geographic: () => ['analytics', 'geographic'] as const,
    investors: () => ['analytics', 'investors'] as const,
    eoiFunnel: () => ['analytics', 'eoi-funnel'] as const,
    topOpportunities: (limit: number) =>
      ['analytics', 'top-opportunities', limit] as const,
    revenue: () => ['analytics', 'revenue'] as const,
  },

  // ── Approvals ─────────────────────────────────────────────────────────
  approvals: {
    all: () => ['approvals'] as const,
    list: (filters?: Record<string, unknown>) =>
      filters !== undefined ? (['approvals', filters] as const) : (['approvals'] as const),
    mine: () => ['approvals', 'mine'] as const,
    stats: () => ['approvals', 'stats'] as const,
    allByCategory: (category: string) =>
      ['approvals', 'all', category] as const,
  },

  // ── Builder ───────────────────────────────────────────────────────────
  builder: {
    all: () => ['builder'] as const,
    byId: (id: string) => ['builder', id] as const,
    analytics: () => ['builder-analytics'] as const,
    investors: {
      all: () => ['builder-investors'] as const,
      byOpportunity: (id: string) =>
        ['builder-investors', 'by-opportunity', id] as const,
    },
    updates: (opportunityId: string) =>
      ['builder-updates', opportunityId] as const,
    listings: {
      opportunities: () => ['builder-listings', 'opportunities'] as const,
      properties: () => ['builder-listings', 'properties'] as const,
    },
    investorTransactions: (opportunityId: string, investorUserId: string) =>
      ['builder', 'investor-transactions', opportunityId, investorUserId] as const,
    ackUrl: (opportunityId: string, investorUserId: string, recordId: string) =>
      ['builder', 'ack-url', opportunityId, investorUserId, recordId] as const,
  },

  // ── Control Centre ────────────────────────────────────────────────────
  controlCentre: {
    all: () => ['control-centre'] as const,
    dashboard: () => ['control-centre', 'dashboard'] as const,
    configs: (section?: string) =>
      section !== undefined
        ? (['control-centre', 'configs', section] as const)
        : (['control-centre', 'configs'] as const),
    appearance: () => ['control-centre', 'appearance'] as const,
    notificationsPublic: () =>
      ['control-centre', 'notifications-public'] as const,
    users: (params?: Record<string, unknown>) =>
      params !== undefined
        ? (['control-centre', 'users', params] as const)
        : (['control-centre', 'users'] as const),
    approvalCategories: () =>
      ['control-centre', 'approval-categories'] as const,
  },

  // ── Lender ────────────────────────────────────────────────────────────
  lender: {
    all: () => ['lender'] as const,
    dashboard: () => ['lender', 'dashboard'] as const,
    loans: (params?: Record<string, unknown>) =>
      params !== undefined
        ? (['lender', 'loans', params] as const)
        : (['lender', 'loans'] as const),
  },

  // ── Referrals ─────────────────────────────────────────────────────────
  referrals: {
    all: () => ['referrals'] as const,
    stats: () => ['referrals', 'stats'] as const,
    history: () => ['referrals', 'history'] as const,
  },
  adminReferrals: {
    all: () => ['admin', 'referrals'] as const,
    summary: () => ['admin', 'referrals', 'summary'] as const,
    details: (referrerId: string) =>
      ['admin', 'referrals', 'details', referrerId] as const,
  },

  // ── Profiling ─────────────────────────────────────────────────────────
  profiling: {
    all: () => ['profiling'] as const,
    questions: (vaultType: string) =>
      ['profiling', 'questions', vaultType] as const,
    answers: (vaultType: string) =>
      ['profiling', 'answers', vaultType] as const,
    progress: (vaultType: string) =>
      ['profiling', 'progress', vaultType] as const,
    overallProgress: () => ['profiling', 'overall-progress'] as const,
    personality: (vaultType: string) =>
      ['profiling', 'personality', vaultType] as const,
    opportunityQuestions: (opportunityId: string) =>
      ['profiling', 'opportunity-questions', opportunityId] as const,
  },

  // ── EOI / Comm-mappings ────────────────────────────────────────────────
  eoi: {
    all: () => ['eois'] as const,
    list: (params?: Record<string, unknown>) =>
      params !== undefined ? (['eois', params] as const) : (['eois'] as const),
    pipeline: () => ['admin-eoi-pipeline'] as const,
    builderQuestions: (opportunityId: string) =>
      ['builder-questions', opportunityId] as const,
    commMappings: (opportunityId: string) =>
      ['comm-mappings', opportunityId] as const,
  },

  // ── Companies ─────────────────────────────────────────────────────────
  companies: {
    all: () => ['companies'] as const,
    list: (search?: string, vaultType?: string) =>
      ['companies', search, vaultType] as const,
    byId: (id: string) => ['companies', id] as const,
  },

  // ── Shield / Assessments ──────────────────────────────────────────────
  shield: {
    all: () => ['shield-metrics'] as const,
    metrics: () => ['shield-metrics'] as const,
    assessments: (opportunityId: string) =>
      ['opportunity-assessments', opportunityId] as const,
  },

  // ── Platform / Admin ──────────────────────────────────────────────────
  platformStats: {
    all: () => ['platform-stats'] as const,
  },
  adminMedia: {
    all: () => ['admin-media'] as const,
    byOpportunity: (opportunityId: string) =>
      ['admin-media', opportunityId] as const,
  },
  adminInvites: {
    all: () => ['admin-invites'] as const,
    byStatus: (status: string) => ['admin-invites', status] as const,
  },

  // ── App Videos / Site Content / Misc ──────────────────────────────────
  appVideos: {
    all: () => ['app-videos'] as const,
    public: (page: number, sectionTag?: string) =>
      sectionTag !== undefined
        ? (['app-videos', 'public', page, sectionTag] as const)
        : (['app-videos', 'public', page] as const),
    pagesMeta: () => ['app-videos', 'pages-meta'] as const,
    admin: (page: number) => ['app-videos', 'admin', page] as const,
  },
  siteContent: {
    all: () => ['site-content'] as const,
    byPage: (page: string) => ['site-content', page] as const,
    admin: () => ['site-content-admin'] as const,
  },
  notifications: {
    all: () => ['notifications'] as const,
    preferences: () => ['notifications', 'preferences'] as const,
  },
  pincodes: {
    lookup: (pincode: string) => ['pincodes', pincode] as const,
  },
} as const;
