/**
 * useApprovals – React Query hooks for approval system.
 * Mirrors web's useApprovals.ts.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '../lib/api'
import { useApprovalStore } from '../stores/approval.store'

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
    mutationFn: ({ id, action, reviewNote }: { id: string; action: 'approve' | 'reject'; reviewNote?: string }) =>
      apiPost(`/approvals/${id}/review`, { action, review_note: reviewNote }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals'] })
    },
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
