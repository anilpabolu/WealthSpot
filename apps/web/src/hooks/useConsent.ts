import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useUserStore } from '@/stores/user.store'

// Stable query key — uses the user's internal UUID, not the JWT string.
// This means the cache is shared across token refreshes in the same session,
// preventing the popup from re-appearing after login/refresh.
export const consentQueryKey = (userId: string | null | undefined) =>
  ['consent_status', userId ?? 'anon'] as const

export interface ConsentPayload {
  context: 'ONBOARDING' | 'EOI'
  consent_version: string
  regulatory_accepted: boolean
  privacy_accepted: boolean
  communication_accepted: boolean
  target_id?: string | null
  location?: string | null
  device_details?: Record<string, unknown> | null
}

export interface ConsentStatus {
  has_consented: boolean
  consent_version: string
}

const getDeviceDetails = () => {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
}

export const useRecordConsent = () => {
  return useMutation({
    mutationFn: async (payload: ConsentPayload) => {
      // Append device details dynamically
      const fullPayload = {
        ...payload,
        device_details: getDeviceDetails()
      }
      
      const response = await api.post('/consent', fullPayload)
      return response.data
    },
  })
}

export const useConsentStatus = (enabled: boolean = true) => {
  const userId = useUserStore((state) => state.user?.id ?? null)
  const isAuthenticated = useUserStore((state) => state.isAuthenticated)

  return useQuery<ConsentStatus>({
    // Key is stable across token refreshes — same user, same cache entry.
    queryKey: consentQueryKey(userId),
    queryFn: async () => {
      const response = await api.get('/consent/status')
      return response.data
    },
    enabled: enabled && isAuthenticated && !!userId,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false,
  })
}
