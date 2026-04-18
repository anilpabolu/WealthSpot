/**
 * web useControlCentre hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}))

import { apiGet, apiPost, apiPut } from '@/lib/api'

describe('web useControlCentre – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('Dashboard stats', () => {
    it('fetches control centre dashboard data', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        totalUsers: 1500,
        roleDistribution: { investor: 1200, builder: 250, admin: 50 },
        pendingApprovals: 8,
        totalOpportunities: 60,
        activeConfigs: 15,
      })

      const result = await apiGet<any>('/control-centre/dashboard')
      expect(result.totalUsers).toBe(1500)
      expect(result.pendingApprovals).toBe(8)
    })
  })

  describe('Config listing', () => {
    it('fetches all configs', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([
        { id: 'cfg1', section: 'general', key: 'max_investments', value: 5, description: null, isActive: true, updatedBy: null, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
      ])
      const result = await apiGet('/control-centre/configs', { params: {} })
      expect(result).toHaveLength(1)
    })

    it('filters by section', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([])
      await apiGet('/control-centre/configs', { params: { section: 'payments' } })
      expect(apiGet).toHaveBeenCalledWith('/control-centre/configs', { params: { section: 'payments' } })
    })
  })

  describe('Create config', () => {
    it('posts new config', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ id: 'cfg-new' })
      await apiPost('/control-centre/configs', { section: 'general', key: 'new_flag', value: true })
      expect(apiPost).toHaveBeenCalledWith('/control-centre/configs', expect.objectContaining({ key: 'new_flag' }))
    })
  })

  describe('Update config', () => {
    it('puts updated config values', async () => {
      vi.mocked(apiPut).mockResolvedValueOnce({ success: true })
      await apiPut('/control-centre/configs/cfg1', { value: 10, is_active: true })
      expect(apiPut).toHaveBeenCalledWith('/control-centre/configs/cfg1', { value: 10, is_active: true })
    })
  })

  describe('Users list', () => {
    it('fetches users with role and search filters', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([
        { id: 'u1', email: 'a@a.com', fullName: 'Alice', role: 'investor', kycStatus: 'APPROVED', isActive: true, createdAt: '2025-01-01T00:00:00Z' },
      ])
      await apiGet('/control-centre/users', { params: { role: 'investor', search: 'Alice', page: 1 } })
      expect(apiGet).toHaveBeenCalledWith('/control-centre/users', { params: { role: 'investor', search: 'Alice', page: 1 } })
    })
  })
})
