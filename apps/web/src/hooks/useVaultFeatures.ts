/**
 * useVaultFeatures — hooks for vault-feature matrix CRUD, my-features, SSE stream, and feature gating.
 */

import { useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPut } from '@/lib/api'
import { API_BASE_URL } from '@/lib/constants'
import { useUserStore } from '@/stores/user.store'

// ── Types ───────────────────────────────────────────────────────────────────

interface VaultFeatureFlag {
  id: string
  vaultType: string
  role: string
  featureKey: string
  enabled: boolean
  updatedAt: string
}

interface VaultFeatureFlagUpdate {
  vault_type: string
  role: string
  feature_key: string
  enabled: boolean
}

interface MyFeatureFlags {
  wealth: Record<string, boolean>
  safe: Record<string, boolean>
  opportunity: Record<string, boolean>
  community: Record<string, boolean>
}

// ── Admin: Full matrix ──────────────────────────────────────────────────────

export function useFeatureMatrix() {
  return useQuery({
    queryKey: ['vault-features', 'matrix'],
    queryFn: () => apiGet<VaultFeatureFlag[]>('/vault-features/matrix'),
    staleTime: 30_000,
  })
}

export function useUpdateFeatureMatrix() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (updates: VaultFeatureFlagUpdate[]) =>
      apiPut<VaultFeatureFlag[]>('/vault-features/matrix', { updates }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vault-features'] })
    },
  })
}

// ── User: My features ───────────────────────────────────────────────────────

export function useMyFeatures() {
  return useQuery({
    queryKey: ['vault-features', 'my-features'],
    queryFn: () => apiGet<MyFeatureFlags>('/vault-features/my-features'),
    staleTime: 60_000,
  })
}

/**
 * Check if the current user can access a specific feature in a vault.
 * Returns { allowed, isLoading }.
 */
export function useCanAccess(vaultType: 'wealth' | 'safe' | 'opportunity' | 'community', featureKey: string) {
  const { data, isLoading } = useMyFeatures()
  const user = useUserStore((s) => s.user)

  // Super-admin bypass
  const isSuperAdmin = user?.roles?.includes('super_admin') ?? false
  if (isSuperAdmin) return { allowed: true, isLoading: false }
  if (isLoading || !data) return { allowed: false, isLoading: true }
  const vault = vaultType === 'safe' ? (data.safe ?? data.opportunity ?? {}) : (data[vaultType] ?? {})
  return { allowed: !!vault[featureKey], isLoading: false }
}

// ── SSE: Real-time feature stream ───────────────────────────────────────────

export function useVaultFeatureStream() {
  const qc = useQueryClient()
  const esRef = useRef<EventSource | null>(null)
  const connectRef = useRef<() => void>(null)

  const connect = useCallback(() => {
    const token = localStorage.getItem('ws_token')
    if (!token) return

    const url = `${API_BASE_URL}/vault-features/stream`

    const es = new EventSource(url)
    esRef.current = es

    es.addEventListener('update', (event) => {
      try {
        JSON.parse(event.data)
        qc.invalidateQueries({ queryKey: ['vault-features'] })
      } catch {
        // Ignore malformed events
      }
    })

    es.addEventListener('connected', () => {
      // Initial connection established
    })

    es.onerror = () => {
      es.close()
      esRef.current = null
      // Reconnect after 5s
      setTimeout(() => connectRef.current?.(), 5_000)
    }
  }, [qc])

  useEffect(() => {
    connectRef.current = connect
    connect()
    return () => {
      esRef.current?.close()
      esRef.current = null
    }
  }, [connect])
}

// ── Admin invites ───────────────────────────────────────────────────────────

interface AdminInvite {
  id: string
  email: string
  role: string
  status: string
  expiresAt: string
  createdAt: string
}

export function useAdminInvites(status?: string) {
  return useQuery({
    queryKey: ['admin-invites', status],
    queryFn: () =>
      apiGet<AdminInvite[]>('/control-centre/invites', {
        params: status ? { status } : {},
      }),
    staleTime: 30_000,
  })
}

export function useCreateAdminInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { email: string; role: string }) =>
      apiPost<AdminInvite>('/control-centre/invite-admin', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-invites'] })
    },
  })
}

export { type VaultFeatureFlag, type MyFeatureFlags, type AdminInvite }
