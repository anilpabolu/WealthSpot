import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api'

export interface OpportunityMedia {
  id: string
  mediaType: string
  s3Key: string
  url: string
  filename: string | null
  sizeBytes: number | null
  contentType: string | null
  sortOrder: number
  isCover: boolean
  createdAt: string
}

export interface CompanySummary {
  id: string
  companyName: string
  brandName: string | null
  logoUrl: string | null
  verified: boolean
}

export interface OpportunityItem {
  id: string
  creatorId: string
  vaultType: string
  status: string
  approvalId: string | null
  title: string
  slug: string
  tagline: string | null
  description: string | null
  city: string | null
  state: string | null
  address: string | null
  addressLine1: string | null
  addressLine2: string | null
  landmark: string | null
  locality: string | null
  pincode: string | null
  district: string | null
  country: string
  targetAmount: number | null
  raisedAmount: number
  minInvestment: number | null
  investment_mode: string | null

  industry: string | null
  stage: string | null
  founderName: string | null
  pitchDeckUrl: string | null
  communityType: string | null
  collaborationType: string | null
  communitySubtype: string | null
  communityDetails: Record<string, unknown> | null
  safeVaultData: Record<string, unknown> | null
  // Property Specs — camelCase keys (actual runtime values after convertKeysToCamel)
  propertyType: string | null
  developmentType: string | null
  gstPercentage: number | null
  projectedMarketValueAtExit: number | null
  purposeOfFunds: string | null
  pricePerSqft: number | null
  totalProjectAreaSqft: number | null
  propertySpecs: Record<string, unknown> | null
  propertyAmenities: string[] | null
  amenityCostEstimate: number | null
  holdingPeriodMonths: number | null
  investmentMode: string | null
  // Snake_case aliases (legacy — resolve to undefined at runtime, kept for gradual migration)
  property_type: string | null
  development_type: string | null
  gst_percentage: number | null
  projected_market_value_at_exit: number | null
  purpose_of_funds: string | null
  price_per_sqft: number | null
  total_project_area_sqft: number | null
  property_specs: Record<string, unknown> | null
  property_amenities: string[] | null
  amenity_cost_estimate: number | null
  projectPhase: string | null
  currentValuation: number | null
  projectRoadmap?: any[] | null
  riskFactors?: string | null
  whyInvestors?: string | null
  investmentThesis?: string | null
  
  // Snake_case aliases (legacy)
  project_roadmap: any[] | null
  risk_factors: string | null
  why_investors: string | null
  investment_thesis: string | null
  maps_url?: string | null
  project_phase?: string | null
  holding_period_months?: number | null
  coverImage: string | null
  videoUrl: string | null
  gallery: string[] | null
  companyId: string | null
  investorCount: number
  launchDate: string | null
  fundingOpenAt: string | null
  closingDate: string | null
  createdAt: string
  locationUsps: Array<{ text: string; category: string }> | null
  latitude: number | null
  longitude: number | null
  mapsUrl: string | null
  creator?: { id: string; fullName: string; avatarUrl: string | null }
  media: OpportunityMedia[]
  company: CompanySummary | null
  shieldAssessments?: Array<{
    id: string
    categoryCode: string
    subcategoryCode: string
    status: string
    builderAnswer: Record<string, unknown> | null
    isPublic: boolean
    documents?: Array<{ id: string; filename: string | null; url: string }>
  }> | null
}

interface PaginatedOpportunities {
  items: OpportunityItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface VaultStats {
  vaultType: string
  totalInvested: number
  investorCount: number
  opportunityCount: number

  explorerCount: number
  dnaInvestorCount: number
  minInvestment: number | null
  avgTicketSize: number | null
  citiesCovered: number
  sectorsCovered: number
  coInvestorCount: number
  coPartnerCount: number
  platformUsersCount: number
  // Safe Vault
  listingsCount: number
  avgInterestRate: number | null
  avgTenureMonths: number | null
  mortgageCoveragePct: number | null
  // Community
  avgProjectSize: number | null
  collaborationRate: number | null
}

export interface OpportunityCreatePayload {
  vaultType: string
  title: string
  tagline?: string
  description?: string
  companyId?: string
  // Address
  addressLine1?: string
  addressLine2?: string
  landmark?: string
  locality?: string
  city?: string
  state?: string
  pincode?: string
  district?: string
  country?: string
  address?: string
  // Financials
  targetAmount?: number
  minInvestment?: number
  // Geo-coordinates & maps
  latitude?: number
  longitude?: number
  mapsUrl?: string
  // Location USPs
  locationUsps?: Array<{ text: string; category: string }>
  // Startup
  industry?: string
  stage?: string
  founderName?: string
  pitchDeckUrl?: string
  // Community
  communityType?: string
  collaborationType?: string
  communitySubtype?: string
  communityDetails?: Record<string, unknown>
  // Safe Vault
  safeVaultData?: Record<string, unknown>
  // Property Specs
  property_type?: string
  development_type?: string
  gst_percentage?: number
  holding_period_months?: number
  projected_market_value_at_exit?: number
  purpose_of_funds?: string
  price_per_sqft?: number
  total_project_area_sqft?: number
  property_specs?: Record<string, unknown>
  property_amenities?: string[]
  amenity_cost_estimate?: number
  // Investment configuration mode
  investmentMode?: 'lumpsum' | 'unit_config'
  // Funding schedule
  fundingOpenAt?: string
  closingDate?: string
  // Builder shield assessment
  shield_answers?: Record<string, unknown>
  targetIrr?: number
  project_phase?: string
  project_roadmap?: Array<Record<string, any>>
  risk_factors?: string
  why_investors?: string
  investment_thesis?: string
}

export type OpportunityUpdatePayload = Partial<OpportunityCreatePayload> & {
  status?: string
  closingDate?: string
  fundingOpenAt?: string
  cancelInvestments?: boolean
}

export interface OpportunityFormOptionRead {
  id: string
  fieldName: string
  value: string
  label: string
  isActive: boolean
  sortOrder: number
}

export interface OpportunityFormOptionsGrouped {
  community_type: OpportunityFormOptionRead[]
  collaboration_type: OpportunityFormOptionRead[]
  investment_tenure: OpportunityFormOptionRead[]
  revenue_model: OpportunityFormOptionRead[]
  legal_structure: OpportunityFormOptionRead[]
  risk_level: OpportunityFormOptionRead[]
  projected_timeline: OpportunityFormOptionRead[]
  time_commitment: OpportunityFormOptionRead[]
  partnership_duration: OpportunityFormOptionRead[]
  partner_skill: OpportunityFormOptionRead[]
  decision_authority: OpportunityFormOptionRead[]
}

export function useOpportunities(params?: { vaultType?: string; status?: string; page?: number; communitySubtype?: string; city?: string }) {
  return useQuery({
    queryKey: ['opportunities', params],
    queryFn: () =>
      apiGet<PaginatedOpportunities>('/opportunities', {
        params: {
          ...(params?.vaultType && { vault_type: params.vaultType }),
          ...(params?.status && { status: params.status }),
          ...(params?.communitySubtype && { community_subtype: params.communitySubtype }),
          ...(params?.city && { city: params.city }),
          page: params?.page ?? 1,
        },
      }),
    staleTime: 15_000,
  })
}

export function useOpportunity(id: string) {
  return useQuery({
    queryKey: ['opportunities', id],
    queryFn: () => apiGet<OpportunityItem>(`/opportunities/${id}`),
    enabled: !!id,
  })
}

export function useOpportunityBySlug(slug: string) {
  return useQuery({
    queryKey: ['opportunities', 'slug', slug],
    queryFn: () => apiGet<OpportunityItem>(`/opportunities/by-slug/${slug}`),
    enabled: !!slug,
  })
}

export function useCreateOpportunity() {
  const qc = useQueryClient()
  return useMutation({
    meta: { successMessage: 'Opportunity submitted for approval' },
    mutationFn: (data: OpportunityCreatePayload) =>
      apiPost<OpportunityItem>('/opportunities', {
        vault_type: data.vaultType,
        title: data.title,
        tagline: data.tagline,
        description: data.description,
        company_id: data.companyId,
        city: data.city,
        state: data.state,
        address: data.address,
        address_line1: data.addressLine1,
        address_line2: data.addressLine2,
        landmark: data.landmark,
        locality: data.locality,
        pincode: data.pincode,
        district: data.district,
        country: data.country,
        target_amount: data.targetAmount,
        min_investment: data.minInvestment,
        latitude: data.latitude,
        longitude: data.longitude,
        maps_url: data.mapsUrl,
        location_usps: data.locationUsps,
        industry: data.industry,
        stage: data.stage,
        founder_name: data.founderName,
        pitch_deck_url: data.pitchDeckUrl,
        community_type: data.communityType,
        collaboration_type: data.collaborationType,
        community_subtype: data.communitySubtype,
        community_details: data.communityDetails,
        safe_vault_data: data.safeVaultData,
        property_type: data.property_type,
        development_type: data.development_type,
        gst_percentage: data.gst_percentage,
        holding_period_months: data.holding_period_months,
        projected_market_value_at_exit: data.projected_market_value_at_exit,
        purpose_of_funds: data.purpose_of_funds,
        price_per_sqft: data.price_per_sqft,
        total_project_area_sqft: data.total_project_area_sqft,
        property_specs: data.property_specs,
        property_amenities: data.property_amenities,
        amenity_cost_estimate: data.amenity_cost_estimate,
        investment_mode: data.investmentMode ?? 'lumpsum',
        funding_open_at: data.fundingOpenAt || undefined,
        closing_date: data.closingDate || undefined,
        shield_answers: data.shield_answers,
        target_irr: data.targetIrr,
        project_phase: data.project_phase,
        risk_factors: data.risk_factors,
        why_investors: data.why_investors,
        investment_thesis: data.investment_thesis,
        project_roadmap: data.project_roadmap,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opportunities'] })
    },
  })
}

export function useUpdateOpportunity() {
  const qc = useQueryClient()
  return useMutation({
    meta: { successMessage: 'Opportunity updated' },
    mutationFn: ({ id, data }: { id: string; data: OpportunityUpdatePayload }) =>
      apiPatch<OpportunityItem>(`/opportunities/${id}`, {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.tagline !== undefined && { tagline: data.tagline }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.companyId !== undefined && { company_id: data.companyId }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.addressLine1 !== undefined && { address_line1: data.addressLine1 }),
        ...(data.addressLine2 !== undefined && { address_line2: data.addressLine2 }),
        ...(data.landmark !== undefined && { landmark: data.landmark }),
        ...(data.locality !== undefined && { locality: data.locality }),
        ...(data.pincode !== undefined && { pincode: data.pincode }),
        ...(data.district !== undefined && { district: data.district }),
        ...(data.country !== undefined && { country: data.country }),
        ...(data.targetAmount !== undefined && { target_amount: data.targetAmount }),
        ...(data.minInvestment !== undefined && { min_investment: data.minInvestment }),
        ...(data.industry !== undefined && { industry: data.industry }),
        ...(data.stage !== undefined && { stage: data.stage }),
        ...(data.founderName !== undefined && { founder_name: data.founderName }),
        ...(data.pitchDeckUrl !== undefined && { pitch_deck_url: data.pitchDeckUrl }),
        ...(data.communityType !== undefined && { community_type: data.communityType }),
        ...(data.collaborationType !== undefined && { collaboration_type: data.collaborationType }),
        ...(data.communitySubtype !== undefined && { community_subtype: data.communitySubtype }),
        ...(data.communityDetails !== undefined && { community_details: data.communityDetails }),
        ...(data.safeVaultData !== undefined && { safe_vault_data: data.safeVaultData }),
        ...(data.property_type !== undefined && { property_type: data.property_type }),
        ...(data.development_type !== undefined && { development_type: data.development_type }),
        ...(data.gst_percentage !== undefined && { gst_percentage: data.gst_percentage }),
        ...(data.holding_period_months !== undefined && { holding_period_months: data.holding_period_months }),
        ...(data.projected_market_value_at_exit !== undefined && { projected_market_value_at_exit: data.projected_market_value_at_exit }),
        ...(data.purpose_of_funds !== undefined && { purpose_of_funds: data.purpose_of_funds }),
        ...(data.price_per_sqft !== undefined && { price_per_sqft: data.price_per_sqft }),
        ...(data.total_project_area_sqft !== undefined && { total_project_area_sqft: data.total_project_area_sqft }),
        ...(data.property_specs !== undefined && { property_specs: data.property_specs }),
        ...(data.property_amenities !== undefined && { property_amenities: data.property_amenities }),
        ...(data.amenity_cost_estimate !== undefined && { amenity_cost_estimate: data.amenity_cost_estimate }),
        ...(data.investmentMode !== undefined && { investment_mode: data.investmentMode }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.closingDate !== undefined && { closing_date: data.closingDate || undefined }),
        ...(data.fundingOpenAt !== undefined && { funding_open_at: data.fundingOpenAt || undefined }),
        ...(data.cancelInvestments !== undefined && { cancel_investments: data.cancelInvestments }),
        ...(data.targetIrr !== undefined && { target_irr: data.targetIrr }),
        ...(data.project_phase !== undefined && { project_phase: data.project_phase }),
        ...(data.risk_factors !== undefined && { risk_factors: data.risk_factors }),
        ...(data.why_investors !== undefined && { why_investors: data.why_investors }),
        ...(data.investment_thesis !== undefined && { investment_thesis: data.investment_thesis }),
        ...(data.project_roadmap !== undefined && { project_roadmap: data.project_roadmap }),
        ...(data.shield_answers !== undefined && { shield_answers: data.shield_answers }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opportunities'] })
    },
  })
}

export function useDeleteOpportunityMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (mediaId: string) => apiDelete(`/uploads/opportunity-media/${mediaId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opportunities'] })
    },
  })
}

export function useVaultStats() {
  return useQuery({
    queryKey: ['vault-stats'],
    queryFn: () => apiGet<VaultStats[]>('/opportunities/vault-stats'),
    staleTime: 30_000,
  })
}

export function useOpportunityFormOptions() {
  return useQuery({
    queryKey: ['opportunity-form-options'],
    queryFn: () => apiGet<OpportunityFormOptionsGrouped>('/opportunities/form-options'),
    staleTime: 5 * 60 * 1000,
    refetchOnMount: 'always',
  })
}
