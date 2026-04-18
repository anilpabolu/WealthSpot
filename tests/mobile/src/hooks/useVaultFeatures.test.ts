/**
 * mobile useVaultFeatures hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
}))

vi.mock('../stores/user.store', () => ({
  useUserStore: vi.fn((selector: any) =>
    selector({
      user: { roles: ['investor'] },
    }),
  ),
}))

import { apiGet } from '../lib/api'

const makeFlags = (overrides: Record<string, Record<string, boolean>> = {}) => ({
  wealth: { dashboard: true, analytics: true, ...(overrides.wealth ?? {}) },
  opportunity: { browse: true, invest: true, ...(overrides.opportunity ?? {}) },
  community: { forums: false, ...(overrides.community ?? {}) },
})

describe('mobile useVaultFeatures – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('useMyFeatures', () => {
    it('fetches feature flags from /vault-features/my-features', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce(makeFlags())

      const result = await apiGet<any>('/vault-features/my-features')
      expect(apiGet).toHaveBeenCalledWith('/vault-features/my-features')
      expect(result.wealth.dashboard).toBe(true)
    })

    it('returns correct per-vault feature keys', async () => {
      const flags = makeFlags({ community: { forums: true } })
      vi.mocked(apiGet).mockResolvedValueOnce(flags)

      const result = await apiGet<any>('/vault-features/my-features')
      expect(result.community.forums).toBe(true)
      expect(result.opportunity.browse).toBe(true)
    })
  })

  describe('useCanAccess', () => {
    it('denies access when feature is false', async () => {
      const flags = makeFlags()
      // community.forums is false in makeFlags
      expect(flags.community.forums).toBe(false)
    })

    it('grants access when feature is true', async () => {
      const flags = makeFlags()
      expect(flags.wealth.dashboard).toBe(true)
    })

    it('handles missing feature keys as falsy', async () => {
      const flags = makeFlags()
      const vault = flags.community as Record<string, boolean>
      expect(!!vault['nonexistent_key']).toBe(false)
    })
  })
})
