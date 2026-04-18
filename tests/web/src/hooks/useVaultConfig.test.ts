/**
 * useVaultConfig hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}))

import { api } from '@/lib/api'

const makeConfig = (overrides = {}) => ({
  wealthEnabled: true,
  opportunityEnabled: true,
  communityEnabled: false,
  introVideosEnabled: true,
  vaultVideosEnabled: false,
  propertyVideosEnabled: true,
  videoManagementEnabled: false,
  reraDisplayEnabled: true,
  ...overrides,
})

describe('useVaultConfig – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches vault config', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: makeConfig() })

    const result = await api.get('/control-centre/vault-config')
    expect(api.get).toHaveBeenCalledWith('/control-centre/vault-config')
    expect(result.data.wealthEnabled).toBe(true)
    expect(result.data.communityEnabled).toBe(false)
  })

  it('wealth vault always enabled', async () => {
    const config = makeConfig({ wealthEnabled: true })
    vi.mocked(api.get).mockResolvedValueOnce({ data: config })

    const result = await api.get('/control-centre/vault-config')
    expect(result.data.wealthEnabled).toBe(true)
  })

  it('reflects video toggle states', async () => {
    const config = makeConfig({
      introVideosEnabled: false,
      vaultVideosEnabled: true,
    })
    vi.mocked(api.get).mockResolvedValueOnce({ data: config })

    const result = await api.get('/control-centre/vault-config')
    expect(result.data.introVideosEnabled).toBe(false)
    expect(result.data.vaultVideosEnabled).toBe(true)
  })
})
