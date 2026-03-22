import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPut } from '@/lib/api'
import { useUserStore } from '@/stores/user.store'

// Keys are camelCase because the API response interceptor converts snake→camel
export interface NotificationPreferences {
  investmentConfirmations: boolean
  rentalIncome: boolean
  propertyUpdates: boolean
  newProperties: boolean
  communityActivity: boolean
  marketingEmails: boolean
}

// Map camelCase frontend keys → snake_case backend keys
const toSnake: Record<string, string> = {
  investmentConfirmations: 'investment_confirmations',
  rentalIncome: 'rental_income',
  propertyUpdates: 'property_updates',
  newProperties: 'new_properties',
  communityActivity: 'community_activity',
  marketingEmails: 'marketing_emails',
}

function toSnakePayload(data: Partial<NotificationPreferences>): Record<string, boolean> {
  const out: Record<string, boolean> = {}
  for (const [k, v] of Object.entries(data)) {
    out[toSnake[k] ?? k] = v as boolean
  }
  return out
}

export function useNotificationPreferences() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  return useQuery<NotificationPreferences>({
    queryKey: ['notifications', 'preferences'],
    queryFn: () => apiGet<NotificationPreferences>('/notifications/preferences'),
    enabled: isAuthenticated,
    staleTime: 60_000,
  })
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<NotificationPreferences>) =>
      apiPut<NotificationPreferences>('/notifications/preferences', toSnakePayload(data)),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: ['notifications', 'preferences'] })
      const prev = qc.getQueryData<NotificationPreferences>(['notifications', 'preferences'])
      if (prev) qc.setQueryData(['notifications', 'preferences'], { ...prev, ...data })
      return { prev }
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev) qc.setQueryData(['notifications', 'preferences'], ctx.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['notifications', 'preferences'] })
    },
  })
}
