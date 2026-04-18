import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock api module
vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

import { apiGet, apiPost } from '@/lib/api'

describe('useOpportunityActions – API layer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Like Status API', () => {
    it('calls like-status endpoint with correct opportunity id', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ liked: true, likeCount: 5 })
      const result = await apiGet('/opportunities/opp-123/like-status')
      expect(apiGet).toHaveBeenCalledWith('/opportunities/opp-123/like-status')
      expect(result).toEqual({ liked: true, likeCount: 5 })
    })

    it('returns unliked status for new users', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ liked: false, likeCount: 0 })
      const result = await apiGet('/opportunities/opp-new/like-status')
      expect(result).toEqual({ liked: false, likeCount: 0 })
    })
  })

  describe('Toggle Like API', () => {
    it('posts to like endpoint and returns toggled status', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ liked: true, likeCount: 6 })
      const result = await apiPost('/opportunities/opp-123/like')
      expect(apiPost).toHaveBeenCalledWith('/opportunities/opp-123/like')
      expect(result).toEqual({ liked: true, likeCount: 6 })
    })

    it('toggles from liked to unliked', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ liked: false, likeCount: 4 })
      const result = await apiPost('/opportunities/opp-123/like')
      expect(result).toEqual({ liked: false, likeCount: 4 })
    })
  })

  describe('Track Share API', () => {
    it('posts share event and returns referral data', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({
        message: 'Share tracked',
        propertyReferralCode: 'REF-ABC',
        referralLink: 'https://wealthspot.in/r/REF-ABC',
      })
      const result = await apiPost('/opportunities/opp-123/share')
      expect(apiPost).toHaveBeenCalledWith('/opportunities/opp-123/share')
      expect(result).toHaveProperty('propertyReferralCode', 'REF-ABC')
    })
  })

  describe('Property Referral Code API', () => {
    it('fetches referral code for opportunity', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        code: 'PROP-XYZ',
        referralLink: 'https://wealthspot.in/r/PROP-XYZ',
      })
      const result = await apiGet('/opportunities/opp-123/referral-code')
      expect(result).toHaveProperty('code', 'PROP-XYZ')
    })
  })

  describe('User Activities API', () => {
    it('fetches user activities with limit param', async () => {
      const activities = [
        { id: 'a1', activityType: 'like', resourceType: 'opportunity', resourceId: 'opp-1', resourceTitle: 'Test', resourceSlug: 'test', createdAt: '2025-01-01' },
        { id: 'a2', activityType: 'share', resourceType: 'opportunity', resourceId: 'opp-2', resourceTitle: 'Test2', resourceSlug: 'test2', createdAt: '2025-01-02' },
      ]
      vi.mocked(apiGet).mockResolvedValueOnce(activities)
      const result = await apiGet('/opportunities/user/activities', { params: { limit: 20 } })
      expect(apiGet).toHaveBeenCalledWith('/opportunities/user/activities', { params: { limit: 20 } })
      expect(result).toHaveLength(2)
    })
  })
})
