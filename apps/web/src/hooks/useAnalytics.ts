import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '@/lib/api'

/* ── Types ────────────────────────────────────────────────────────────────── */

export interface VaultSummaryItem {
  vaultType: string
  totalOpportunities: number
  activeOpportunities: number
  fundingOpportunities: number
  fundedOpportunities: number
  closedOpportunities: number
  totalTargetAmount: number
  totalRaisedAmount: number
  avgTargetIrr: number
  avgExpectedIrr: number
  avgActualIrr: number
  uniqueCreators: number
  totalInvestors: number
  fundingPct: number
}

export interface VaultSummaryResponse {
  vaults: VaultSummaryItem[]
  platformAum: number
  totalInvestors: number
  totalOpportunities: number
  avgDealSize: number
}

export interface MonthlyTrendPoint {
  month: string
  vaultType: string
  investmentCount: number
  totalAmount: number
  uniqueInvestors: number
}

export interface InvestmentTrendsResponse {
  trends: MonthlyTrendPoint[]
  totalVolume: number
  avgMonthlyVolume: number
  peakMonth: string | null
  peakAmount: number
}

export interface GeoCityItem {
  city: string
  state: string
  vaultType: string
  opportunityCount: number
  totalTarget: number
  totalRaised: number
  totalInvestors: number
}

export interface GeoDistributionResponse {
  cities: GeoCityItem[]
  topCity: string | null
  totalCities: number
}

export interface InvestorGrowthPoint {
  month: string
  newUsers: number
  newInvestors: number
  newBuilders: number
  kycApproved: number
  kycInProgress: number
  cumulativeUsers: number
  cumulativeInvestors: number
}

export interface InvestorAnalyticsResponse {
  growth: InvestorGrowthPoint[]
  totalUsers: number
  totalInvestors: number
  totalBuilders: number
  kycCompletionRate: number
  avgMonthlySignups: number
}

export interface EOIFunnelItem {
  status: string
  vaultType: string
  eoiCount: number
  totalInterestAmount: number
  avgInterestAmount: number
}

export interface EOIFunnelResponse {
  funnel: EOIFunnelItem[]
  totalEois: number
  totalInterest: number
  conversionRate: number
}

export interface TopOpportunityItem {
  id: string
  title: string
  slug: string
  vaultType: string
  status: string
  city: string | null
  state: string | null
  targetAmount: number | null
  raisedAmount: number
  targetIrr: number | null
  expectedIrr: number | null
  actualIrr: number | null
  investorCount: number
  fundingPct: number
  companyName: string | null
  creatorName: string | null
  createdAt: string
}

export interface TopOpportunitiesResponse {
  opportunities: TopOpportunityItem[]
  total: number
}

export interface TransactionRevenueItem {
  month: string
  txnType: string
  txnCount: number
  totalAmount: number
}

export interface RevenueBreakdownResponse {
  monthly: TransactionRevenueItem[]
  byType: Record<string, number>
  totalRevenue: number
}

export interface FullAnalyticsResponse {
  vaultSummary: VaultSummaryResponse
  investmentTrends: InvestmentTrendsResponse
  geographic: GeoDistributionResponse
  investors: InvestorAnalyticsResponse
  eoiFunnel: EOIFunnelResponse
  topOpportunities: TopOpportunitiesResponse
  revenue: RevenueBreakdownResponse
}

/* ── Hooks ────────────────────────────────────────────────────────────────── */

export function useFullAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => apiGet<FullAnalyticsResponse>('/analytics/dashboard'),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

export function useVaultSummary() {
  return useQuery({
    queryKey: ['analytics', 'vault-summary'],
    queryFn: () => apiGet<VaultSummaryResponse>('/analytics/vault-summary'),
    staleTime: 60_000,
  })
}

export function useInvestmentTrends(months = 12) {
  return useQuery({
    queryKey: ['analytics', 'investment-trends', months],
    queryFn: () => apiGet<InvestmentTrendsResponse>('/analytics/investment-trends', { params: { months } }),
    staleTime: 60_000,
  })
}

export function useGeoDistribution() {
  return useQuery({
    queryKey: ['analytics', 'geographic'],
    queryFn: () => apiGet<GeoDistributionResponse>('/analytics/geographic'),
    staleTime: 60_000,
  })
}

export function useInvestorAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'investors'],
    queryFn: () => apiGet<InvestorAnalyticsResponse>('/analytics/investors'),
    staleTime: 60_000,
  })
}

export function useEOIFunnel() {
  return useQuery({
    queryKey: ['analytics', 'eoi-funnel'],
    queryFn: () => apiGet<EOIFunnelResponse>('/analytics/eoi-funnel'),
    staleTime: 60_000,
  })
}

export function useTopOpportunities(limit = 10) {
  return useQuery({
    queryKey: ['analytics', 'top-opportunities', limit],
    queryFn: () => apiGet<TopOpportunitiesResponse>('/analytics/top-opportunities', { params: { limit } }),
    staleTime: 60_000,
  })
}

export function useRevenueBreakdown() {
  return useQuery({
    queryKey: ['analytics', 'revenue'],
    queryFn: () => apiGet<RevenueBreakdownResponse>('/analytics/revenue'),
    staleTime: 60_000,
  })
}

export function useRefreshAnalytics() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiPost('/analytics/refresh'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['analytics'] }),
  })
}
