import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

import { apiGet, apiPost } from '@/lib/api'

describe('mobile useOpportunityActions – API layer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Like Status', () => {
    it('fetches like status for an opportunity', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ liked: true, likeCount: 3 })
      const result = await apiGet('/opportunities/opp-1/like-status')
      expect(apiGet).toHaveBeenCalledWith('/opportunities/opp-1/like-status')
      expect(result).toEqual({ liked: true, likeCount: 3 })
    })

    it('handles not-liked status', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ liked: false, likeCount: 0 })
      const result = await apiGet('/opportunities/opp-new/like-status') as { liked: boolean }
      expect(result.liked).toBe(false)
    })
  })

  describe('Toggle Like', () => {
    it('toggles like on', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ liked: true, likeCount: 4 })
      const result = await apiPost('/opportunities/opp-1/like')
      expect(result).toHaveProperty('liked', true)
    })

    it('toggles like off', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ liked: false, likeCount: 3 })
      const result = await apiPost('/opportunities/opp-1/like')
      expect(result).toHaveProperty('liked', false)
    })
  })

  describe('Track Share', () => {
    it('tracks share and returns referral info', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({
        message: 'Share tracked',
        propertyReferralCode: 'MOB-REF',
        referralLink: 'https://wealthspot.in/r/MOB-REF',
      })
      const result = await apiPost('/opportunities/opp-1/share')
      expect(result).toHaveProperty('propertyReferralCode', 'MOB-REF')
    })
  })

  describe('Property Referral Code', () => {
    it('fetches property-level referral code', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ code: 'PREF-123', referralLink: 'https://wealthspot.in/r/PREF-123' })
      const result = await apiGet('/opportunities/opp-1/referral-code')
      expect(result).toHaveProperty('code', 'PREF-123')
    })
  })

  describe('User Activities', () => {
    it('fetches recent user activities', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([
        { id: 'a1', activityType: 'like', resourceType: 'opportunity', resourceId: 'opp-1' },
      ])
      const result = await apiGet('/opportunities/user/activities', { params: { limit: 10 } })
      expect(result).toHaveLength(1)
    })
  })
})
