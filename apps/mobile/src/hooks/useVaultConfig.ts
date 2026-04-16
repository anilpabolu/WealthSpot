import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'

interface VaultConfigResponse {
  wealthVaultEnabled: boolean
  opportunityVaultEnabled: boolean
  communityVaultEnabled: boolean
  introVideosEnabled: boolean
  vaultVideosEnabled: boolean
  propertyVideosEnabled: boolean
  videoManagementEnabled: boolean
  reraDisplayEnabled: boolean
}

/**
 * Public hook: fetches which vaults are enabled/disabled + video toggles from the backend.
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
    // Video toggles
    introVideosEnabled: config?.introVideosEnabled ?? true,
    vaultVideosEnabled: config?.vaultVideosEnabled ?? true,
    propertyVideosEnabled: config?.propertyVideosEnabled ?? true,
    reraDisplayEnabled: config?.reraDisplayEnabled ?? true,
    isVaultEnabled: (vaultId: string): boolean => {
      if (vaultId === 'wealth') return true
      if (vaultId === 'opportunity') return config?.opportunityVaultEnabled ?? false
      if (vaultId === 'community') return config?.communityVaultEnabled ?? false
      return true
    },
  }
}
