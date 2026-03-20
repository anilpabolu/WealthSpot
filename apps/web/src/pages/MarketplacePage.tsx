import { MainLayout } from '@/components/layout'
import PropertyCard from '@/components/wealth/PropertyCard'
import { useProperties, usePropertyAutocomplete, type Property, type SearchSuggestion } from '@/hooks/useProperties'
import { useMarketplaceStore } from '@/stores/marketplace.store'
import { ASSET_TYPES, INDIAN_CITIES } from '@/lib/constants'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, Grid3X3, List, X, Building2, Rocket, Users, MapPin, User2, Home } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useUserStore } from '@/stores/user.store'
import { useQueryClient } from '@tanstack/react-query'
import { apiDelete } from '@/lib/api'

function FilterSidebar() {
  const { filters, setFilter, resetFilters } = useMarketplaceStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const content = (
    <div className="space-y-6">
      {/* City */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block">City</label>
        <select
          value={filters.city}
          onChange={(e) => setFilter('city', e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary"
        >
          <option value="">All Cities</option>
          {INDIAN_CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Asset Type */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block">Asset Type</label>
        <select
          value={filters.assetType}
          onChange={(e) => setFilter('assetType', e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary"
        >
          <option value="">All Types</option>
          {Object.values(ASSET_TYPES).map((t) => (
            <option key={t} value={t}>{t.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block">Status</label>
        <div className="flex flex-wrap gap-2">
          {(['', 'upcoming', 'funding', 'funded'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter('status', s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filters.status === s
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === '' ? 'All' : s === 'upcoming' ? 'Upcoming' : s === 'funding' ? 'Funding' : 'Fully Funded'}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block">Sort By</label>
        <select
          value={filters.sortBy}
          onChange={(e) => setFilter('sortBy', e.target.value as typeof filters.sortBy)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary"
        >
          <option value="newest">Newest First</option>
          <option value="irr_high">Highest IRR</option>
          <option value="irr_low">Lowest IRR</option>
          <option value="funding">Most Funded</option>
          <option value="price_low">Lowest Price</option>
          <option value="price_high">Highest Price</option>
        </select>
      </div>

      {/* Reset */}
      <button onClick={resetFilters} className="btn-ghost text-sm w-full">
        Reset All Filters
      </button>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="card p-5 sticky top-20">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </h3>
          {content}
        </div>
      </aside>

      {/* Mobile filter button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
        aria-label="Open filters"
      >
        <SlidersHorizontal className="h-5 w-5" />
      </button>

      {/* Mobile filter drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-white p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </h3>
              <button onClick={() => setMobileOpen(false)} className="p-1 rounded hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            {content}
          </div>
        </div>
      )}
    </>
  )
}

const SUGGESTION_ICONS: Record<SearchSuggestion['type'], React.ElementType> = {
  property: Home,
  city: MapPin,
  area: MapPin,
  builder: Building2,
  referrer: User2,
}

const SUGGESTION_LABELS: Record<SearchSuggestion['type'], string> = {
  property: 'Property',
  city: 'City',
  area: 'Area',
  builder: 'Builder',
  referrer: 'Referrer',
}

function SearchBar() {
  const navigate = useNavigate()
  const { filters, setFilter } = useMarketplaceStore()
  const [inputValue, setInputValue] = useState(filters.search)
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const { data: suggestions = [] } = usePropertyAutocomplete(debouncedQuery)

  // Debounce the autocomplete query
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(value.trim())
    }, 300)
  }, [])

  // Submit search to filter properties
  const handleSearch = useCallback((text: string) => {
    setFilter('search', text)
    setInputValue(text)
    setShowDropdown(false)
  }, [setFilter])

  // Handle suggestion click
  const handleSuggestionClick = useCallback((s: SearchSuggestion) => {
    if (s.type === 'property' && s.slug) {
      navigate(`/marketplace/${s.slug}`)
    } else if (s.type === 'city') {
      setFilter('city', s.text)
      setFilter('search', '')
      setInputValue('')
    } else {
      handleSearch(s.text)
    }
    setShowDropdown(false)
  }, [navigate, setFilter, handleSearch])

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Cleanup debounce timer
  useEffect(() => () => clearTimeout(debounceRef.current), [])

  return (
    <div ref={wrapperRef} className="relative mb-6">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
      <input
        type="search"
        value={inputValue}
        onChange={(e) => {
          handleInputChange(e.target.value)
          setShowDropdown(true)
        }}
        onFocus={() => { if (debouncedQuery.length >= 2) setShowDropdown(true) }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSearch(inputValue.trim())
          if (e.key === 'Escape') setShowDropdown(false)
        }}
        placeholder="Search by property name, city, area, builder, or referrer..."
        className="w-full pl-11 pr-10 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      />
      {inputValue && (
        <button
          onClick={() => { setInputValue(''); handleSearch(''); setDebouncedQuery('') }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Autocomplete dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
          {suggestions.map((s, i) => {
            const Icon = SUGGESTION_ICONS[s.type]
            return (
              <button
                key={`${s.type}-${s.text}-${i}`}
                onClick={() => handleSuggestionClick(s)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
              >
                <Icon className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-900 flex-1 truncate">{s.text}</span>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold shrink-0">
                  {SUGGESTION_LABELS[s.type]}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

const VAULT_META: Record<string, { label: string; description: string; color: string; Icon: React.ElementType }> = {
  wealth: {
    label: 'Wealth Vault',
    description: 'Institutional-grade real estate — RERA-verified properties earning passive rental income.',
    color: 'bg-primary/10 border-primary/30 text-primary',
    Icon: Building2,
  },
  opportunity: {
    label: 'Opportunity Vault',
    description: 'High-potential startup investments from vetted founders across industries.',
    color: 'bg-violet-50 border-violet-200 text-violet-700',
    Icon: Rocket,
  },
  community: {
    label: 'Community Vault',
    description: 'Community-driven opportunities — sports complexes, co-working spaces, and local businesses.',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    Icon: Users,
  },
}

export default function MarketplacePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { filters, viewMode, setViewMode, setPage, setFilter: _setFilter } = useMarketplaceStore()
  const { data, isLoading } = useProperties(filters)
  const queryClient = useQueryClient()
  const userRole = useUserStore((s) => s.user?.role)
  const isAdmin = userRole === 'admin' || userRole === 'super_admin'

  const handleDeleteProperty = async (propertyId: string) => {
    try {
      await apiDelete(`/properties/${propertyId}`)
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    } catch {
      alert('Failed to archive property. Please try again.')
    }
  }

  const vaultParam = searchParams.get('vault') ?? ''
  const vaultMeta = VAULT_META[vaultParam]

  // Clear vault context banner
  const clearVault = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('vault')
    setSearchParams(next)
  }

  const properties = data?.properties ?? ([] as Property[])
  const totalPages = data?.totalPages ?? 1

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Vault context banner */}
        {vaultMeta && (
          <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 mb-5 ${vaultMeta.color}`}>
            <vaultMeta.Icon className="h-5 w-5 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{vaultMeta.label}</p>
              <p className="text-xs opacity-80 mt-0.5">{vaultMeta.description}</p>
            </div>
            <button
              onClick={clearVault}
              className="shrink-0 p-1 rounded hover:bg-black/10 transition-colors"
              aria-label="Clear vault filter"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Page header */}
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-gray-900">Property Marketplace</h1>
          <p className="text-gray-500 mt-1">Discover RERA-verified investment opportunities</p>
        </div>

        {/* Search bar with autocomplete */}
        <SearchBar />

        <div className="flex gap-8">
          <FilterSidebar />

          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {isLoading ? 'Loading...' : `${data?.total ?? 0} properties found`}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-gray-100'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-gray-100'
                  }`}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Property Grid */}
            <div
              className={
                viewMode === 'grid'
                  ? 'grid sm:grid-cols-2 xl:grid-cols-3 gap-6'
                  : 'space-y-4'
              }
            >
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <PropertyCard key={i} isLoading title="" city="" assetType="" coverImage="" targetIrr={0} minInvestment={0} raised={0} target={0} />
                  ))
                : properties.map((p) => (
                    <PropertyCard
                      key={p.id}
                      title={p.title}
                      city={p.city}
                      micromarket={p.micromarket}
                      assetType={p.assetType}
                      coverImage={p.coverImage}
                      gallery={p.gallery}
                      videoUrl={p.videoUrl}
                      targetIrr={p.targetIrr}
                      minInvestment={p.minInvestment}
                      raised={p.raised}
                      target={p.target}
                      investorCount={p.investorCount}
                      reraNumber={p.reraNumber}
                      status={p.status as any}
                      onCardClick={() => navigate(`/marketplace/${p.slug}`)}
                      onInvestClick={() => navigate(`/marketplace/${p.slug}`)}
                      isAdmin={isAdmin}
                      propertyId={p.id}
                      onDelete={handleDeleteProperty}
                    />
                  ))}
            </div>

            {/* Empty state */}
            {!isLoading && properties.length === 0 && (
              <div className="text-center py-20">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-1">Nothing here yet 🏗️</h3>
                <p className="text-sm text-gray-500">Tweak those filters — your next goldmine could be one click away.</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(filters.page - 1)}
                  disabled={filters.page <= 1}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                  const page = i + 1
                  return (
                    <button
                      key={page}
                      onClick={() => setPage(page)}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        filters.page === page
                          ? 'bg-primary text-white'
                          : 'border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
                <button
                  onClick={() => setPage(filters.page + 1)}
                  disabled={filters.page >= totalPages}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
