import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiGet, apiDelete } from '@/lib/api'
import { useUserStore } from '@/stores/user.store'

export interface KycDocument {
  id: string
  documentType: string
  verificationStatus: string
  createdAt: string
}

export interface UserProfile {
  id: string
  email: string
  fullName?: string
  phone?: string
  avatarUrl?: string
  avatarS3Key?: string
  role: string
  kycStatus: string
  referralCode?: string
  isActive: boolean
  createdAt: string
  kycDocuments: KycDocument[]
  emailVerified?: boolean
  phoneVerified?: boolean
  profileCompletionPct?: number
  hasInvestments: boolean
}

export function useUserProfile() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  return useQuery<UserProfile>({
    queryKey: ['user', 'me'],
    queryFn: () => apiGet<UserProfile>('/auth/me'),
    enabled: isAuthenticated,
    staleTime: 60_000,
  })
}

export function useUploadAvatar() {
  const qc = useQueryClient()
  return useMutation<{ avatarUrl: string; avatarS3Key: string }, Error, File>({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post<{ avatarUrl: string; avatarS3Key: string }>(
        '/uploads/avatar',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user', 'me'] })
    },
  })
}

export function useDeleteAvatar() {
  const qc = useQueryClient()
  return useMutation<void, Error, void>({
    mutationFn: () => apiDelete('/uploads/avatar'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user', 'me'] })
    },
  })
}
