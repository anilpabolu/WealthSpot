import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPatch, apiPost } from '@/lib/api'

export interface CommEvent {
  id: string
  event_name: string
  version: number
  description: string | null
  category: string
  is_promotional: boolean
  is_transactional: boolean
  default_locale: string
  enabled: boolean
  created_at: string
  updated_at: string
}

interface EventCreate {
  event_name: string
  version?: number
  description?: string
  category?: string
  is_promotional?: boolean
  is_transactional?: boolean
  default_locale?: string
  enabled?: boolean
}

interface EventUpdate {
  description?: string
  enabled?: boolean
  is_promotional?: boolean
  is_transactional?: boolean
}

export function useCommEvents(skip = 0, limit = 50) {
  return useQuery({
    queryKey: ['comm', 'events', skip, limit],
    queryFn: () => apiGet<CommEvent[]>('/comm/events', { params: { skip, limit } }),
    staleTime: 30_000,
  })
}

export function useCreateCommEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: EventCreate) => apiPost<CommEvent>('/comm/events', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comm', 'events'] }),
    meta: { successMessage: 'Event registered', errorTitle: 'Failed to register event' },
  })
}

export function useUpdateCommEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & EventUpdate) =>
      apiPatch<CommEvent>(`/comm/events/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comm', 'events'] }),
    meta: { successMessage: 'Event updated', errorTitle: 'Failed to update event' },
  })
}
