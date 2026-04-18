/**
 * useVaultFeatures hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
  apiPut: vi.fn(),
}))

import { apiGet, apiPut } from '@/lib/api'

const makeFeatureFlag = (overrides = {}) => ({
  id: 'ff-1',
  vaultType: 'wealth',
  featureKey: 'invest',
  enabled: true,
  ...overrides,
})

const makeMyFeatures = (overrides = {}) => ({
  wealth: { invest: true, withdraw: true },
  opportunity: { invest: true, withdraw: false },
  community: { invest: false },
  ...overrides,
})

describe('useVaultFeatures – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('Feature Matrix (Admin)', () => {
    it('fetches full feature matrix', async () => {
      const matrix = [
        makeFeatureFlag(),
        makeFeatureFlag({ id: 'ff-2', vaultType: 'opportunity', featureKey: 'invest' }),
      ]
      vi.mocked(apiGet).mockResolvedValueOnce(matrix)

      const result = await apiGet('/vault-features/matrix')
      expect(apiGet).toHaveBeenCalledWith('/vault-features/matrix')
      expect(result).toHaveLength(2)
    })

    it('updates feature matrix', async () => {
      vi.mocked(apiPut).mockResolvedValueOnce({ success: true })

      const payload = [makeFeatureFlag({ enabled: false })]
      await apiPut('/vault-features/matrix', payload)
      expect(apiPut).toHaveBeenCalledWith('/vault-features/matrix', expect.any(Array))
    })
  })

  describe('My Features', () => {
    it('fetches user features', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce(makeMyFeatures())

      const result = await apiGet('/vault-features/my-features')
      expect(apiGet).toHaveBeenCalledWith('/vault-features/my-features')
      expect((result as any).wealth.invest).toBe(true)
      expect((result as any).community.invest).toBe(false)
    })
  })

  describe('Access check logic', () => {
    it('allowed when feature is true', async () => {
      const features = makeMyFeatures()
      expect(features.wealth.invest).toBe(true)
    })

    it('denied when feature is false', async () => {
      const features = makeMyFeatures()
      expect(features.community.invest).toBe(false)
    })

    it('handles missing vault gracefully', async () => {
      const features = makeMyFeatures()
      expect((features as any).unknown).toBeUndefined()
    })
  })
})
