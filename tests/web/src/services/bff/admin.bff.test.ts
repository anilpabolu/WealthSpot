import { beforeEach, describe, expect, it, vi } from 'vitest'
import { adminBff } from '@/services/bff/admin.bff'
import { apiGet, apiPost, apiPut } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}))

describe('adminBff', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getDashboard', () => {
    it('aggregates stats, pending KYC, pending properties, and activity', async () => {
      const mockStats = { total_users: 100, total_investors: 80 }
      const mockKyc = [{ user_id: 'u1', full_name: 'User 1' }]
      const mockProps = [{ id: 'p1', title: 'Prop 1' }]
      const mockActivity = [{ action: 'login', actor_name: 'Admin' }]

      vi.mocked(apiGet)
        .mockResolvedValueOnce(mockStats)
        .mockResolvedValueOnce(mockKyc)
        .mockResolvedValueOnce(mockProps)
        .mockResolvedValueOnce(mockActivity)

      const result = await adminBff.getDashboard()

      expect(apiGet).toHaveBeenCalledWith('/admin/stats')
      expect(apiGet).toHaveBeenCalledWith('/admin/kyc/pending', { params: { limit: 10 } })
      expect(apiGet).toHaveBeenCalledWith('/admin/properties/pending', { params: { limit: 10 } })
      expect(apiGet).toHaveBeenCalledWith('/admin/audit-logs', { params: { limit: 15 } })

      expect(result.stats).toEqual(mockStats)
      expect(result.pendingKyc).toEqual(mockKyc)
      expect(result.pendingProperties).toEqual(mockProps)
      expect(result.recentActivity).toEqual(mockActivity)
    })
  })

  describe('approveKyc', () => {
    it('calls approve endpoint', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ success: true })
      const result = await adminBff.approveKyc('u1')
      expect(apiPost).toHaveBeenCalledWith('/admin/kyc/u1/approve')
      expect(result.success).toBe(true)
    })
  })

  describe('rejectKyc', () => {
    it('calls reject endpoint with reason', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ success: true })
      await adminBff.rejectKyc('u1', 'Poor quality')
      expect(apiPost).toHaveBeenCalledWith('/admin/kyc/u1/reject', { reason: 'Poor quality' })
    })
  })

  describe('approveProperty', () => {
    it('calls property approve endpoint', async () => {
      vi.mocked(apiPut).mockResolvedValueOnce({ success: true })
      await adminBff.approveProperty('p1')
      expect(apiPut).toHaveBeenCalledWith('/admin/properties/p1/approve')
    })
  })

  describe('rejectProperty', () => {
    it('calls property reject with reason', async () => {
      vi.mocked(apiPut).mockResolvedValueOnce({ success: true })
      await adminBff.rejectProperty('p1', 'Missing docs')
      expect(apiPut).toHaveBeenCalledWith('/admin/properties/p1/reject', { reason: 'Missing docs' })
    })
  })
})
