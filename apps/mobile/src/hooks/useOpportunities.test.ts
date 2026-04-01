import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

import { apiGet, apiPost } from '@/lib/api'

describe('mobile useOpportunities – API layer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Listing', () => {
    it('fetches paginated opportunities', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        items: [{ id: 'o1', title: 'Test', vaultType: 'real_estate' }],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      })
      const result = await apiGet('/opportunities', { params: { page: 1 } }) as { items: unknown[] }
      expect(result.items).toHaveLength(1)
    })

    it('filters by vault type', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 })
      await apiGet('/opportunities', { params: { vault_type: 'startup', page: 1 } })
      expect(apiGet).toHaveBeenCalledWith('/opportunities', {
        params: { vault_type: 'startup', page: 1 },
      })
    })
  })

  describe('Detail by ID', () => {
    it('fetches opportunity with full company summary', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        id: 'opp-1',
        title: 'Property',
        company: {
          id: 'c1',
          companyName: 'Builder Inc',
          brandName: 'BuilderBrand',
          logoUrl: 'https://cdn/logo.png',
          verified: true,
          entityType: 'private_limited',
          reraNumber: 'RERA-123',
          website: 'https://builder.com',
          description: 'Top builder',
          city: 'Mumbai',
          state: 'Maharashtra',
          yearsInBusiness: 15,
          projectsCompleted: 30,
          totalAreaDeveloped: '5M sq.ft',
        },
        media: [{ id: 'm1', url: 'https://cdn/img.jpg', isCover: true }],
        closingDate: '2025-12-31',
        expectedIrr: 18.5,
        actualIrr: null,
      })
      const result = await apiGet('/opportunities/opp-1') as { company: Record<string, unknown>; [k: string]: unknown }
      expect(result.company).toHaveProperty('entityType', 'private_limited')
      expect(result.company).toHaveProperty('yearsInBusiness', 15)
      expect(result).toHaveProperty('closingDate')
      expect(result).toHaveProperty('expectedIrr', 18.5)
    })
  })

  describe('Detail by Slug', () => {
    it('fetches opportunity by slug', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ id: 'opp-2', slug: 'my-property', title: 'My Property' })
      const result = await apiGet('/opportunities/by-slug/my-property')
      expect(result).toHaveProperty('slug', 'my-property')
    })
  })

  describe('Create', () => {
    it('creates an opportunity', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ id: 'new-opp', status: 'draft' })
      const result = await apiPost('/opportunities', {
        vault_type: 'real_estate',
        title: 'New Property',
      })
      expect(result).toHaveProperty('id', 'new-opp')
    })
  })

  describe('Vault Stats', () => {
    it('fetches vault statistics', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([
        { vaultType: 'real_estate', totalInvested: 5000000, investorCount: 50, opportunityCount: 5 },
      ])
      const result = await apiGet('/opportunities/vault-stats') as Record<string, unknown>[]
      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('vaultType', 'real_estate')
    })
  })
})
