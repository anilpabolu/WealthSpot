import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api'

export interface CommBinding {
  id: string
  event_name: string
  event_version: number
  channel: string
  template_id: string
  locale: string | null
  priority: number
  enabled: boolean
  quiet_hours_aware: boolean
  audience_rule: unknown
  created_at: string
  updated_at: string
}

interface BindingCreate {
  event_name: string
  event_version?: number
  channel: string
  template_id: string
  locale?: string | null
  audience_rule?: unknown
  priority?: number
  enabled?: boolean
  throttle_rpm?: number | null
  quiet_hours_aware?: boolean
}

interface BindingUpdate {
  template_id?: string
  locale?: string | null
  audience_rule?: unknown
  priority?: number
  enabled?: boolean
  throttle_rpm?: number | null
  quiet_hours_aware?: boolean
}

export function useCommBindings(event_name?: string, channel?: string, skip = 0, limit = 50) {
  return useQuery({
    queryKey: ['comm', 'bindings', event_name, channel, skip, limit],
    queryFn: () =>
      apiGet<CommBinding[]>('/comm/bindings', {
        params: {
          skip,
          limit,
          ...(event_name && { event_name }),
          ...(channel && { channel }),
        },
      }),
    staleTime: 20_000,
  })
}

export function useCreateCommBinding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: BindingCreate) => apiPost<CommBinding>('/comm/bindings', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comm', 'bindings'] }),
    meta: { successMessage: 'Binding created', errorTitle: 'Failed to create binding' },
  })
}

export function useUpdateCommBinding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & BindingUpdate) =>
      apiPatch<CommBinding>(`/comm/bindings/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comm', 'bindings'] }),
    meta: { successMessage: 'Binding updated', errorTitle: 'Failed to update binding' },
  })
}

export function useDeleteCommBinding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/comm/bindings/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comm', 'bindings'] }),
    meta: { successMessage: 'Binding deleted', errorTitle: 'Failed to delete binding' },
  })
}
