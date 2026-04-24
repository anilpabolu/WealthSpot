import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'

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
  assetAllocation: { type: string; percentage: number; value: number }[]
  cityDistribution: { city: string; percentage: number; value: number }[]
  monthlyReturns: { month: string; returns: number; invested: number }[]
}

export interface RecentTransaction {
  id: string
  type: 'investment' | 'payout' | 'referral_bonus' | 'wealthpass'
  amount: number
  propertyTitle: string
  date: string
  status: string
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
