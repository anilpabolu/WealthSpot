import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPut } from '@/lib/api'
import { useUserStore } from '@/stores/user.store'

// ── Types ───────────────────────────────────────────────────────────────────

export interface ProfileCompletionStatus {
  profileCompletionPct: number
  sections: Record<string, boolean>
  emailVerified: boolean
  phoneVerified: boolean
  referralCode: string | null
  isComplete: boolean
}

export interface FullProfile {
  id: string
  email: string
  fullName: string | null
  phone: string | null
  avatarUrl: string | null
  role: string
  kycStatus: string

  // Risk profile
  dateOfBirth: string | null
  gender: string | null
  occupation: string | null
  annualIncome: string | null
  investmentExperience: string | null
  riskTolerance: string | null
  investmentHorizon: string | null
  monthlyInvestmentCapacity: string | null

  // Interests
  interests: string[] | null
  preferredCities: string[] | null
  subscriptionTopics: string[] | null

  // Skills
  skills: string[] | null
  weeklyHoursAvailable: string | null
  contributionInterests: string[] | null
  bio: string | null

  // Address
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  state: string | null
  pincode: string | null
  country: string | null

  // Verification
  emailVerified: boolean
  phoneVerified: boolean
  profileCompletionPct: number
  profileCompletedAt: string | null
  referralCode: string | null
}

export interface OtpSendResponse {
  message: string
  channel: string
  expiresInSeconds: number
  delivered: boolean
  devOtp?: string
}

export interface OtpVerifyResponse {
  message: string
  channel: string
  verified: boolean
  profileCompletionPct: number
}

// ── Hooks ───────────────────────────────────────────────────────────────────

export function useProfileCompletionStatus() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  return useQuery<ProfileCompletionStatus>({
    queryKey: ['profile', 'completion'],
    queryFn: () => apiGet<ProfileCompletionStatus>('/profile/completion'),
    enabled: isAuthenticated,
    staleTime: 30_000,
  })
}

export function useFullProfile() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  return useQuery<FullProfile>({
    queryKey: ['profile', 'full'],
    queryFn: () => apiGet<FullProfile>('/profile/full'),
    enabled: isAuthenticated,
    staleTime: 30_000,
  })
}

export function useUpdateProfileSection(section: 1 | 2 | 3 | 4) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPut<FullProfile>(`/profile/section/${section}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      qc.invalidateQueries({ queryKey: ['user', 'me'] })
    },
  })
}

export function useSendOtp() {
  return useMutation({
    mutationFn: (channel: 'email' | 'phone') =>
      apiPost<OtpSendResponse>('/profile/otp/send', { channel }),
  })
}

export function useVerifyOtp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { channel: 'email' | 'phone'; otp: string }) =>
      apiPost<OtpVerifyResponse>('/profile/otp/verify', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      qc.invalidateQueries({ queryKey: ['user', 'me'] })
    },
  })
}

export function useUpdatePhone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (phone: string) =>
      apiPut<{ phone: string; phoneVerified: boolean }>('/profile/phone', { phone }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      qc.invalidateQueries({ queryKey: ['user', 'me'] })
    },
  })
}
