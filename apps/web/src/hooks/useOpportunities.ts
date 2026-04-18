import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPatch } from '@/lib/api'

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
  targetIrr: number | null
  expectedIrr: number | null
  actualIrr: number | null
  industry: string | null
  stage: string | null
  founderName: string | null
  pitchDeckUrl: string | null
  communityType: string | null
  collaborationType: string | null
  communitySubtype: string | null
  communityDetails: Record<string, unknown> | null
  projectPhase: string | null
  currentValuation: number | null
  coverImage: string | null
  videoUrl: string | null
  companyId: string | null
  investorCount: number
  launchDate: string | null
  closingDate: string | null
  createdAt: string
  creator?: { id: string; fullName: string; avatarUrl: string | null }
  media: OpportunityMedia[]
  company: CompanySummary | null
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
  expectedIrr: number | null
  actualIrr: number | null
  explorerCount: number
  dnaInvestorCount: number
  minInvestment: number | null
  avgTicketSize: number | null
  citiesCovered: number
  sectorsCovered: number
  coInvestorCount: number
  coPartnerCount: number
  platformUsersCount: number
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
  targetIrr?: number
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
}

export type OpportunityUpdatePayload = Partial<OpportunityCreatePayload> & {
  status?: string
  closingDate?: string
  cancelInvestments?: boolean
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
        target_irr: data.targetIrr,
        industry: data.industry,
        stage: data.stage,
        founder_name: data.founderName,
        pitch_deck_url: data.pitchDeckUrl,
        community_type: data.communityType,
        collaboration_type: data.collaborationType,
        community_subtype: data.communitySubtype,
        community_details: data.communityDetails,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opportunities'] })
    },
  })
}

export function useUpdateOpportunity() {
  const qc = useQueryClient()
  return useMutation({
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
        ...(data.targetIrr !== undefined && { target_irr: data.targetIrr }),
        ...(data.industry !== undefined && { industry: data.industry }),
        ...(data.stage !== undefined && { stage: data.stage }),
        ...(data.founderName !== undefined && { founder_name: data.founderName }),
        ...(data.pitchDeckUrl !== undefined && { pitch_deck_url: data.pitchDeckUrl }),
        ...(data.communityType !== undefined && { community_type: data.communityType }),
        ...(data.collaborationType !== undefined && { collaboration_type: data.collaborationType }),
        ...(data.communitySubtype !== undefined && { community_subtype: data.communitySubtype }),
        ...(data.communityDetails !== undefined && { community_details: data.communityDetails }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.closingDate !== undefined && { closing_date: data.closingDate }),
        ...(data.cancelInvestments !== undefined && { cancel_investments: data.cancelInvestments }),
      }),
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
