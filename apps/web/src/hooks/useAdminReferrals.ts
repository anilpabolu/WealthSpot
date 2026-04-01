import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'

export interface AdminReferralSummary {
  referrerId: string
  referrerName: string
  referrerEmail: string
  totalReferrals: number
  successfulReferrals: number
  totalRewardEarned: number
  pendingReferrals: number
}

export interface AdminReferralDetail {
  id: string
  referrerName: string
  referrerEmail: string
  refereeName: string
  refereeEmail: string
  referralType: string
  opportunityTitle: string | null
  codeUsed: string
  rewardAmount: number
  firstInvestmentRewarded: boolean
  rewardedAt: string | null
  createdAt: string
  refereeStatus: string          // invested / active / stale
  refereeJoinedAt: string | null
  refereeTotalInvestments: number
}

export function useAdminReferralSummary() {
  return useQuery({
    queryKey: ['admin', 'referrals', 'summary'],
    queryFn: () => apiGet<AdminReferralSummary[]>('/referrals/admin/summary'),
    staleTime: 30_000,
  })
}

export function useAdminReferralDetails(referrerId?: string) {
  return useQuery({
    queryKey: ['admin', 'referrals', 'details', referrerId],
    queryFn: () =>
      apiGet<AdminReferralDetail[]>('/referrals/admin/details', {
        params: {
          ...(referrerId && { referrer_id: referrerId }),
          limit: 100,
        },
      }),
    staleTime: 30_000,
  })
}
