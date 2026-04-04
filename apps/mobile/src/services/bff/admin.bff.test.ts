/**
 * mobile adminBff tests – functional
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}))

import { apiGet, apiPost, apiPut } from '../../lib/api'
import { mobileAdminBff } from './admin.bff'

const mockStats = {
  totalUsers: 1000,
  totalInvestors: 850,
  totalBuilders: 120,
  totalProperties: 45,
  activeProperties: 30,
  totalInvested: 50000000,
  totalTransactions: 380,
  kycPendingCount: 12,
}

describe('mobile adminBff functional tests', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('getDashboard', () => {
    it('fetches stats, pendingKyc, pendingProperties, and recentActivity in parallel', async () => {
      vi.mocked(apiGet)
        .mockResolvedValueOnce(mockStats)
        .mockResolvedValueOnce([{ userId: 'u1', fullName: 'Bob', email: 'b@b.com', kycStatus: 'PENDING', documentCount: 2, submittedAt: '2025-01-01T00:00:00Z' }])
        .mockResolvedValueOnce([{ id: 'p1', title: 'Opp A', builderName: 'Builder X', city: 'Mumbai', targetAmount: 10000000, submittedAt: '2025-01-01T00:00:00Z' }])
        .mockResolvedValueOnce([{ action: 'KYC_SUBMITTED', resourceType: 'user', resourceId: 'u1', actorName: 'Bob', createdAt: '2025-01-01T00:00:00Z' }])

      const result = await mobileAdminBff.getDashboard()

      expect(apiGet).toHaveBeenCalledTimes(4)
      expect(apiGet).toHaveBeenCalledWith('/admin/stats')
      expect(apiGet).toHaveBeenCalledWith('/admin/kyc/pending', { params: { limit: 10 } })
      expect(apiGet).toHaveBeenCalledWith('/admin/properties/pending', { params: { limit: 10 } })
      expect(apiGet).toHaveBeenCalledWith('/admin/audit-logs', { params: { limit: 15 } })

      expect(result.stats.totalUsers).toBe(1000)
      expect(result.pendingKyc).toHaveLength(1)
      expect(result.pendingProperties).toHaveLength(1)
      expect(result.recentActivity).toHaveLength(1)
    })
  })

  describe('approveKyc / rejectKyc', () => {
    it('calls approve endpoint', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ success: true })
      await mobileAdminBff.approveKyc('u1')
      expect(apiPost).toHaveBeenCalledWith('/admin/kyc/u1/approve')
    })

    it('calls reject endpoint with reason', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ success: true })
      await mobileAdminBff.rejectKyc('u1', 'Blurry image')
      expect(apiPost).toHaveBeenCalledWith('/admin/kyc/u1/reject', { reason: 'Blurry image' })
    })
  })

  describe('approveProperty / rejectProperty', () => {
    it('calls approve property endpoint', async () => {
      vi.mocked(apiPut).mockResolvedValueOnce({ success: true })
      await mobileAdminBff.approveProperty('p1')
      expect(apiPut).toHaveBeenCalledWith('/admin/properties/p1/approve')
    })

    it('calls reject property endpoint with reason', async () => {
      vi.mocked(apiPut).mockResolvedValueOnce({ success: true })
      await mobileAdminBff.rejectProperty('p1', 'Missing RERA')
      expect(apiPut).toHaveBeenCalledWith('/admin/properties/p1/reject', { reason: 'Missing RERA' })
    })
  })
})
