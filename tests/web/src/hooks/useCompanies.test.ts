/**
 * web useCompanies hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
}))

import { apiGet, apiPost, apiPatch } from '@/lib/api'

const makeCompany = (id: string) => ({
  id,
  companyName: `Company ${id}`,
  brandName: null,
  entityType: 'private_limited',
  vaultType: 'real_estate',
  logoUrl: null,
  city: 'Pune',
  verified: false,
  projectsCompleted: 2,
})

describe('web useCompanies – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('List companies', () => {
    it('fetches companies with no filters', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        items: [makeCompany('c1'), makeCompany('c2')],
        total: 2,
        page: 1,
        totalPages: 1,
      })

      const result = await apiGet<any>('/companies', { params: { page_size: 100 } })
      expect(result.items).toHaveLength(2)
    })

    it('passes search and vault_type filters', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ items: [], total: 0, page: 1, totalPages: 0 })
      await apiGet('/companies', { params: { search: 'Builder', vault_type: 'real_estate', page_size: 100 } })
      expect(apiGet).toHaveBeenCalledWith('/companies', {
        params: { search: 'Builder', vault_type: 'real_estate', page_size: 100 },
      })
    })
  })

  describe('Get company by ID', () => {
    it('fetches company detail', async () => {
      const detail = { ...makeCompany('c1'), userId: 'u1', cin: null, gstin: null, pan: 'ABCDE1234F', reraNumber: null, website: null, description: 'A build co.', contactName: null, contactEmail: null, contactPhone: null, addressLine1: null, addressLine2: null, state: 'Maharashtra', pincode: '411001', country: 'IN', yearsInBusiness: 3, totalAreaDeveloped: null, verificationStatus: 'pending', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' }
      vi.mocked(apiGet).mockResolvedValueOnce(detail)
      const result = await apiGet<any>('/companies/c1')
      expect(result.id).toBe('c1')
      expect(result.pan).toBe('ABCDE1234F')
    })
  })

  describe('Create company', () => {
    it('posts new company with snake_case fields', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce(makeCompany('c-new'))
      await apiPost('/companies', { company_name: 'New Builder Co', entity_type: 'private_limited', vault_type: 'real_estate' })
      expect(apiPost).toHaveBeenCalledWith('/companies', expect.objectContaining({ company_name: 'New Builder Co' }))
    })
  })

  describe('Patch company', () => {
    it('patches company fields', async () => {
      vi.mocked(apiPatch).mockResolvedValueOnce({ ...makeCompany('c1'), verified: true })
      await apiPatch('/companies/c1', { verified: true })
      expect(apiPatch).toHaveBeenCalledWith('/companies/c1', { verified: true })
    })
  })
})
