import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'

export interface BuilderOpportunityBreakdown {
  id: string
  title: string
  slug: string
  status: string
  vaultType: string
  city: string | null
  raisedAmount: number
  targetAmount: number
  investorCount: number
  fundingPct: number
  createdAt: string
}

export interface BuilderMonthlyTrend {
  month: string
  amount: number
  count: number
}

export interface BuilderCityDistribution {
  city: string
  count: number
  totalRaised: number
}

export interface BuilderAnalyticsData {
  totalRaised: number
  totalTarget: number
  investorCount: number
  opportunityCount: number
  opportunities: BuilderOpportunityBreakdown[]
  monthlyTrends: BuilderMonthlyTrend[]
  cityDistribution: BuilderCityDistribution[]
  avgDaysToFund: number | null
  topOpportunity: BuilderOpportunityBreakdown | null
  repeatInvestorRate: number
}

export function useBuilderAnalytics() {
  return useQuery({
    queryKey: ['builder-analytics'],
    queryFn: () => apiGet<BuilderAnalyticsData>('/opportunities/builder/analytics'),
    staleTime: 60_000,
  })
}
