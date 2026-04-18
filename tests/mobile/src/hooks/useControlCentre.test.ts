/**
 * mobile useControlCentre hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}))

import { apiGet, apiPost, apiPut } from '../lib/api'

describe('mobile useControlCentre – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('Dashboard', () => {
    it('fetches admin dashboard stats', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        totalUsers: 1000,
        roleDistribution: { investor: 850, builder: 120, admin: 30 },
        pendingApprovals: 5,
        totalOpportunities: 45,
        activeConfigs: 12,
      })

      const result = await apiGet<any>('/control-centre/dashboard')
      expect(result.totalUsers).toBe(1000)
      expect(result.pendingApprovals).toBe(5)
    })
  })

  describe('Configs list', () => {
    it('fetches all configs without section filter', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([
        { id: 'cfg1', section: 'general', key: 'max_investments', value: 5, description: null, isActive: true },
      ])
      const result = await apiGet('/control-centre/configs', { params: {} })
      expect(result).toHaveLength(1)
    })

    it('passes section filter', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([])
      await apiGet('/control-centre/configs', { params: { section: 'payments' } })
      expect(apiGet).toHaveBeenCalledWith('/control-centre/configs', { params: { section: 'payments' } })
    })
  })

  describe('Create config', () => {
    it('posts a new config entry', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ id: 'cfg-new', section: 'general', key: 'new_key', value: true })
      await apiPost('/control-centre/configs', { section: 'general', key: 'new_key', value: true })
      expect(apiPost).toHaveBeenCalledWith('/control-centre/configs', expect.objectContaining({ key: 'new_key' }))
    })
  })

  describe('Update config', () => {
    it('puts updated values for a config', async () => {
      vi.mocked(apiPut).mockResolvedValueOnce({ success: true })
      await apiPut('/control-centre/configs/cfg1', { value: 10, is_active: true })
      expect(apiPut).toHaveBeenCalledWith('/control-centre/configs/cfg1', { value: 10, is_active: true })
    })
  })

  describe('Users list', () => {
    it('fetches users with role filter', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([
        { id: 'u1', email: 'a@a.com', fullName: 'Alice', role: 'investor', kycStatus: 'APPROVED', isActive: true, createdAt: '2025-01-01T00:00:00Z' },
      ])
      await apiGet('/control-centre/users', { params: { role: 'investor', page: 1 } })
      expect(apiGet).toHaveBeenCalledWith('/control-centre/users', { params: { role: 'investor', page: 1 } })
    })
  })
})
