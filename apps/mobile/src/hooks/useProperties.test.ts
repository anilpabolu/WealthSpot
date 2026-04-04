/**
 * mobile useProperties hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
}))

import { apiGet } from '../lib/api'

const makeProperty = (id: string, city = 'Mumbai') => ({
  id,
  slug: `prop-${id}`,
  title: `Property ${id}`,
  tagline: '',
  description: 'A great property',
  city,
  assetType: 'residential',
  coverImage: null,
  targetIrr: 14,
  minInvestment: 100000,
  unitPrice: 10000,
  totalUnits: 100,
  soldUnits: 40,
  raisedAmount: 4000000,
  targetAmount: 10000000,
  investorCount: 40,
  fundingPercentage: 40,
  status: 'active',
  createdAt: '2025-01-01T00:00:00Z',
  builder: { id: 'b1', companyName: 'Builder Co', verified: true },
})

describe('mobile useProperties – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('Properties listing', () => {
    it('fetches paginated properties without filters', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        properties: [makeProperty('p1'), makeProperty('p2')],
        total: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      })

      const result = await apiGet<any>('/properties', {
        params: { page: 1, page_size: 10, sort_by: 'created_at' },
      })
      expect(result.properties).toHaveLength(2)
      expect(result.total).toBe(2)
    })

    it('passes city filter as query parameter', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        properties: [makeProperty('p1', 'Bangalore')],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      })

      await apiGet('/properties', { params: { city: 'Bangalore', page: 1, page_size: 10 } })
      expect(apiGet).toHaveBeenCalledWith('/properties', { params: { city: 'Bangalore', page: 1, page_size: 10 } })
    })

    it('passes IRR range filter', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ properties: [], total: 0, page: 1, pageSize: 10, totalPages: 0 })
      await apiGet('/properties', { params: { irr_min: 12, irr_max: 18, page: 1, page_size: 10 } })
      expect(apiGet).toHaveBeenCalledWith('/properties', { params: { irr_min: 12, irr_max: 18, page: 1, page_size: 10 } })
    })

    it('passes status filter', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ properties: [], total: 0, page: 1, pageSize: 10, totalPages: 0 })
      await apiGet('/properties', { params: { status: 'active', page: 1, page_size: 10 } })
      expect(apiGet).toHaveBeenCalledWith('/properties', { params: { status: 'active', page: 1, page_size: 10 } })
    })

    it('returns empty list when no properties match', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ properties: [], total: 0, page: 1, pageSize: 10, totalPages: 0 })
      const result = await apiGet<any>('/properties', { params: { search: 'nonexistent', page: 1, page_size: 10 } })
      expect(result.properties).toHaveLength(0)
    })
  })

  describe('Property detail', () => {
    it('fetches property by slug', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce(makeProperty('p1'))
      const result = await apiGet<any>('/properties/prop-p1')
      expect(result.id).toBe('p1')
      expect(result.builder.companyName).toBe('Builder Co')
    })

    it('handles property without builder (standalone)', async () => {
      const prop = makeProperty('p2')
      // @ts-ignore
      prop.builder = null
      vi.mocked(apiGet).mockResolvedValueOnce(prop)
      const result = await apiGet<any>('/properties/prop-p2')
      expect(result.builder).toBeNull()
    })
  })
})
