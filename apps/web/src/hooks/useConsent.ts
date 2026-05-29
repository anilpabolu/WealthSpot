import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

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
  return useQuery<ConsentStatus>({
    queryKey: ['consent_status'],
    queryFn: async () => {
      const response = await api.get('/consent/status')
      return response.data
    },
    enabled,
    // Cache the consent status for the session
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}
