import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import { useUserStore } from '@/stores/user.store'

// ── KYC Types ───────────────────────────────────────────────────────────────

export interface KycDocument {
  id: string
  documentType: string
  s3Key: string
  originalFilename: string | null
  fileSizeBytes: number | null
  mimeType: string | null
  verificationStatus: string
  rejectionReason: string | null
  downloadUrl: string | null
  createdAt: string
}

export interface KycStatusResponse {
  kycStatus: string
  message: string
}

export interface KycDetailsResponse {
  kycStatus: string
  fullName: string | null
  panNumberMasked: string | null
  dateOfBirth: string | null
  address: string | null
  city: string | null
  pincode: string | null
}

// ── Bank Types ──────────────────────────────────────────────────────────────

export interface BankDetail {
  id: string
  accountHolderName: string
  accountNumberMasked: string
  ifscCode: string
  bankName: string
  branchName: string | null
  accountType: string
  isPrimary: boolean
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface BankDetailCreate {
  accountHolderName: string
  accountNumber: string
  ifscCode: string
  bankName: string
  branchName?: string
  accountType?: string
}

export interface BankDetailUpdate {
  accountHolderName?: string
  accountNumber?: string
  ifscCode?: string
  bankName?: string
  branchName?: string
  accountType?: string
}

// ── KYC Hooks ───────────────────────────────────────────────────────────────

export function useKycStatus() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  return useQuery<KycStatusResponse>({
    queryKey: ['kyc', 'status'],
    queryFn: () => apiGet<KycStatusResponse>('/kyc/status'),
    enabled: isAuthenticated,
    staleTime: 30_000,
  })
}

export function useKycDetails() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  return useQuery<KycDetailsResponse>({
    queryKey: ['kyc', 'details'],
    queryFn: () => apiGet<KycDetailsResponse>('/kyc/details'),
    enabled: isAuthenticated,
    staleTime: 30_000,
  })
}

export function useKycDocuments() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  return useQuery<KycDocument[]>({
    queryKey: ['kyc', 'documents'],
    queryFn: () => apiGet<KycDocument[]>('/kyc/documents'),
    enabled: isAuthenticated,
    staleTime: 30_000,
  })
}

export function useSubmitKycDetails() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      fullName: string
      panNumber: string
      dateOfBirth: string
      address: string
      city: string
      pincode: string
    }) =>
      apiPost<KycStatusResponse>('/kyc/submit', {
        full_name: data.fullName,
        pan_number: data.panNumber.toUpperCase(),
        date_of_birth: data.dateOfBirth,
        address: data.address,
        city: data.city,
        pincode: data.pincode,
      }),
    onSuccess: () => {
      // Don't invalidate ['kyc'] here — it would refetch status as 'in_progress'
      // and disrupt the multi-step wizard flow. The final useSubmitKycForReview
      // invalidates ['kyc'] after all steps are done.
      qc.invalidateQueries({ queryKey: ['user', 'me'] })
    },
  })
}

export function useUploadKycDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ documentType, file }: { documentType: string; file: File }) => {
      const formData = new FormData()
      formData.append('file', file)
      const resp = await api.post<KycDocument>(
        `/kyc/documents/upload?document_type=${encodeURIComponent(documentType)}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } } as any,
      )
      return resp.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kyc', 'documents'] })
      qc.invalidateQueries({ queryKey: ['user', 'me'] })
    },
  })
}

export function useDeleteKycDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (documentId: string) => apiDelete(`/kyc/documents/${documentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kyc', 'documents'] })
    },
  })
}

export function useSubmitKycForReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiPost<KycStatusResponse>('/kyc/submit-for-review'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kyc'] })
      qc.invalidateQueries({ queryKey: ['user', 'me'] })
    },
  })
}

// ── Bank Detail Hooks ───────────────────────────────────────────────────────

export function useBankDetails() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  return useQuery<BankDetail[]>({
    queryKey: ['bank', 'details'],
    queryFn: () => apiGet<BankDetail[]>('/bank'),
    enabled: isAuthenticated,
    staleTime: 30_000,
  })
}

export function useCreateBankDetail() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: BankDetailCreate) =>
      apiPost<BankDetail>('/bank', {
        account_holder_name: data.accountHolderName,
        account_number: data.accountNumber,
        ifsc_code: data.ifscCode.toUpperCase(),
        bank_name: data.bankName,
        branch_name: data.branchName,
        account_type: data.accountType ?? 'savings',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank', 'details'] })
    },
  })
}

export function useUpdateBankDetail() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BankDetailUpdate }) => {
      const payload: Record<string, string | undefined> = {}
      if (data.accountHolderName !== undefined) payload.account_holder_name = data.accountHolderName
      if (data.accountNumber !== undefined) payload.account_number = data.accountNumber
      if (data.ifscCode !== undefined) payload.ifsc_code = data.ifscCode
      if (data.bankName !== undefined) payload.bank_name = data.bankName
      if (data.branchName !== undefined) payload.branch_name = data.branchName
      if (data.accountType !== undefined) payload.account_type = data.accountType
      return apiPut<BankDetail>(`/bank/${id}`, payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank', 'details'] })
    },
  })
}

export function useDeleteBankDetail() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/bank/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank', 'details'] })
    },
  })
}
