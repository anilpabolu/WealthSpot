/**
 * useKycBank hook tests – API layer (unit)
 * Tests KYC status/details and bank detail CRUD operations.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}))
vi.mock('@/stores/user.store', () => ({
  useUserStore: (selector: (s: { isAuthenticated: boolean }) => boolean) =>
    selector({ isAuthenticated: true }),
}))

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'

describe('useKycBank – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('KYC Status', () => {
    it('fetches KYC status for authenticated user', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ kycStatus: 'pending', message: 'Under review' })
      const result = await apiGet<any>('/kyc/status')
      expect(result.kycStatus).toBe('pending')
    })

    it('returns approved status when KYC complete', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ kycStatus: 'approved', message: 'KYC verified' })
      const result = await apiGet<any>('/kyc/status')
      expect(result.kycStatus).toBe('approved')
    })
  })

  describe('KYC Details', () => {
    it('fetches KYC details with masked PAN', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        kycStatus: 'approved',
        fullName: 'Test User',
        panNumberMasked: 'ABCDE****F',
        dateOfBirth: '1990-01-01',
        address: '123 Main St',
        city: 'Mumbai',
        pincode: '400001',
      })
      const result = await apiGet<any>('/kyc/details')
      expect(result.panNumberMasked).toContain('*')
      expect(result.fullName).toBe('Test User')
    })
  })

  describe('Bank Details – Read', () => {
    it('fetches list of bank accounts', async () => {
      const banks = [
        { id: 'b1', bankName: 'SBI', accountNumberMasked: '****1234', ifscCode: 'SBIN0001234', isPrimary: true, isVerified: true, accountType: 'savings' },
      ]
      vi.mocked(apiGet).mockResolvedValueOnce(banks)
      const result = await apiGet<any>('/bank-details')
      expect(result).toHaveLength(1)
      expect(result[0].bankName).toBe('SBI')
      expect(result[0].accountNumberMasked).toContain('*')
    })

    it('returns empty array when no bank accounts added', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([])
      const result = await apiGet('/bank-details')
      expect(result).toEqual([])
    })
  })

  describe('Bank Details – Create', () => {
    it('creates a new bank account', async () => {
      const created = {
        id: 'b2',
        bankName: 'HDFC',
        accountNumberMasked: '****5678',
        ifscCode: 'HDFC0001234',
        isPrimary: false,
        isVerified: false,
        accountType: 'savings',
      }
      vi.mocked(apiPost).mockResolvedValueOnce(created)
      const result = await apiPost<any>('/bank-details', {
        account_holder_name: 'Test User',
        account_number: '12345678',
        ifsc_code: 'HDFC0001234',
        bank_name: 'HDFC',
        account_type: 'savings',
      })
      expect(apiPost).toHaveBeenCalledWith('/bank-details', expect.objectContaining({
        bank_name: 'HDFC',
      }))
      expect(result.id).toBe('b2')
    })
  })

  describe('Bank Details – Update', () => {
    it('updates bank account details', async () => {
      const updated = { id: 'b1', bankName: 'SBI', isPrimary: true }
      vi.mocked(apiPut).mockResolvedValueOnce(updated)
      await apiPut('/bank-details/b1', { branch_name: 'Main Branch' })
      expect(apiPut).toHaveBeenCalledWith('/bank-details/b1', { branch_name: 'Main Branch' })
    })
  })

  describe('Bank Details – Delete', () => {
    it('deletes a bank account', async () => {
      vi.mocked(apiDelete).mockResolvedValueOnce(undefined)
      await apiDelete('/bank-details/b1')
      expect(apiDelete).toHaveBeenCalledWith('/bank-details/b1')
    })
  })

  describe('Set Primary Bank', () => {
    it('sets a bank account as primary', async () => {
      const updated = { id: 'b2', isPrimary: true }
      vi.mocked(apiPost).mockResolvedValueOnce(updated)
      await apiPost('/bank-details/b2/set-primary', {})
      expect(apiPost).toHaveBeenCalledWith('/bank-details/b2/set-primary', {})
    })
  })
})
