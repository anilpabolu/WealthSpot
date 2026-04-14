/**
 * useVaultFeatures – mobile hooks for feature gating.
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'
import { useUserStore } from '../stores/user.store'

interface MyFeatureFlags {
  wealth: Record<string, boolean>
  opportunity: Record<string, boolean>
  community: Record<string, boolean>
}

export function useMyFeatures() {
  return useQuery({
    queryKey: ['vault-features', 'my-features'],
    queryFn: () => apiGet<MyFeatureFlags>('/vault-features/my-features'),
    staleTime: 60_000,
  })
}

export function useCanAccess(vaultType: 'wealth' | 'opportunity' | 'community', featureKey: string) {
  const { data, isLoading } = useMyFeatures()
  const user = useUserStore((s) => s.user)

  if (user?.roles?.includes('super_admin')) {
    return { allowed: true, isLoading: false }
  }

  if (isLoading || !data) return { allowed: false, isLoading: true }
  const vault = data[vaultType] ?? {}
  return { allowed: !!vault[featureKey], isLoading: false }
}
