import { MainLayout } from '@/components/layout'
import { type StatusType } from '@/components/wealth/StatusBadge'
import PropertyCard from '@/components/wealth/PropertyCard'
import FundingBar from '@/components/wealth/FundingBar'
import { useProperties, usePropertyAutocomplete, type Property, type SearchSuggestion } from '@/hooks/useProperties'
import { useOpportunities, type OpportunityItem } from '@/hooks/useOpportunities'
import { useMarketplaceStore } from '@/stores/marketplace.store'
import { ASSET_TYPES, INDIAN_CITIES } from '@/lib/constants'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, Grid3X3, List, X, Building2, Rocket, Users, MapPin, User2, Home, HandCoins, AlertCircle } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useUserStore } from '@/stores/user.store'
import { useQueryClient } from '@tanstack/react-query'
import { apiDelete } from '@/lib/api'

/** Returns ribbon label + colour pair for an opportunity's lifecycle stage */
function getOppRibbon(opp: OpportunityItem): { label: string; bg: string } | null {
  const status = (opp.status ?? '').toLowerCase()
  if (status === 'closed' || status === 'funded') return { label: 'FINISHED', bg: 'bg-red-600' }
  if (status === 'closing_soon') return { label: 'CLOSING SOON', bg: 'bg-orange-500' }
  // If closing_date is within 7 days → closing soon
  if (opp.closingDate) {
    const daysLeft = Math.ceil((new Date(opp.closingDate).getTime() - Date.now()) / 86_400_000)
    if (daysLeft <= 0) return { label: 'FINISHED', bg: 'bg-red-600' }
    if (daysLeft <= 7) return { label: 'CLOSING SOON', bg: 'bg-orange-500' }
  }
  // Funding > 90% → closing soon
  if (opp.targetAmount && opp.raisedAmount && opp.raisedAmount / opp.targetAmount >= 0.9) {
    return { label: 'CLOSING SOON', bg: 'bg-orange-500' }
  }
  if (['approved', 'active', 'funding'].includes(status)) return { label: 'LIVE', bg: 'bg-green-600' }
  if (['draft', 'pending_approval'].includes(status)) return { label: 'UPCOMING', bg: 'bg-blue-600' }
  if (status === 'rejected') return { label: 'REJECTED', bg: 'bg-stone-500' }
  return null
}

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

/** Format number as compact INR (e.g. ₹2.5 Cr, ₹1.2 L) */
function formatINR(num: number): string {
  if (num >= 1e7) return `₹${(num / 1e7).toFixed(1).replace(/\.0$/, '')} Cr`
  if (num >= 1e5) return `₹${(num / 1e5).toFixed(1).replace(/\.0$/, '')} L`
  if (num >= 1e3) return `₹${(num / 1e3).toFixed(1).replace(/\.0$/, '')} K`
  return `₹${num.toLocaleString('en-IN')}`
}

function SearchBar() {
  const navigate = useNavigate()
  const { filters, setFilter } = useMarketplaceStore()
  const [inputValue, setInputValue] = useState(filters.search)
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

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
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-stone-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
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
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const handleDeleteProperty = async (propertyId: string) => {
    try {
      await apiDelete(`/properties/${propertyId}`)
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    } catch {
      setToast('Failed to archive property. Please try again.')
    }
  }

  const vaultParam = searchParams.get('vault') ?? ''
  const subtypeParam = searchParams.get('subtype') ?? ''
  const vaultMeta = VAULT_META[vaultParam]

  // Fetch all opportunities for the active vault (no status filter — show all with ribbons)
  const { data: oppsData } = useOpportunities(
    vaultParam
      ? { vaultType: vaultParam, ...(subtypeParam && { communitySubtype: subtypeParam }) }
      : undefined
  )
  const opportunities = oppsData?.items ?? []

  // Active community subtype filter (from URL or user toggle)
  const [communityFilter, setCommunityFilter] = useState(subtypeParam)

  const handleCommunityFilter = (subtype: string) => {
    setCommunityFilter(subtype)
    const next = new URLSearchParams(searchParams)
    if (subtype) {
      next.set('subtype', subtype)
    } else {
      next.delete('subtype')
    }
    setSearchParams(next)
  }

  // Clear vault context banner
  const clearVault = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('vault')
    next.delete('subtype')
    setSearchParams(next)
  }

  const properties = data?.properties ?? ([] as Property[])
  const totalPages = data?.totalPages ?? 1
  const totalItems = (data?.total ?? 0) + opportunities.length

  return (
    <MainLayout>
      {/* Hero */}
      <div className="page-hero bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        <div className="page-hero-content">
          <span className="page-hero-badge">Marketplace</span>
          <h1 className="page-hero-title">Property Marketplace</h1>
          <p className="page-hero-subtitle">Discover RERA-verified investment opportunities across India's top cities.</p>
        </div>
      </div>

      <div className="page-section">
        <div className="page-section-container">
        {/* Vault context banner */}
        {vaultMeta && (
          <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 mb-5 ${vaultMeta.color}`}>
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

        {/* Community subtype filter chips */}
        {vaultParam === 'community' && (
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mr-1">Type:</span>
            {([['', 'All'], ['co_investor', 'Co-Investor'], ['co_partner', 'Co-Partner']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => handleCommunityFilter(val)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  communityFilter === val
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Search bar with autocomplete */}
        <SearchBar />

        <div className="flex gap-8">
          <FilterSidebar />

          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {isLoading ? 'Loading...' : `${totalItems} ${totalItems === 1 ? 'property' : 'properties'} found`}
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

            {/* Property & Opportunity Grid */}
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
                : (
                  <>
                    {/* Opportunity tiles */}
                    {opportunities.map((opp) => {
                      const ribbon = getOppRibbon(opp)
                      const coverUrl = opp.media?.find(m => m.isCover)?.url ?? opp.coverImage
                      return (
                        <div
                          key={`opp-${opp.id}`}
                          onClick={() => navigate(`/opportunity/${opp.slug}`)}
                          className="rounded-xl border border-gray-200/60 bg-white/80 backdrop-blur-sm overflow-hidden hover:shadow-lg hover:border-gray-300/60 transition-all cursor-pointer group"
                        >
                          <div className="aspect-video relative overflow-hidden bg-gray-100">
                            {coverUrl ? (
                              <img src={coverUrl} alt={opp.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <Building2 className="h-10 w-10" />
                              </div>
                            )}
                            {ribbon && (
                              <span className={`absolute top-3 left-3 px-2 py-1 text-xs font-bold text-white ${ribbon.bg} rounded-md`}>
                                {ribbon.label}
                              </span>
                            )}
                            <span className="absolute top-3 right-3 bg-primary text-white text-xs font-bold px-2 py-1 rounded-md capitalize">
                              {opp.vaultType} vault
                            </span>
                          </div>
                          <div className="p-4 space-y-2">
                            <h4 className="font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">{opp.title}</h4>
                            {opp.city && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" /> {opp.city}{opp.state ? `, ${opp.state}` : ''}
                              </p>
                            )}
                            {opp.targetAmount != null && (
                              <FundingBar raised={opp.raisedAmount ?? 0} target={opp.targetAmount} showLabels={false} />
                            )}
                            <div className="flex items-center justify-between text-xs pt-1">
                              {opp.targetIrr != null && (
                                <span className="font-mono font-semibold text-primary">{opp.targetIrr}% IRR</span>
                              )}
                              {opp.minInvestment != null && (
                                <span className="font-mono text-gray-600">{formatINR(opp.minInvestment)} min</span>
                              )}
                            </div>
                            {opp.company && (
                              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {opp.company.companyName}</span>
                                <span className="inline-flex items-center gap-1 text-primary font-medium">
                                  <HandCoins className="h-3.5 w-3.5" /> Explore
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {/* Property tiles */}
                    {properties.map((p) => (
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
                        status={p.status as StatusType}
                        onCardClick={() => navigate(`/marketplace/${p.slug}`)}
                        onInvestClick={() => navigate(`/marketplace/${p.slug}`)}
                        isAdmin={isAdmin}
                        propertyId={p.id}
                        onDelete={handleDeleteProperty}
                      />
                    ))}
                  </>
                )}
            </div>

            {/* Empty state */}
            {!isLoading && properties.length === 0 && opportunities.length === 0 && (
              <div className="text-center py-20">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-1">Nothing here yet 🏗️</h3>
                <p className="text-sm text-gray-500">Tweak those filters — your next opportunity could be one click away.</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(filters.page - 1)}
                  disabled={filters.page <= 1}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          : 'border border-gray-200 hover:bg-stone-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
                <button
                  onClick={() => setPage(filters.page + 1)}
                  disabled={filters.page >= totalPages}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Error toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 shadow-lg text-sm text-red-700 animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {toast}
          <button onClick={() => setToast(null)} className="ml-2 p-0.5 hover:bg-red-100 rounded">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </MainLayout>
  )
}
