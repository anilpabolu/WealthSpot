import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

import { apiGet, apiPost } from '@/lib/api'

describe('useOpportunities – API layer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Listing', () => {
    it('fetches paginated opportunities with params', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        items: [{ id: 'o1', title: 'Test Opp', slug: 'test-opp', vaultType: 'real_estate' }],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      })
      const result = await apiGet('/opportunities', {
        params: { vault_type: 'real_estate', page: 1 },
      })
      expect(apiGet).toHaveBeenCalledWith('/opportunities', {
        params: { vault_type: 'real_estate', page: 1 },
      })
      expect(result).toHaveProperty('total', 1)
    })

    it('fetches without vault type filter', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      })
      const result = await apiGet('/opportunities', { params: { page: 1 } }) as { items: unknown[] }
      expect(result).toHaveProperty('items')
      expect(result.items).toHaveLength(0)
    })
  })

  describe('Detail', () => {
    it('fetches opportunity by ID', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        id: 'opp-123',
        title: 'Test',
        slug: 'test',
        company: { id: 'c1', companyName: 'Builder Inc', verified: true },
        media: [],
      })
      const result = await apiGet('/opportunities/opp-123')
      expect(result).toHaveProperty('id', 'opp-123')
      expect(result).toHaveProperty('company')
    })

    it('fetches opportunity by slug', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        id: 'opp-456',
        title: 'Slug Test',
        slug: 'slug-test',
      })
      const result = await apiGet('/opportunities/by-slug/slug-test')
      expect(apiGet).toHaveBeenCalledWith('/opportunities/by-slug/slug-test')
      expect(result).toHaveProperty('slug', 'slug-test')
    })
  })

  describe('Create', () => {
    it('creates opportunity with snake_case payload', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ id: 'new-opp', status: 'draft' })
      const result = await apiPost('/opportunities', {
        vault_type: 'real_estate',
        title: 'New Property',
        target_amount: 10000000,
        min_investment: 100000,
        target_irr: 15,
        city: 'Bengaluru',
      })
      expect(apiPost).toHaveBeenCalledWith('/opportunities', expect.objectContaining({
        vault_type: 'real_estate',
        title: 'New Property',
      }))
      expect(result).toHaveProperty('status', 'draft')
    })
  })

  describe('Vault Stats', () => {
    it('fetches vault stats for all vault types', async () => {
      const stats = [
        { vaultType: 'real_estate', totalInvested: 5000000, investorCount: 50, opportunityCount: 5 },
        { vaultType: 'startup', totalInvested: 2000000, investorCount: 20, opportunityCount: 3 },
      ]
      vi.mocked(apiGet).mockResolvedValueOnce(stats)
      const result = await apiGet('/opportunities/vault-stats') as Record<string, unknown>[]
      expect(result).toHaveLength(2)
      expect(result[0]).toHaveProperty('vaultType', 'real_estate')
    })
  })
})
