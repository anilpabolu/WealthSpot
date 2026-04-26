import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'

export interface BuilderInvestor {
  investmentId: string
  investorId: string
  investorName: string
  investorEmail: string
  investorAvatar: string | null
  opportunityId: string
  opportunityTitle: string
  opportunitySlug: string
  amount: number
  investedAt: string
  status: string
}

export interface BuilderInvestorsData {
  investors: BuilderInvestor[]
  totalInvestors: number
  totalInvested: number
}

export function useBuilderInvestors() {
  return useQuery({
    queryKey: ['builder-investors'],
    queryFn: () => apiGet<BuilderInvestorsData>('/opportunities/builder/investors'),
    staleTime: 30_000,
  })
}

export function useBuilderInvestorsByOpportunity(opportunityId: string | undefined) {
  return useQuery({
    queryKey: ['builder-investors', 'by-opportunity', opportunityId],
    queryFn: () =>
      apiGet<BuilderInvestorsData>('/opportunities/builder/investors', {
        params: { opportunity_id: opportunityId },
      }),
    enabled: !!opportunityId,
    staleTime: 30_000,
  })
}
