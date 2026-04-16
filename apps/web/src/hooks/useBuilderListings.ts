import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'
import type { OpportunityItem } from './useOpportunities'

/* ── Builder property (from GET /properties/builders/me) ─────────── */

interface BuilderProperty {
  id: string
  slug: string
  title: string
  tagline: string | null
  assetType: string
  status: string
  city: string
  locality: string | null
  coverImage: string | null
  targetAmount: number
  raisedAmount: number
  minInvestment: number
  targetIrr: number
  investorCount: number
  fundingPercentage: number
  createdAt: string
}

interface BuilderProfile {
  id: string
  companyName: string
  properties: BuilderProperty[]
}

/* ── Unified listing type ────────────────────────────────────────── */

export interface BuilderListing {
  id: string
  title: string
  city: string
  micromarket: string
  assetType: string
  status: 'live' | 'upcoming' | 'funded' | 'closed'
  irr: number
  minInvest: number
  raised: number
  target: number
  investors: number
  image: string
  type: 'opportunity' | 'property'
  slug: string
}

/* ── Status mapping ──────────────────────────────────────────────── */

const OPP_STATUS_MAP: Record<string, BuilderListing['status']> = {
  approved: 'upcoming',
  active: 'live',
  funding: 'live',
  funded: 'funded',
  closing_soon: 'live',
  closed: 'closed',
}

const PROP_STATUS_MAP: Record<string, BuilderListing['status']> = {
  active: 'live',
  funding: 'live',
  funded: 'funded',
  sold_out: 'funded',
  closed: 'closed',
  upcoming: 'upcoming',
}

/* ── Hook ────────────────────────────────────────────────────────── */

interface PaginatedOpportunities {
  items: OpportunityItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export function useBuilderListings() {
  const opportunitiesQuery = useQuery({
    queryKey: ['builder-listings', 'opportunities'],
    queryFn: () =>
      apiGet<PaginatedOpportunities>('/opportunities', {
        params: { creator_id: 'me', page_size: 100 },
      }),
    staleTime: 15_000,
  })

  const propertiesQuery = useQuery({
    queryKey: ['builder-listings', 'properties'],
    queryFn: async () => {
      try {
        return await apiGet<BuilderProfile>('/properties/builders/me')
      } catch (err: unknown) {
        // Non-builder users get 404 — return empty result
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosErr = err as { response?: { status: number } }
          if (axiosErr.response?.status === 404) {
            return { id: '', companyName: '', properties: [] } as BuilderProfile
          }
        }
        throw err
      }
    },
    staleTime: 15_000,
  })

  const listings: BuilderListing[] = []

  // Map opportunities
  if (opportunitiesQuery.data?.items) {
    for (const opp of opportunitiesQuery.data.items) {
      const mapped = OPP_STATUS_MAP[opp.status]
      if (!mapped) continue // skip drafts, pending, rejected
      listings.push({
        id: opp.id,
        title: opp.title,
        city: opp.city ?? '',
        micromarket: opp.locality ?? opp.addressLine1 ?? '',
        assetType: opp.vaultType === 'wealth' ? 'Real Estate' : opp.vaultType === 'opportunity' ? 'Startup' : 'Community',
        status: mapped,
        irr: opp.expectedIrr ?? opp.targetIrr ?? 0,
        minInvest: opp.minInvestment ?? 0,
        raised: opp.raisedAmount ?? 0,
        target: opp.targetAmount ?? 0,
        investors: opp.investorCount ?? 0,
        image: opp.coverImage ?? '',
        type: 'opportunity',
        slug: opp.slug,
      })
    }
  }

  // Map properties
  if (propertiesQuery.data?.properties) {
    for (const prop of propertiesQuery.data.properties) {
      const mapped = PROP_STATUS_MAP[prop.status]
      if (!mapped) continue
      listings.push({
        id: prop.id,
        title: prop.title,
        city: prop.city,
        micromarket: prop.locality ?? '',
        assetType: prop.assetType ?? 'Property',
        status: mapped,
        irr: prop.targetIrr ?? 0,
        minInvest: prop.minInvestment ?? 0,
        raised: prop.raisedAmount ?? 0,
        target: prop.targetAmount ?? 0,
        investors: prop.investorCount ?? 0,
        image: prop.coverImage ?? '',
        type: 'property',
        slug: prop.slug,
      })
    }
  }

  // Sort by newest first (opportunities first, then properties)
  return {
    listings,
    isLoading: opportunitiesQuery.isLoading || propertiesQuery.isLoading,
    isError: opportunitiesQuery.isError && propertiesQuery.isError,
  }
}
