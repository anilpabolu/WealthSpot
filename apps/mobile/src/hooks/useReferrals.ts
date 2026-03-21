/**
 * useReferrals – referral stats & history hooks.
 * Mirrors web's useReferrals.ts.
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'
import { useUserStore } from '../stores/user.store'

export interface ReferralStats {
  referralCode: string
  referralLink: string
  totalReferrals: number
  successfulReferrals: number
  totalRewards: number
}

export interface ReferralHistoryItem {
  id: string
  refereeName: string
  refereeEmail: string
  status: 'invested' | 'signed_up'
  rewardAmount: number
  rewardClaimed: boolean
  createdAt: string
}

export function useReferralStats() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  return useQuery<ReferralStats>({
    queryKey: ['referrals', 'stats'],
    queryFn: () => apiGet<ReferralStats>('/referrals/stats'),
    enabled: isAuthenticated,
    staleTime: 30_000,
  })
}

export function useReferralHistory() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  return useQuery<ReferralHistoryItem[]>({
    queryKey: ['referrals', 'history'],
    queryFn: () => apiGet<ReferralHistoryItem[]>('/referrals/history'),
    enabled: isAuthenticated,
    staleTime: 30_000,
  })
}
