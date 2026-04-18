import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPut } from '@/lib/api'

interface ConfigItem {
  id: string
  section: string
  key: string
  value: unknown
  description: string | null
  isActive: boolean
  updatedBy: string | null
  createdAt: string
  updatedAt: string
}

interface DashboardData {
  totalUsers: number
  roleDistribution: Record<string, number>
  pendingApprovals: number
  totalOpportunities: number
  activeConfigs: number
}

interface UserListItem {
  id: string
  email: string
  fullName: string
  role: string
  kycStatus: string
  isActive: boolean
  createdAt: string
}

export function useControlDashboard() {
  return useQuery({
    queryKey: ['control-centre', 'dashboard'],
    queryFn: () => apiGet<DashboardData>('/control-centre/dashboard'),
    staleTime: 30_000,
  })
}

export function useControlConfigs(section?: string) {
  return useQuery({
    queryKey: ['control-centre', 'configs', section],
    queryFn: () =>
      apiGet<ConfigItem[]>('/control-centre/configs', {
        params: section ? { section } : {},
      }),
    staleTime: 30_000,
  })
}

export function useAppearanceConfig() {
  return useQuery({
    queryKey: ['control-centre', 'appearance'],
    queryFn: () =>
      apiGet<{ lightModeBgColor: string }>('/control-centre/appearance'),
    staleTime: 60_000,
  })
}

export function useCreateConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { section: string; key: string; value: unknown; description?: string }) =>
      apiPost('/control-centre/configs', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['control-centre', 'configs'] })
    },
  })
}

export function useUpdateConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; value?: unknown; description?: string; isActive?: boolean }) =>
      apiPut(`/control-centre/configs/${id}`, {
        value: data.value,
        description: data.description,
        is_active: data.isActive,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['control-centre', 'configs'] })
    },
  })
}

export function useControlUsers(params?: { role?: string; search?: string; page?: number }) {
  return useQuery({
    queryKey: ['control-centre', 'users', params],
    queryFn: () =>
      apiGet<UserListItem[]>('/control-centre/users', {
        params: {
          ...(params?.role && { role: params.role }),
          ...(params?.search && { search: params.search }),
          page: params?.page ?? 1,
        },
      }),
    staleTime: 15_000,
  })
}

export function useUpdateUserRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      apiPut(`/control-centre/users/${userId}/role`, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['control-centre', 'users'] })
      qc.invalidateQueries({ queryKey: ['control-centre', 'dashboard'] })
    },
  })
}

export function useApprovalCategories() {
  return useQuery({
    queryKey: ['control-centre', 'approval-categories'],
    queryFn: () => apiGet<Array<{ value: string; label: string }>>('/control-centre/approval-categories'),
    staleTime: 60_000,
  })
}
