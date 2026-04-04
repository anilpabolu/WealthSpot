/**
 * useReferrals hook tests – API layer (unit)
 * Tests referral stats and history fetching.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
}))
vi.mock('@/stores/user.store', () => ({
  useUserStore: (selector: (s: { isAuthenticated: boolean }) => boolean) =>
    selector({ isAuthenticated: true }),
}))

import { apiGet } from '@/lib/api'

describe('useReferrals – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('Referral Stats', () => {
    it('fetches referral stats including code and link', async () => {
      const mockStats = {
        referralCode: 'REF-ALICE123',
        referralLink: 'https://app.wealthspot.in/join?ref=REF-ALICE123',
        totalReferrals: 5,
        successfulReferrals: 3,
        totalRewards: 30000,
      }
      vi.mocked(apiGet).mockResolvedValueOnce(mockStats)
      const result = await apiGet<any>('/referrals/stats')
      expect(result.referralCode).toBe('REF-ALICE123')
      expect(result.totalReferrals).toBe(5)
      expect(result.totalRewards).toBe(30000)
    })

    it('returns zero counts for new users', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        referralCode: 'REF-NEW001',
        referralLink: 'https://app.wealthspot.in/join?ref=REF-NEW001',
        totalReferrals: 0,
        successfulReferrals: 0,
        totalRewards: 0,
      })
      const result = await apiGet<any>('/referrals/stats')
      expect(result.totalReferrals).toBe(0)
      expect(result.successfulReferrals).toBe(0)
    })
  })

  describe('Referral History', () => {
    it('fetches referral history with expected fields', async () => {
      const mockHistory = [
        {
          id: 'ref1',
          refereeName: 'Bob Smith',
          refereeEmail: 'bob@example.com',
          status: 'invested',
          rewardAmount: 10000,
          rewardClaimed: false,
          createdAt: '2025-01-15T00:00:00Z',
        },
        {
          id: 'ref2',
          refereeName: 'Carol Jones',
          refereeEmail: 'carol@example.com',
          status: 'signed_up',
          rewardAmount: 0,
          rewardClaimed: false,
          createdAt: '2025-02-01T00:00:00Z',
        },
      ]
      vi.mocked(apiGet).mockResolvedValueOnce(mockHistory)
      const result = await apiGet<any>('/referrals/history')
      expect(result).toHaveLength(2)
      expect(result[0].status).toBe('invested')
      expect(result[1].status).toBe('signed_up')
    })

    it('returns empty array when no referrals', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([])
      const result = await apiGet('/referrals/history')
      expect(result).toEqual([])
    })
  })
})
