/**
 * mobile profileBff tests – functional
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../lib/api', () => ({
  apiGet: vi.fn(),
  apiPut: vi.fn(),
}))

import { apiGet, apiPut } from '../../lib/api'
import { mobileProfileBff } from './profile.bff'

const mockUser = {
  id: 'u1',
  fullName: 'Alice Smith',
  email: 'alice@example.com',
  phone: '+91 98765 43210',
  avatarUrl: 'https://cdn.example.com/avatar.jpg',
  role: 'investor',
  kycStatus: 'APPROVED',
  referralCode: 'ALICE10',
  wealthPassActive: true,
  createdAt: '2024-01-01T00:00:00Z',
}

describe('mobile profileBff functional tests', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('getProfile', () => {
    it('fetches user, portfolio summary, and referral stats in parallel', async () => {
      vi.mocked(apiGet)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ propertiesCount: 4, totalInvested: 800000 })
        .mockResolvedValueOnce({ totalReferrals: 7 })

      const result = await mobileProfileBff.getProfile()

      expect(apiGet).toHaveBeenCalledWith('/auth/me')
      expect(apiGet).toHaveBeenCalledWith('/investments/portfolio/summary')
      expect(apiGet).toHaveBeenCalledWith('/referrals/stats')

      expect(result.user.fullName).toBe('Alice Smith')
      expect(result.stats.investmentsCount).toBe(4)
      expect(result.stats.totalInvested).toBe(800000)
      expect(result.stats.referralsCount).toBe(7)
    })

    it('returns zero stats for a new user with no investments', async () => {
      vi.mocked(apiGet)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ propertiesCount: 0, totalInvested: 0 })
        .mockResolvedValueOnce({ totalReferrals: 0 })

      const result = await mobileProfileBff.getProfile()

      expect(result.stats.investmentsCount).toBe(0)
      expect(result.stats.totalInvested).toBe(0)
      expect(result.stats.referralsCount).toBe(0)
    })
  })

  describe('updateProfile', () => {
    it('sends PUTs with snake_case keys', async () => {
      vi.mocked(apiPut).mockResolvedValueOnce({ success: true })

      const result = await mobileProfileBff.updateProfile({ fullName: 'Alice Updated', phone: '+91 99999 00000' })

      expect(apiPut).toHaveBeenCalledWith('/auth/me', {
        full_name: 'Alice Updated',
        phone: '+91 99999 00000',
      })
      expect(result).toEqual({ success: true })
    })
  })
})
