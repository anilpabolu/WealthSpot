import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'

interface VaultConfigResponse {
  wealthVaultEnabled: boolean
  opportunityVaultEnabled: boolean
  communityVaultEnabled: boolean
}

/**
 * Public hook: fetches which vaults are enabled/disabled from the backend.
 * Used across Home screen, Marketplace, Profiling, etc.
 */
export function useVaultConfig() {
  const query = useQuery({
    queryKey: ['vault-config'],
    queryFn: () => apiGet<VaultConfigResponse>('/control-centre/vault-config'),
    staleTime: 60_000,
  })

  const config = query.data

  return {
    ...query,
    wealthEnabled: true,
    opportunityEnabled: config?.opportunityVaultEnabled ?? false,
    communityEnabled: config?.communityVaultEnabled ?? false,
    isVaultEnabled: (vaultId: string): boolean => {
      if (vaultId === 'wealth') return true
      if (vaultId === 'opportunity') return config?.opportunityVaultEnabled ?? false
      if (vaultId === 'community') return config?.communityVaultEnabled ?? false
      return true
    },
  }
}
