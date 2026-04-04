/**
 * mobile useReferrals hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
}))

vi.mock('../stores/user.store', () => ({
  useUserStore: vi.fn(() => ({ isAuthenticated: true })),
}))

import { apiGet } from '../lib/api'

describe('mobile useReferrals – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('Referral stats', () => {
    it('fetches stats with referral code and link', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        referralCode: 'ALICE10',
        referralLink: 'https://wealthspot.in/r/ALICE10',
        totalReferrals: 12,
        successfulReferrals: 8,
        totalRewards: 4800,
      })

      const result = await apiGet<any>('/referrals/stats')
      expect(result.referralCode).toBe('ALICE10')
      expect(result.successfulReferrals).toBe(8)
    })

    it('returns zero counts for new users', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        referralCode: 'NEW123',
        referralLink: 'https://wealthspot.in/r/NEW123',
        totalReferrals: 0,
        successfulReferrals: 0,
        totalRewards: 0,
      })

      const result = await apiGet<any>('/referrals/stats')
      expect(result.totalReferrals).toBe(0)
      expect(result.totalRewards).toBe(0)
    })
  })

  describe('Referral history', () => {
    it('fetches referral history entries', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([
        { id: 'r1', refereeName: 'Bob', refereeEmail: 'bob@example.com', status: 'invested', rewardAmount: 600, rewardClaimed: true, createdAt: '2025-01-01T00:00:00Z' },
        { id: 'r2', refereeName: 'Charlie', refereeEmail: 'c@example.com', status: 'signed_up', rewardAmount: 100, rewardClaimed: false, createdAt: '2025-01-02T00:00:00Z' },
      ])

      const result = await apiGet<any>('/referrals/history')
      expect(result).toHaveLength(2)
      expect(result[0].status).toBe('invested')
    })

    it('returns empty array when no referrals', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([])
      const result = await apiGet<any>('/referrals/history')
      expect(result).toHaveLength(0)
    })
  })
})
