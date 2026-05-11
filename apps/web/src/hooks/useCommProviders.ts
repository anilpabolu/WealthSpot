import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPatch, apiPost } from '@/lib/api'

export interface CommProvider {
  id: string
  channel: string
  kind: string
  name: string
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ProviderCreate {
  channel: string
  kind: string
  name: string
  config?: Record<string, unknown>
  priority?: number
  is_active?: boolean
  failover_to_id?: string | null
}

interface ProviderUpdate {
  name?: string
  config?: Record<string, unknown>
  priority?: number
  is_active?: boolean
  failover_to_id?: string | null
}

export function useCommProviders(skip = 0, limit = 50) {
  return useQuery({
    queryKey: ['comm', 'providers', skip, limit],
    queryFn: () => apiGet<CommProvider[]>('/comm/providers', { params: { skip, limit } }),
    staleTime: 60_000,
  })
}

export function useCreateCommProvider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ProviderCreate) => apiPost<CommProvider>('/comm/providers', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comm', 'providers'] }),
    meta: { successMessage: 'Provider created', errorTitle: 'Failed to create provider' },
  })
}

export function useUpdateCommProvider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & ProviderUpdate) =>
      apiPatch<CommProvider>(`/comm/providers/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comm', 'providers'] }),
    meta: { successMessage: 'Provider updated', errorTitle: 'Failed to update provider' },
  })
}
