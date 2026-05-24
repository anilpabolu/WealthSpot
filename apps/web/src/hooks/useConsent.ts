import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface ConsentPayload {
  consent_type: 'LOGIN' | 'EOI'
  consented: boolean
  target_id?: string | null
  location?: string | null
  device_details?: Record<string, unknown> | null
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
