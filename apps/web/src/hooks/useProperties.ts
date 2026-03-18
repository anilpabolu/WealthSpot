import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'
import type { MarketplaceFilters } from '@/stores/marketplace.store'

/** Shape returned by the API after snake_case→camelCase auto-conversion */
interface ApiProperty {
  id: string
  slug: string
  title: string
  tagline?: string
  description?: string
  city: string
  locality?: string
  address?: string
  state?: string
  assetType: string
  coverImage?: string
  gallery?: string[]
  targetIrr: number
  minInvestment: number
  unitPrice: number
  totalUnits: number
  soldUnits: number
  raisedAmount: number
  targetAmount: number
  investorCount: number
  fundingPercentage: number
  status: string
  reraId?: string
  rentalYield?: number
  areaSqft?: number
  bedrooms?: number
  possessionDate?: string
  amenities?: string[]
  documents?: Record<string, unknown>
  builder?: {
    id: string
    companyName: string
    reraNumber?: string
    logoUrl?: string
    verified: boolean
  }
  launchDate?: string
  createdAt: string
  updatedAt?: string
}

/** Frontend-friendly property shape used throughout the app */
export interface Property {
  id: string
  slug: string
  title: string
  description: string
  city: string
  micromarket: string
  address: string
  assetType: string
  coverImage: string
  gallery: string[]
  targetIrr: number
  minInvestment: number
  unitPrice: number
  totalUnits: number
  soldUnits: number
  raised: number
  target: number
  investorCount: number
  status: string
  reraNumber: string
  builderId: string
  builderName: string
  builderLogo: string
  fundingPercentage: number
  amenities: string[]
  documents: Array<{ name: string; url: string; type: string }>
  createdAt: string
}

/** Map API property to the frontend Property shape */
function mapProperty(p: ApiProperty): Property {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description ?? '',
    city: p.city,
    micromarket: p.locality ?? '',
    address: p.address ?? '',
    assetType: p.assetType,
    coverImage: p.coverImage ?? '/placeholder-property.jpg',
    gallery: p.gallery ?? [],
    targetIrr: Number(p.targetIrr),
    minInvestment: Number(p.minInvestment),
    unitPrice: Number(p.unitPrice),
    totalUnits: p.totalUnits,
    soldUnits: p.soldUnits,
    raised: Number(p.raisedAmount),
    target: Number(p.targetAmount),
    investorCount: p.investorCount,
    status: p.status,
    reraNumber: p.reraId ?? '',
    builderId: p.builder?.id ?? '',
    builderName: p.builder?.companyName ?? '',
    builderLogo: p.builder?.logoUrl ?? '',
    fundingPercentage: p.fundingPercentage,
    amenities: p.amenities ?? [],
    documents: [],
    createdAt: p.createdAt,
  }
}

interface ApiPaginatedProperties {
  properties: ApiProperty[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface PropertiesResponse {
  properties: Property[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export function useProperties(filters: MarketplaceFilters) {
  return useQuery({
    queryKey: ['properties', filters],
    queryFn: async (): Promise<PropertiesResponse> => {
      const raw = await apiGet<ApiPaginatedProperties>('/properties', {
        params: {
          city: filters.city || undefined,
          asset_type: filters.assetType || undefined,
          min_investment_min: filters.minInvestment[0],
          min_investment_max: filters.minInvestment[1],
          irr_min: filters.irrRange[0],
          irr_max: filters.irrRange[1],
          status: filters.status || undefined,
          sort_by: filters.sortBy,
          page: filters.page,
          page_size: filters.pageSize,
        },
      })
      return {
        ...raw,
        properties: raw.properties.map(mapProperty),
      }
    },
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  })
}

export function useProperty(slug: string) {
  return useQuery({
    queryKey: ['property', slug],
    queryFn: async (): Promise<Property> => {
      const raw = await apiGet<ApiProperty>(`/properties/${slug}`)
      return mapProperty(raw)
    },
    enabled: !!slug,
    staleTime: 60_000,
  })
}

export function useFeaturedProperties() {
  return useQuery({
    queryKey: ['properties', 'featured'],
    queryFn: async (): Promise<PropertiesResponse> => {
      const raw = await apiGet<ApiPaginatedProperties>('/properties', {
        params: { status: 'funding', sort_by: 'funding', page_size: 6 },
      })
      return {
        ...raw,
        properties: raw.properties.map(mapProperty),
      }
    },
    staleTime: 120_000,
  })
}

export function usePropertyCities() {
  return useQuery({
    queryKey: ['properties', 'cities'],
    queryFn: () => apiGet<string[]>('/properties/cities'),
    staleTime: 300_000,
  })
}
