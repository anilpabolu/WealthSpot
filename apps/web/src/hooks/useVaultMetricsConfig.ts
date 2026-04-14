import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

type VaultMetricsConfigResponse = Record<string, string[]>

/**
 * Public hook: fetches enabled metric keys per vault from the backend.
 * Returns e.g. { wealth: ["total_invested", "investor_count", ...], ... }
 */
export function useVaultMetricsConfig() {
  return useQuery({
    queryKey: ['vault-metrics-config'],
    queryFn: async () => {
      const resp = await api.get<VaultMetricsConfigResponse>('/control-centre/vault-metrics-config')
      return resp.data
    },
    staleTime: 60_000,
  })
}
