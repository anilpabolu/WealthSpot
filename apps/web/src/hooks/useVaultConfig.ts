import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface VaultConfigResponse {
  wealthVaultEnabled: boolean
  opportunityVaultEnabled: boolean
  communityVaultEnabled: boolean
}

/**
 * Public hook: fetches which vaults are enabled/disabled from the backend.
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
    isVaultEnabled: (vaultId: string): boolean => {
      if (vaultId === 'wealth') return true
      if (vaultId === 'opportunity') return config?.opportunityVaultEnabled ?? false
      if (vaultId === 'community') return config?.communityVaultEnabled ?? false
      return true
    },
  }
}
