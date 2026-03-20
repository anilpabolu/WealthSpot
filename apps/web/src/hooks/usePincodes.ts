import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'

export interface PincodeResult {
  pincode: string
  officeName: string | null
  locality: string | null
  district: string | null
  state: string | null
  region: string | null
}

export function usePincodeLookup(pincode: string) {
  return useQuery({
    queryKey: ['pincodes', pincode],
    queryFn: () => apiGet<PincodeResult[]>(`/pincodes/${pincode}`),
    enabled: pincode.length === 6,
    staleTime: 60_000 * 60, // cache 1 hour
  })
}
