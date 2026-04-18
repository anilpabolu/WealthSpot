/**
 * useBuilderInvestors hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
}))

import { apiGet } from '@/lib/api'

const makeInvestor = (overrides = {}) => ({
  investorId: 'inv-1',
  investorName: 'Raj Kumar',
  investorEmail: 'raj@example.com',
  investorAvatar: null,
  opportunityId: 'opp-1',
  opportunityTitle: 'Green Valley',
  opportunitySlug: 'green-valley',
  amount: 50000,
  investedAt: '2025-01-15T00:00:00Z',
  status: 'confirmed',
  ...overrides,
})

describe('useBuilderInvestors – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches builder investors', async () => {
    const data = {
      investors: [makeInvestor(), makeInvestor({ investorId: 'inv-2', investorName: 'Priya' })],
      totalInvestors: 2,
      totalInvested: 100000,
    }
    vi.mocked(apiGet).mockResolvedValueOnce(data)

    const result = await apiGet('/opportunities/builder/investors')
    expect(apiGet).toHaveBeenCalledWith('/opportunities/builder/investors')
    expect((result as any).investors).toHaveLength(2)
    expect((result as any).totalInvested).toBe(100000)
  })

  it('handles empty investors list', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({
      investors: [],
      totalInvestors: 0,
      totalInvested: 0,
    })

    const result = await apiGet('/opportunities/builder/investors')
    expect((result as any).investors).toHaveLength(0)
    expect((result as any).totalInvestors).toBe(0)
  })

  it('maps investor data correctly', async () => {
    const inv = makeInvestor({ amount: 75000, status: 'pending' })
    vi.mocked(apiGet).mockResolvedValueOnce({
      investors: [inv],
      totalInvestors: 1,
      totalInvested: 75000,
    })

    const result = await apiGet('/opportunities/builder/investors')
    expect((result as any).investors[0].amount).toBe(75000)
    expect((result as any).investors[0].status).toBe('pending')
  })
})
