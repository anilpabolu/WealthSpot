/**
 * useCompanies – company CRUD hooks.
 * Mirrors web's useCompanies.ts.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '../lib/api'

export interface CompanyItem {
  id: string
  companyName: string
  brandName: string | null
  entityType: string
  logoUrl: string | null
  city: string | null
  verified: boolean
  projectsCompleted: number
}

export interface CompanyDetail extends CompanyItem {
  userId: string | null
  cin: string | null
  gstin: string | null
  pan: string | null
  reraNumber: string | null
  website: string | null
  description: string | null
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  addressLine1: string | null
  addressLine2: string | null
  state: string | null
  pincode: string | null
  country: string
  yearsInBusiness: number | null
  totalAreaDeveloped: string | null
  verificationStatus: string
  createdAt: string
  updatedAt: string
}

interface PaginatedCompanies {
  items: CompanyItem[]
  total: number
  page: number
  totalPages: number
}

export interface CompanyCreatePayload {
  companyName: string
  brandName?: string
  entityType?: string
  cin?: string
  gstin?: string
  pan?: string
  reraNumber?: string
  website?: string
  description?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  pincode?: string
  country?: string
  yearsInBusiness?: number
  projectsCompleted?: number
  totalAreaDeveloped?: string
}

export function useCompanies(search?: string) {
  return useQuery({
    queryKey: ['companies', search],
    queryFn: () =>
      apiGet<PaginatedCompanies>('/companies', {
        params: { ...(search && { search }), page_size: 100 },
      }),
    staleTime: 30_000,
  })
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: ['companies', id],
    queryFn: () => apiGet<CompanyDetail>(`/companies/${id}`),
    enabled: !!id,
  })
}

export function useCreateCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CompanyCreatePayload) =>
      apiPost<CompanyDetail>('/companies', {
        company_name: data.companyName,
        brand_name: data.brandName,
        entity_type: data.entityType || 'private_limited',
        cin: data.cin,
        gstin: data.gstin,
        pan: data.pan,
        rera_number: data.reraNumber,
        website: data.website,
        description: data.description,
        contact_name: data.contactName,
        contact_email: data.contactEmail,
        contact_phone: data.contactPhone,
        address_line1: data.addressLine1,
        address_line2: data.addressLine2,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        country: data.country || 'India',
        years_in_business: data.yearsInBusiness,
        projects_completed: data.projectsCompleted,
        total_area_developed: data.totalAreaDeveloped,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  })
}
