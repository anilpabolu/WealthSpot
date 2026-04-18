/**
 * usePlatformStats hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
}))

import { apiGet } from '@/lib/api'

describe('usePlatformStats – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches platform stats', async () => {
    const stats = {
      totalUsers: 1500,
      totalInvestors: 800,
      totalBuilders: 50,
      totalInvested: 25000000,
      totalProperties: 35,
      totalOpportunities: 20,
      activeOpportunities: 12,
    }
    vi.mocked(apiGet).mockResolvedValueOnce(stats)

    const result = await apiGet('/control-centre/platform-stats')
    expect(apiGet).toHaveBeenCalledWith('/control-centre/platform-stats')
    expect(result.totalUsers).toBe(1500)
    expect(result.totalInvested).toBe(25000000)
  })

  it('handles empty stats', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({
      totalUsers: 0,
      totalInvestors: 0,
      totalBuilders: 0,
      totalInvested: 0,
    })

    const result = await apiGet('/control-centre/platform-stats')
    expect(result.totalUsers).toBe(0)
  })
})
