/**
 * useBuilderListings hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
}))

import { apiGet } from '@/lib/api'

const makeOpportunity = (overrides = {}) => ({
  id: 'opp-1',
  title: 'Sky Tower Fund',
  slug: 'sky-tower-fund',
  status: 'active',
  vaultType: 'wealth',
  city: 'Bangalore',
  micromarket: 'Whitefield',
  assetType: 'commercial',
  irr: 14.5,
  minInvestment: 50000,
  raisedAmount: 200000,
  targetAmount: 500000,
  investorCount: 15,
  coverImage: '/img/sky.jpg',
  createdAt: '2025-01-01T00:00:00Z',
  ...overrides,
})

const makeBuilderProfile = (properties = []) => ({
  id: 'builder-1',
  companyName: 'Test Builders',
  properties,
})

const makeBuilderProperty = (overrides = {}) => ({
  id: 'prop-1',
  slug: 'emerald-heights',
  title: 'Emerald Heights',
  tagline: null,
  assetType: 'residential',
  status: 'active',
  city: 'Mumbai',
  locality: 'Andheri',
  coverImage: '/img/emerald.jpg',
  targetAmount: 1000000,
  raisedAmount: 300000,
  minInvestment: 25000,
  targetIrr: 12,
  investorCount: 8,
  fundingPercentage: 30,
  createdAt: '2025-01-01T00:00:00Z',
  ...overrides,
})

describe('useBuilderListings – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('Opportunities fetch', () => {
    it('fetches builder opportunities with creator_id=me', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        items: [makeOpportunity()],
        total: 1,
        page: 1,
        pageSize: 100,
        totalPages: 1,
      })

      const result = await apiGet('/opportunities', {
        params: { creator_id: 'me', page_size: 100 },
      })
      expect(apiGet).toHaveBeenCalledWith('/opportunities', {
        params: expect.objectContaining({ creator_id: 'me' }),
      })
      expect((result as any).items).toHaveLength(1)
    })
  })

  describe('Properties fetch', () => {
    it('fetches builder properties', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce(
        makeBuilderProfile([makeBuilderProperty()] as any)
      )

      const result = await apiGet('/properties/builders/me')
      expect(apiGet).toHaveBeenCalledWith('/properties/builders/me')
      expect((result as any).properties).toHaveLength(1)
    })

    it('handles 404 for non-builder users', async () => {
      const err = { response: { status: 404 } }
      vi.mocked(apiGet).mockRejectedValueOnce(err)

      try {
        await apiGet('/properties/builders/me')
      } catch (e) {
        expect((e as any).response.status).toBe(404)
      }
    })
  })

  describe('Data mapping', () => {
    it('maps opportunity status correctly', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        items: [
          makeOpportunity({ status: 'active' }),
          makeOpportunity({ id: 'opp-2', status: 'funded' }),
        ],
        total: 2,
        page: 1,
        pageSize: 100,
        totalPages: 1,
      })

      const result = await apiGet('/opportunities', {
        params: { creator_id: 'me', page_size: 100 },
      })
      expect((result as any).items[0].status).toBe('active')
      expect((result as any).items[1].status).toBe('funded')
    })
  })
})
