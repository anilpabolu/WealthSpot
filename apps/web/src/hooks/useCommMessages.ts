import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'

export interface CommMessage {
  id: string
  channel: string
  recipient: string
  subject: string | null
  status: string
  attempts: number
  sent_at: string | null
  created_at: string
}

export interface CommMessageDetail extends CommMessage {
  correlation_id: string | null
  locale: string
  payload_snapshot: Record<string, unknown> | null
  error: string | null
}

export interface ChannelKpis {
  sent: number
  delivered: number
  opened: number
  failed: number
}

export interface CommDashboardKpis {
  period_days: number
  email: ChannelKpis
  sms: ChannelKpis
  whatsapp: ChannelKpis
  in_app: ChannelKpis
  outbox_pending: number
  outbox_failed: number
}

export function useCommMessages(
  channel?: string,
  status?: string,
  skip = 0,
  limit = 50,
) {
  return useQuery({
    queryKey: ['comm', 'messages', channel, status, skip, limit],
    queryFn: () =>
      apiGet<CommMessage[]>('/comm/messages', {
        params: {
          skip,
          limit,
          ...(channel && { channel }),
          ...(status && { status }),
        },
      }),
    staleTime: 15_000,
  })
}

export function useCommMessageDetail(id: string | null) {
  return useQuery({
    queryKey: ['comm', 'messages', id],
    queryFn: () => apiGet<CommMessageDetail>(`/comm/messages/${id}`),
    enabled: !!id,
    staleTime: 60_000,
  })
}

export function useCommDashboard(periodDays = 7) {
  return useQuery({
    queryKey: ['comm', 'dashboard', periodDays],
    queryFn: () =>
      apiGet<CommDashboardKpis>('/comm/dashboard', { params: { period_days: periodDays } }),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}
