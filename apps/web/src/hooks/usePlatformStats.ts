import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'

interface PlatformStats {
  totalMembers: number
  capitalDeployed: number
  activeOpportunities: number
  marketsCovered: number
  verifiedInvestors: number
}

export function usePlatformStats() {
  return useQuery({
    queryKey: ['platform-stats'],
    queryFn: () => apiGet<PlatformStats>('/control-centre/platform-stats'),
    staleTime: 60_000,
  })
}
