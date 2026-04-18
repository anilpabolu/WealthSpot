/**
 * useVaultMetricsConfig hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}))

import { api } from '@/lib/api'

describe('useVaultMetricsConfig – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches vault metrics config', async () => {
    const config = {
      wealth: ['total_invested', 'total_returns', 'irr'],
      opportunity: ['total_invested', 'equity_value'],
      community: ['total_invested'],
    }
    vi.mocked(api.get).mockResolvedValueOnce({ data: config })

    const result = await api.get('/control-centre/vault-metrics-config')
    expect(api.get).toHaveBeenCalledWith('/control-centre/vault-metrics-config')
    expect(result.data.wealth).toContain('total_invested')
    expect(result.data.wealth).toHaveLength(3)
  })

  it('handles empty config', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: {} })
    const result = await api.get('/control-centre/vault-metrics-config')
    expect(Object.keys(result.data)).toHaveLength(0)
  })

  it('returns vault-specific metric keys', async () => {
    const config = { wealth: ['total_invested', 'rental_yield'] }
    vi.mocked(api.get).mockResolvedValueOnce({ data: config })

    const result = await api.get('/control-centre/vault-metrics-config')
    expect(result.data.wealth).toEqual(['total_invested', 'rental_yield'])
  })
})
