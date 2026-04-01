/**
 * useOpportunities – React Query hooks for opportunities CRUD.
 * Mirrors web's useOpportunities.ts.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '../lib/api'

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
  entityType: string | null
  reraNumber: string | null
  website: string | null
  description: string | null
  city: string | null
  state: string | null
  yearsInBusiness: number | null
  projectsCompleted: number | null
  totalAreaDeveloped: string | null
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
  industry: string | null
  stage: string | null
  founderName: string | null
  pitchDeckUrl: string | null
  communityType: string | null
  collaborationType: string | null
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
  expectedIrr: number | null
  actualIrr: number | null
}

interface PaginatedOpportunities {
  items: OpportunityItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface OpportunityCreatePayload {
  vaultType: string
  title: string
  tagline?: string
  description?: string
  companyId?: string
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
  targetAmount?: number
  minInvestment?: number
  targetIrr?: number
  industry?: string
  stage?: string
  founderName?: string
  pitchDeckUrl?: string
  communityType?: string
  collaborationType?: string
}

export function useOpportunities(params?: { vaultType?: string; status?: string; page?: number }) {
  return useQuery({
    queryKey: ['opportunities', params],
    queryFn: () =>
      apiGet<PaginatedOpportunities>('/opportunities', {
        params: {
          ...(params?.vaultType && { vault_type: params.vaultType }),
          ...(params?.status && { status: params.status }),
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
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opportunities'] })
    },
  })
}

export interface VaultStats {
  vaultType: string
  totalInvested: number
  investorCount: number
  opportunityCount: number
  expectedIrr: number | null
  actualIrr: number | null
}

export function useOpportunityBySlug(slug: string) {
  return useQuery({
    queryKey: ['opportunities', 'slug', slug],
    queryFn: () => apiGet<OpportunityItem>(`/opportunities/by-slug/${slug}`),
    enabled: !!slug,
  })
}

export function useVaultStats() {
  return useQuery({
    queryKey: ['vault-stats'],
    queryFn: () => apiGet<VaultStats[]>('/opportunities/vault-stats'),
    staleTime: 30_000,
  })
}
