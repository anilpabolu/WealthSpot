/**
 * mobile useVaultConfig hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
}))

import { apiGet } from '@/lib/api'

const fullConfig = {
  wealthVaultEnabled: true,
  opportunityVaultEnabled: true,
  communityVaultEnabled: false,
  introVideosEnabled: true,
  vaultVideosEnabled: false,
  propertyVideosEnabled: true,
  videoManagementEnabled: true,
  reraDisplayEnabled: true,
}

describe('mobile useVaultConfig – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches vault config from control-centre', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce(fullConfig)

    const result = await apiGet<typeof fullConfig>('/control-centre/vault-config')
    expect(apiGet).toHaveBeenCalledWith('/control-centre/vault-config')
    expect(result.wealthVaultEnabled).toBe(true)
    expect(result.communityVaultEnabled).toBe(false)
  })

  it('returns video toggle states correctly', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce(fullConfig)

    const result = await apiGet<typeof fullConfig>('/control-centre/vault-config')
    expect(result.vaultVideosEnabled).toBe(false)
    expect(result.propertyVideosEnabled).toBe(true)
  })

  it('returns all expected config keys', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce(fullConfig)

    const result = await apiGet<typeof fullConfig>('/control-centre/vault-config')
    const keys = Object.keys(result)
    expect(keys).toContain('wealthVaultEnabled')
    expect(keys).toContain('opportunityVaultEnabled')
    expect(keys).toContain('communityVaultEnabled')
    expect(keys).toContain('introVideosEnabled')
    expect(keys).toContain('reraDisplayEnabled')
  })
})
