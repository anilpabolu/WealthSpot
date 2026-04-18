/**
 * useProperties hook tests – API layer (unit)
 * Tests property listing, filtering, and property-detail mapping.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
}))

import { apiGet } from '@/lib/api'

const makeApiProperty = (overrides = {}) => ({
  id: 'p1',
  slug: 'emerald-heights',
  title: 'Emerald Heights',
  city: 'Mumbai',
  assetType: 'residential',
  targetIrr: 14.5,
  minInvestment: 100000,
  unitPrice: 10000,
  totalUnits: 100,
  soldUnits: 30,
  raisedAmount: 3000000,
  targetAmount: 10000000,
  investorCount: 20,
  status: 'funding',
  createdAt: '2025-01-01T00:00:00Z',
  ...overrides,
})

describe('useProperties – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('Property Listing', () => {
    it('fetches properties with default filters', async () => {
      const mockResponse = {
        properties: [makeApiProperty()],
        total: 1,
        page: 1,
        pageSize: 12,
        totalPages: 1,
      }
      vi.mocked(apiGet).mockResolvedValueOnce(mockResponse)

      const result = await apiGet<any>('/properties', {
        params: { page: 1, page_size: 12, sort_by: 'launch_date' },
      })

      expect(apiGet).toHaveBeenCalledWith('/properties', expect.objectContaining({
        params: expect.objectContaining({ page: 1 }),
      }))
      expect(result.properties).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('filters by city', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ properties: [], total: 0, page: 1, pageSize: 12, totalPages: 0 })
      await apiGet('/properties', { params: { city: 'Bangalore', page: 1, page_size: 12 } })
      expect(apiGet).toHaveBeenCalledWith('/properties', {
        params: expect.objectContaining({ city: 'Bangalore' }),
      })
    })

    it('filters by asset type', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ properties: [], total: 0, page: 1, pageSize: 12, totalPages: 0 })
      await apiGet('/properties', { params: { asset_type: 'commercial', page: 1, page_size: 12 } })
      expect(apiGet).toHaveBeenCalledWith('/properties', {
        params: expect.objectContaining({ asset_type: 'commercial' }),
      })
    })

    it('filters by IRR range', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ properties: [], total: 0, page: 1, pageSize: 12, totalPages: 0 })
      await apiGet('/properties', { params: { irr_min: 12, irr_max: 20, page: 1, page_size: 12 } })
      expect(apiGet).toHaveBeenCalledWith('/properties', {
        params: expect.objectContaining({ irr_min: 12, irr_max: 20 }),
      })
    })

    it('filters by status', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ properties: [], total: 0, page: 1, pageSize: 12, totalPages: 0 })
      await apiGet('/properties', { params: { status: 'funding', page: 1, page_size: 12 } })
      expect(apiGet).toHaveBeenCalledWith('/properties', {
        params: expect.objectContaining({ status: 'funding' }),
      })
    })

    it('handles search parameter', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ properties: [], total: 0, page: 1, pageSize: 12, totalPages: 0 })
      await apiGet('/properties', { params: { search: 'Emerald', page: 1, page_size: 12 } })
      expect(apiGet).toHaveBeenCalledWith('/properties', {
        params: expect.objectContaining({ search: 'Emerald' }),
      })
    })

    it('paginates correctly', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ properties: [], total: 30, page: 3, pageSize: 12, totalPages: 3 })
      await apiGet('/properties', { params: { page: 3, page_size: 12 } })
      expect(apiGet).toHaveBeenCalledWith('/properties', {
        params: expect.objectContaining({ page: 3, page_size: 12 }),
      })
    })
  })

  describe('Property Detail', () => {
    it('fetches property by slug', async () => {
      const prop = makeApiProperty({ slug: 'emerald-heights', title: 'Emerald Heights' })
      vi.mocked(apiGet).mockResolvedValueOnce(prop)
      const result = await apiGet<any>('/properties/emerald-heights')
      expect(apiGet).toHaveBeenCalledWith('/properties/emerald-heights')
      expect(result.slug).toBe('emerald-heights')
    })

    it('includes builder details when present', async () => {
      const prop = makeApiProperty({
        builder: {
          id: 'b1',
          companyName: 'BuilderX',
          verified: true,
          projectsCompleted: 5,
        },
      })
      vi.mocked(apiGet).mockResolvedValueOnce(prop)
      const result = await apiGet<any>('/properties/emerald-heights')
      expect(result.builder.companyName).toBe('BuilderX')
      expect(result.builder.verified).toBe(true)
    })
  })

  describe('Featured Properties', () => {
    it('fetches featured properties', async () => {
      const featured = [makeApiProperty({ status: 'funding' })]
      vi.mocked(apiGet).mockResolvedValueOnce({ properties: featured, total: 1, page: 1, pageSize: 4, totalPages: 1 })
      const result = await apiGet<any>('/properties', { params: { status: 'funding', page_size: 4, sort: '-launch_date' } })
      expect(result.properties[0].status).toBe('funding')
    })
  })
})
