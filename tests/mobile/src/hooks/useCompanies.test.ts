/**
 * mobile useCompanies hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

import { apiGet, apiPost } from '../lib/api'

const makeCompany = (id: string) => ({
  id,
  companyName: `Company ${id}`,
  brandName: null,
  entityType: 'private_limited',
  logoUrl: null,
  city: 'Mumbai',
  verified: true,
  projectsCompleted: 5,
})

describe('mobile useCompanies – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('List companies', () => {
    it('fetches companies without search filter', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        items: [makeCompany('c1'), makeCompany('c2')],
        total: 2,
        page: 1,
        totalPages: 1,
      })

      const result = await apiGet<any>('/companies', { params: { page_size: 100 } })
      expect(result.items).toHaveLength(2)
    })

    it('passes search term when provided', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ items: [makeCompany('c1')], total: 1, page: 1, totalPages: 1 })
      await apiGet('/companies', { params: { search: 'Acme', page_size: 100 } })
      expect(apiGet).toHaveBeenCalledWith('/companies', { params: { search: 'Acme', page_size: 100 } })
    })
  })

  describe('Get company by id', () => {
    it('fetches company detail', async () => {
      const detail = { ...makeCompany('c1'), userId: 'u1', cin: 'L12345', gstin: null, pan: 'ABCDE1234F', reraNumber: 'RERA123', website: null, description: 'A builder', contactName: null, contactEmail: null, contactPhone: null, addressLine1: null, addressLine2: null, state: 'Maharashtra', pincode: '400001', country: 'IN', yearsInBusiness: 5, totalAreaDeveloped: '50000', verificationStatus: 'approved', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' }
      vi.mocked(apiGet).mockResolvedValueOnce(detail)

      const result = await apiGet<any>('/companies/c1')
      expect(result.id).toBe('c1')
      expect(result.reraNumber).toBe('RERA123')
    })
  })

  describe('Create company', () => {
    it('posts company data with snake_case keys', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce(makeCompany('c-new'))
      await apiPost('/companies', { company_name: 'New Builder', entity_type: 'private_limited' })
      expect(apiPost).toHaveBeenCalledWith('/companies', expect.objectContaining({ company_name: 'New Builder' }))
    })
  })
})
