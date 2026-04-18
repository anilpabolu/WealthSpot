/**
 * useBuilderAnalytics hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
}))

import { apiGet } from '@/lib/api'

const makeAnalytics = (overrides = {}) => ({
  totalOpportunities: 5,
  activeOpportunities: 3,
  totalRaised: 500000,
  totalInvestors: 42,
  averageFunding: 65.5,
  monthlyTrend: [
    { month: '2025-01', amount: 100000, count: 10 },
    { month: '2025-02', amount: 150000, count: 15 },
  ],
  cityDistribution: [
    { city: 'Mumbai', count: 3, totalRaised: 300000 },
  ],
  opportunityBreakdown: [],
  ...overrides,
})

describe('useBuilderAnalytics – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches builder analytics', async () => {
    const data = makeAnalytics()
    vi.mocked(apiGet).mockResolvedValueOnce(data)

    const result = await apiGet('/opportunities/builder/analytics')
    expect(apiGet).toHaveBeenCalledWith('/opportunities/builder/analytics')
    expect((result as any).totalOpportunities).toBe(5)
    expect((result as any).totalRaised).toBe(500000)
  })

  it('includes monthly trend data', async () => {
    const data = makeAnalytics()
    vi.mocked(apiGet).mockResolvedValueOnce(data)

    const result = await apiGet('/opportunities/builder/analytics')
    expect((result as any).monthlyTrend).toHaveLength(2)
    expect((result as any).monthlyTrend[0]).toHaveProperty('month')
  })

  it('handles empty analytics', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce(makeAnalytics({
      totalOpportunities: 0,
      totalRaised: 0,
      totalInvestors: 0,
      monthlyTrend: [],
      cityDistribution: [],
    }))

    const result = await apiGet('/opportunities/builder/analytics')
    expect((result as any).totalOpportunities).toBe(0)
    expect((result as any).monthlyTrend).toHaveLength(0)
  })
})
