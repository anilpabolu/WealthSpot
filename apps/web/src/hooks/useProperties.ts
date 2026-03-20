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
  highlights?: string[]
  usp?: string
  videoUrl?: string
  referrerName?: string
  referrerPhone?: string
  referrerUserId?: string
  documents?: Record<string, unknown>
  builder?: {
    id: string
    companyName: string
    reraNumber?: string
    logoUrl?: string
    verified: boolean
    phone?: string
    email?: string
    address?: string
    city?: string
    experienceYears?: number
    projectsCompleted?: number
    totalSqftDelivered?: number
    about?: string
    description?: string
    website?: string
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
  builder: Property['builder'] | null
  fundingPercentage: number
  amenities: string[]
  highlights: string[]
  usp: string
  videoUrl: string
  referrerName: string
  referrerPhone: string
  referrerUserId: string
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
    builder: p.builder ? {
      id: p.builder.id,
      companyName: p.builder.companyName,
      reraNumber: p.builder.reraNumber,
      logoUrl: p.builder.logoUrl,
      verified: p.builder.verified,
      phone: p.builder.phone,
      email: p.builder.email,
      address: p.builder.address,
      city: p.builder.city,
      experienceYears: p.builder.experienceYears,
      projectsCompleted: p.builder.projectsCompleted,
      totalSqftDelivered: p.builder.totalSqftDelivered,
      about: p.builder.about,
      description: p.builder.description,
      website: p.builder.website,
    } : null,
    fundingPercentage: p.fundingPercentage,
    amenities: p.amenities ?? [],
    highlights: p.highlights ?? [],
    usp: p.usp ?? '',
    videoUrl: p.videoUrl ?? '',
    referrerName: p.referrerName ?? '',
    referrerPhone: p.referrerPhone ?? '',
    referrerUserId: p.referrerUserId ?? '',
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
          search: filters.search || undefined,
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

/** Autocomplete suggestions for the marketplace search bar */
export interface SearchSuggestion {
  text: string
  type: 'property' | 'city' | 'area' | 'builder' | 'referrer'
  slug?: string
}

export function usePropertyAutocomplete(query: string) {
  return useQuery({
    queryKey: ['properties', 'autocomplete', query],
    queryFn: () => apiGet<SearchSuggestion[]>('/properties/autocomplete', { params: { q: query } }),
    enabled: query.length >= 2,
    staleTime: 30_000,
  })
}

/** Full builder profile with their listed properties */
export interface BuilderProfile {
  id: string
  companyName: string
  reraNumber?: string
  logoUrl?: string
  verified: boolean
  phone?: string
  email?: string
  address?: string
  city?: string
  experienceYears?: number
  projectsCompleted?: number
  totalSqftDelivered?: number
  about?: string
  description?: string
  website?: string
  properties: Property[]
}

interface ApiBuilderProfile {
  id: string
  company_name: string
  rera_number?: string
  logo_url?: string
  verified: boolean
  phone?: string
  email?: string
  address?: string
  city?: string
  experience_years?: number
  projects_completed?: number
  total_sqft_delivered?: number
  about?: string
  description?: string
  website?: string
  properties: ApiProperty[]
}

export function useBuilderProfile(builderId: string) {
  return useQuery({
    queryKey: ['builder', builderId],
    queryFn: async (): Promise<BuilderProfile> => {
      const raw = await apiGet<ApiBuilderProfile>(`/properties/builders/${builderId}`)
      return {
        id: raw.id,
        companyName: raw.company_name,
        reraNumber: raw.rera_number,
        logoUrl: raw.logo_url,
        verified: raw.verified,
        phone: raw.phone,
        email: raw.email,
        address: raw.address,
        city: raw.city,
        experienceYears: raw.experience_years,
        projectsCompleted: raw.projects_completed,
        totalSqftDelivered: raw.total_sqft_delivered,
        about: raw.about,
        description: raw.description,
        website: raw.website,
        properties: raw.properties.map(mapProperty),
      }
    },
    enabled: !!builderId,
    staleTime: 120_000,
  })
}
