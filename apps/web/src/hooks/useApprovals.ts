import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '@/lib/api'
import { useApprovalStore } from '@/stores/approval.store'

interface ApprovalRequester {
  id: string
  email: string
  fullName: string
  avatarUrl: string | null
}

export interface Approval {
  id: string
  requesterId: string
  reviewerId: string | null
  category: string
  status: string
  priority: string
  title: string
  description: string | null
  resourceType: string | null
  resourceId: string | null
  payload: Record<string, unknown> | null
  reviewNote: string | null
  autoApprove: boolean
  createdAt: string
  reviewedAt: string | null
  requester?: ApprovalRequester
  reviewer?: ApprovalRequester
}

interface PaginatedApprovals {
  items: Approval[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface ApprovalStats {
  pending: number
  inReview: number
  approved: number
  rejected: number
}

export function useApprovals() {
  const { filters } = useApprovalStore()
  return useQuery({
    queryKey: ['approvals', filters],
    queryFn: () =>
      apiGet<PaginatedApprovals>('/approvals', {
        params: {
          ...(filters.category && { category: filters.category }),
          ...(filters.status && { status: filters.status }),
          ...(filters.priority && { priority: filters.priority }),
          page: filters.page,
          page_size: filters.pageSize,
          sort_by: filters.sortBy,
          sort_order: filters.sortOrder,
        },
      }),
    staleTime: 15_000,
  })
}

export function useMyApprovals() {
  return useQuery({
    queryKey: ['approvals', 'mine'],
    queryFn: () => apiGet<Approval[]>('/approvals/my'),
    staleTime: 15_000,
  })
}

export function useApprovalStats() {
  return useQuery({
    queryKey: ['approvals', 'stats'],
    queryFn: () => apiGet<ApprovalStats>('/approvals/stats'),
    staleTime: 15_000,
  })
}

export function useReviewApproval() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      action,
      reviewNote,
      override,
    }: {
      id: string
      action: 'approve' | 'reject'
      reviewNote?: string
      override?: boolean
    }) =>
      apiPost(`/approvals/${id}/review`, {
        action,
        review_note: reviewNote,
        override: override ?? false,
      }),
    onSuccess: () => {
      // Invalidate approvals list + stats
      qc.invalidateQueries({ queryKey: ['approvals'] })
      // Invalidate all resource queries that may have been updated by the approval
      qc.invalidateQueries({ queryKey: ['opportunities'] })
      qc.invalidateQueries({ queryKey: ['companies'] })
      qc.invalidateQueries({ queryKey: ['control-centre', 'users'] })
      qc.invalidateQueries({ queryKey: ['vault-stats'] })
      qc.invalidateQueries({ queryKey: ['platform-stats'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
      qc.invalidateQueries({ queryKey: ['community'] })
    },
  })
}

/** Fetch all approvals (no status filter) for Kanban board view */
export function useAllApprovals(category?: string) {
  return useQuery({
    queryKey: ['approvals', 'all', category],
    queryFn: () =>
      apiGet<PaginatedApprovals>('/approvals', {
        params: {
          ...(category && { category }),
          page: 1,
          page_size: 100,
          sort_by: 'created_at',
          sort_order: 'desc',
        },
      }),
    staleTime: 15_000,
  })
}

export function useCreateApproval() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { category: string; title: string; description?: string; priority?: string; resourceType?: string; resourceId?: string; payload?: Record<string, unknown> }) =>
      apiPost('/approvals', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals'] })
    },
  })
}
