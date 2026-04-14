import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface VaultConfigResponse {
  wealthVaultEnabled: boolean
  opportunityVaultEnabled: boolean
  communityVaultEnabled: boolean
  introVideosEnabled: boolean
  vaultVideosEnabled: boolean
  propertyVideosEnabled: boolean
  videoManagementEnabled: boolean
}

/**
 * Public hook: fetches which vaults are enabled/disabled + video toggles from the backend.
 * Used across VaultsPage, CreateOpportunityModal, VaultPickerModal,
 * CompanyOnboardingModal, PortfolioPage, MarketplacePage, etc.
 */
export function useVaultConfig() {
  const query = useQuery({
    queryKey: ['vault-config'],
    queryFn: async () => {
      const resp = await api.get<VaultConfigResponse>('/control-centre/vault-config')
      return resp.data
    },
    staleTime: 60_000,
  })

  const config = query.data

  return {
    ...query,
    wealthEnabled: true, // always on
    opportunityEnabled: config?.opportunityVaultEnabled ?? false,
    communityEnabled: config?.communityVaultEnabled ?? false,
    // Video toggles (per-category)
    introVideosEnabled: config?.introVideosEnabled ?? true,
    vaultVideosEnabled: config?.vaultVideosEnabled ?? true,
    propertyVideosEnabled: config?.propertyVideosEnabled ?? true,
    videoManagementEnabled: config?.videoManagementEnabled ?? true,
    isVaultEnabled: (vaultId: string): boolean => {
      if (vaultId === 'wealth') return true
      if (vaultId === 'opportunity') return config?.opportunityVaultEnabled ?? false
      if (vaultId === 'community') return config?.communityVaultEnabled ?? false
      return true
    },
    isVideoEnabled: (category: 'intro' | 'vault' | 'property' | 'management'): boolean => {
      if (category === 'intro') return config?.introVideosEnabled ?? true
      if (category === 'vault') return config?.vaultVideosEnabled ?? true
      if (category === 'property') return config?.propertyVideosEnabled ?? true
      if (category === 'management') return config?.videoManagementEnabled ?? true
      return true
    },
  }
}
