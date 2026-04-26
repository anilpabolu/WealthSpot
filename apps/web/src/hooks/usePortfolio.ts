import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPut } from '@/lib/api'

export interface PortfolioProperty {
  propertyId: string
  propertyTitle: string
  propertyCity: string
  propertyImage: string
  assetType: string
  investedAmount: number
  currentValue: number
  units: number
  irr: number
  returnPercentage: number
  investmentCount: number
  originalUnitPrice: number
  currentUnitPrice: number
  appreciationAmount: number
  appreciationPct: number
  status: string
  investedAt: string
  lastPayoutDate: string | null
  nextPayoutDate: string | null
}

export interface PortfolioSummary {
  totalInvested: number
  currentValue: number
  totalReturns: number
  unrealizedGains: number
  avgIrr: number
  xirr: number
  propertiesCount: number
  citiesCount: number
  monthlyIncome: number
  assetAllocation: Array<{ type: string; percentage: number; value: number }>
  cityDistribution: Array<{ city: string; percentage: number; value: number }>
  monthlyReturns: Array<{ month: string; returns: number; invested: number }>
}

export interface RecentTransaction {
  id: string
  type: 'investment' | 'payout' | 'referral_bonus' | 'wealthpass'
  amount: number
  propertyTitle: string
  date: string
  status: string
  vaultType: string | null
  opportunitySlug: string | null
}

export function usePortfolioSummary() {
  return useQuery({
    queryKey: ['portfolio', 'summary'],
    queryFn: () => apiGet<PortfolioSummary>('/portfolio/summary'),
    staleTime: 30_000,
  })
}

export function usePortfolioProperties() {
  return useQuery({
    queryKey: ['portfolio', 'properties'],
    queryFn: () => apiGet<PortfolioProperty[]>('/portfolio/properties'),
    staleTime: 30_000,
  })
}

export function useRecentTransactions(limit = 10) {
  return useQuery({
    queryKey: ['portfolio', 'transactions', limit],
    queryFn: () =>
      apiGet<RecentTransaction[]>('/portfolio/transactions', {
        params: { limit },
      }),
    staleTime: 30_000,
  })
}

/* ── Vault-wise portfolio breakdown ─────────────────────────────── */

export interface VaultPortfolioItem {
  vaultType: string
  totalInvested: number
  currentValue: number
  returns: number
  returnPct: number
  opportunityCount: number
  investorCount: number
  expectedIrr: number | null
  actualIrr: number | null
  avgDurationDays: number
}

export interface VaultPortfolioResponse {
  vaults: VaultPortfolioItem[]
  grandTotalInvested: number
  grandCurrentValue: number
  grandReturns: number
  grandReturnPct: number
}

export function useVaultWisePortfolio() {
  return useQuery({
    queryKey: ['portfolio', 'vault-wise'],
    queryFn: () => apiGet<VaultPortfolioResponse>('/portfolio/vault-wise'),
    staleTime: 30_000,
  })
}

/* ── Property investment detail ─────────────────────────────────── */

export interface PropertyInvestmentItem {
  investmentId: string
  units: number
  amount: number
  unitPrice: number
  investedAt: string
}

export interface PropertyAppreciationItem {
  id: string
  mode: string
  inputValue: number
  oldValuation: number
  newValuation: number
  note: string | null
  createdAt: string
}

export interface PropertyInvestmentDetail {
  propertyId: string
  propertyName: string
  city: string
  assetType: string
  originalUnitPrice: number
  currentUnitPrice: number
  appreciationPct: number
  totalInvested: number
  currentValue: number
  totalUnits: number
  investmentCount: number
  investments: PropertyInvestmentItem[]
  appreciationHistory: PropertyAppreciationItem[]
}

export function usePropertyInvestmentDetail(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['portfolio', 'property-detail', propertyId],
    queryFn: () => apiGet<PropertyInvestmentDetail>(`/portfolio/properties/${propertyId}`),
    enabled: !!propertyId,
    staleTime: 30_000,
  })
}

/* ── Unified Holdings ────────────────────────────────────────────── */

export interface HoldingItem {
  id: string
  investmentType: 'property' | 'opportunity'
  projectTitle: string
  projectImage: string | null
  projectSlug: string | null
  vaultType: string
  city: string | null
  assetType: string | null
  investedAmount: number
  currentValue: number
  returns: number
  returnPct: number
  irr: number | null
  expectedIrr: number | null
  actualIrr: number | null
  units: number
  investedAt: string
  status: string
  opportunityId: string | null
  payoutFrequency: string | null
  appreciationPct: number
  originalUnitPrice: number | null
  currentUnitPrice: number | null
  targetAmount: number | null
  raisedAmount: number | null
  investorCount: number | null
  description: string | null
  address: string | null
  founderName: string | null
  tagline: string | null
  projectPhase: string | null
}

export function usePortfolioHoldings() {
  return useQuery({
    queryKey: ['portfolio', 'holdings'],
    queryFn: () => apiGet<HoldingItem[]>('/portfolio/holdings'),
    staleTime: 30_000,
  })
}

/* ── Snapshot config ─────────────────────────────────────────────── */

export interface SnapshotConfig {
  sections: string[]
}

export function useSnapshotConfig() {
  return useQuery({
    queryKey: ['portfolio', 'snapshot-config'],
    queryFn: () => apiGet<SnapshotConfig>('/portfolio/snapshot-config'),
    staleTime: 5 * 60_000,
  })
}

export function useUpdateSnapshotConfig() {
  const qc = useQueryClient()
  return useMutation({
    meta: { successMessage: 'Snapshot preferences saved' },
    mutationFn: (sections: string[]) =>
      apiPut<SnapshotConfig>('/portfolio/snapshot-config', { sections }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolio', 'snapshot-config'] })
    },
  })
}

/* ── Opportunity appreciation history ───────────────────────────── */

export interface AppreciationHistoryItem {
  id: string
  mode: string
  inputValue: number
  oldValuation: number
  newValuation: number
  note: string | null
  createdAt: string
}

export function useOpportunityAppreciationHistory(opportunityId: string | null | undefined) {
  return useQuery({
    queryKey: ['appreciation-history', 'opportunity', opportunityId],
    queryFn: () =>
      apiGet<AppreciationHistoryItem[]>(`/opportunities/${opportunityId}/appreciation-history`),
    enabled: !!opportunityId,
    staleTime: 60_000,
  })
}
