import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useUserStore } from '@/stores/user.store'

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return true
    const payload = JSON.parse(atob(parts[1]!))
    return payload.exp * 1000 < Date.now() - 60_000
  } catch {
    return true
  }
}

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
  const token = useUserStore((state) => state.token)
  const isTokenValid = token && !isTokenExpired(token)

  return useQuery<ConsentStatus>({
    queryKey: ['consent_status', token],
    queryFn: async () => {
      const response = await api.get('/consent/status')
      return response.data
    },
    enabled: enabled && !!isTokenValid,
    // Cache the consent status for the session
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  })
}
