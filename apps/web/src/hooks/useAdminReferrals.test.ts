/**
 * web useAdminReferrals hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
}))

import { apiGet } from '@/lib/api'

describe('web useAdminReferrals – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('Admin referral summary', () => {
    it('fetches all referrers summary', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([
        { referrerId: 'u1', referrerName: 'Alice', referrerEmail: 'alice@example.com', totalReferrals: 12, successfulReferrals: 8, totalRewardEarned: 4800, pendingReferrals: 4 },
        { referrerId: 'u2', referrerName: 'Bob', referrerEmail: 'bob@example.com', totalReferrals: 3, successfulReferrals: 2, totalRewardEarned: 1200, pendingReferrals: 1 },
      ])

      const result = await apiGet<any>('/referrals/admin/summary')
      expect(result).toHaveLength(2)
      expect(result[0].successfulReferrals).toBe(8)
    })

    it('returns empty summary when no referrals exist', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([])
      const result = await apiGet<any>('/referrals/admin/summary')
      expect(result).toHaveLength(0)
    })
  })

  describe('Admin referral details', () => {
    it('fetches all details without filter', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([
        { id: 'r1', referrerName: 'Alice', referrerEmail: 'alice@example.com', refereeName: 'Charlie', refereeEmail: 'c@example.com', referralType: 'investment', opportunityTitle: 'Emerald Heights', codeUsed: 'ALICE10', rewardAmount: 600, firstInvestmentRewarded: true, rewardedAt: '2025-01-05T00:00:00Z', createdAt: '2025-01-01T00:00:00Z', refereeStatus: 'invested', refereeJoinedAt: '2025-01-02T00:00:00Z', refereeTotalInvestments: 1 },
      ])

      const result = await apiGet<any>('/referrals/admin/details', { params: { limit: 100 } })
      expect(result).toHaveLength(1)
      expect(result[0].refereeStatus).toBe('invested')
    })

    it('passes referrer_id filter when provided', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([])
      await apiGet('/referrals/admin/details', { params: { referrer_id: 'u1', limit: 100 } })
      expect(apiGet).toHaveBeenCalledWith('/referrals/admin/details', { params: { referrer_id: 'u1', limit: 100 } })
    })
  })
})
