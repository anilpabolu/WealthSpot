import { MainLayout } from '@/components/layout'
import { type StatusType } from '@/components/wealth/StatusBadge'
import PropertyCard from '@/components/wealth/PropertyCard'
import FundingBar from '@/components/wealth/FundingBar'
import { useProperties, type Property } from '@/hooks/useProperties'
import { useOpportunities, type OpportunityItem } from '@/hooks/useOpportunities'
import { useMarketplaceStore } from '@/stores/marketplace.store'
import { useVaultConfig } from '@/hooks/useVaultConfig'
import { useContent } from '@/hooks/useSiteContent'
import { VaultComingSoonBanner } from '@/components/VaultComingSoonOverlay'
import { ASSET_TYPES, INDIAN_CITIES } from '@/lib/constants'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, Grid3X3, List, X, Building2, Rocket, Users, MapPin, HandCoins, AlertCircle, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Select } from '@/components/ui'
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
        <label className="text-xs font-semibold uppercase tracking-wider text-theme-secondary mb-2 block">City</label>
        <Select
          value={filters.city}
          onChange={(v) => setFilter('city', v)}
          options={[
            { value: '', label: 'All Cities' },
            ...INDIAN_CITIES.map((c) => ({ value: c, label: c })),
          ]}
        />
      </div>

      {/* Asset Type */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-theme-secondary mb-2 block">Asset Type</label>
        <Select
          value={filters.assetType}
          onChange={(v) => setFilter('assetType', v)}
          options={[
            { value: '', label: 'All Types' },
            ...Object.values(ASSET_TYPES).map((t) => ({ value: t, label: t.replace('_', ' ') })),
          ]}
        />
      </div>

      {/* Status */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-theme-secondary mb-2 block">Status</label>
        <div className="flex flex-wrap gap-2">
          {(['', 'active', 'funding', 'funded'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter('status', s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filters.status === s
                  ? 'bg-primary text-white'
                  : 'bg-theme-surface-hover text-theme-secondary hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              {s === '' ? 'All' : s === 'active' ? 'Active' : s === 'funding' ? 'Funding' : 'Fully Funded'}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-theme-secondary mb-2 block">Sort By</label>
        <Select
          value={filters.sortBy}
          onChange={(v) => setFilter('sortBy', v as typeof filters.sortBy)}
          options={[
            { value: 'newest', label: 'Newest First' },
            { value: 'irr_high', label: 'Highest IRR' },
            { value: 'irr_low', label: 'Lowest IRR' },
            { value: 'funding', label: 'Most Funded' },
            { value: 'price_low', label: 'Lowest Price' },
            { value: 'price_high', label: 'Highest Price' },
          ]}
        />
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
          <h3 className="font-semibold text-theme-primary mb-4 flex items-center gap-2">
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
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-[var(--bg-surface)] p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-theme-primary flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </h3>
              <button onClick={() => setMobileOpen(false)} className="p-1 rounded hover:bg-[var(--bg-surface-hover)]">
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

/** Format number as compact INR (e.g. ₹2.5 Cr, ₹1.2 L) */
function formatINR(num: number): string {
  if (num >= 1e7) return `₹${(num / 1e7).toFixed(1).replace(/\.0$/, '')} Cr`
  if (num >= 1e5) return `₹${(num / 1e5).toFixed(1).replace(/\.0$/, '')} L`
  if (num >= 1e3) return `₹${(num / 1e3).toFixed(1).replace(/\.0$/, '')} K`
  return `₹${num.toLocaleString('en-IN')}`
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
    color: 'bg-violet-50 dark:bg-violet-900/30 border-violet-200 dark:border-violet-700/40 text-violet-700 dark:text-violet-300',
    Icon: Rocket,
  },
  community: {
    label: 'Community Vault',
    description: 'Community-driven opportunities — sports complexes, co-working spaces, and local businesses.',
    color: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-300',
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

  // CMS content
  const heroBadge = useContent('marketplace', 'hero_badge', 'Marketplace')
  const heroTitle = useContent('marketplace', 'hero_title', 'Property Marketplace')
  const heroSubtitle = useContent('marketplace', 'hero_subtitle', "Discover RERA-verified investment opportunities across India's top cities.")
  const emptyTitle = useContent('marketplace', 'empty_title', 'Nothing here yet \u{1F3D7}\uFE0F')
  const emptyMessage = useContent('marketplace', 'empty_message', 'Tweak those filters — your next opportunity could be one click away.')

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

  const handleDeleteOpportunity = async (opportunityId: string, title: string) => {
    if (!window.confirm(`Archive "${title}"? It will no longer appear in listings.`)) return
    try {
      await apiDelete(`/opportunities/${opportunityId}`)
      queryClient.invalidateQueries({ queryKey: ['opportunities'] })
    } catch {
      setToast('Failed to archive opportunity. Please try again.')
    }
  }

  const vaultParam = searchParams.get('vault') ?? ''
  const subtypeParam = searchParams.get('subtype') ?? ''
  const vaultMeta = VAULT_META[vaultParam]
  const { isVaultEnabled } = useVaultConfig()
  const isVaultDisabled = vaultParam && !isVaultEnabled(vaultParam)

  // Fetch all opportunities for the active vault (no status filter — show all with ribbons)
  const { data: oppsData } = useOpportunities(
    vaultParam
      ? { vaultType: vaultParam, ...(subtypeParam && { communitySubtype: subtypeParam }), city: filters.city || undefined, status: filters.status || undefined }
      : filters.city || filters.status
        ? { city: filters.city || undefined, status: filters.status || undefined }
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
          <span className="page-hero-badge">{heroBadge}</span>
          <h1 className="page-hero-title">{heroTitle}</h1>
          <p className="page-hero-subtitle">{heroSubtitle}</p>
        </div>
      </div>

      <div className="page-section">
        <div className="page-section-container">
        {/* Vault disabled banner */}
        {isVaultDisabled && (
          <VaultComingSoonBanner vaultId={vaultParam} onExploreOther={clearVault} />
        )}

        {/* Community subtype filter chips */}
        {vaultParam === 'community' && (
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-tertiary mr-1">Type:</span>
            {([['', 'All'], ['co_investor', 'Co-Investor'], ['co_partner', 'Co-Partner']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => handleCommunityFilter(val)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  communityFilter === val
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-theme-surface-hover text-theme-secondary hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-8">
          <FilterSidebar />

          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-theme-secondary">
                {isLoading ? 'Loading...' : `${totalItems} ${totalItems === 1 ? 'property' : 'properties'} found`}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-theme-tertiary hover:bg-[var(--bg-surface-hover)]'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-theme-tertiary hover:bg-[var(--bg-surface-hover)]'
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
                          className="rounded-xl border border-theme/60 bg-[var(--bg-card)] backdrop-blur-sm overflow-hidden hover:shadow-lg hover:border-theme/60 transition-all cursor-pointer group"
                        >
                          <div className="aspect-video relative overflow-hidden bg-theme-surface-hover">
                            {coverUrl ? (
                              <img src={coverUrl} alt={opp.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-theme-tertiary">
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
                            {isAdmin && (
                              <button
                                className="absolute bottom-3 right-3 z-10 flex items-center justify-center h-7 w-7 rounded-full bg-red-600/90 hover:bg-red-700 text-white shadow-lg transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteOpportunity(opp.id, opp.title)
                                }}
                                aria-label={`Archive ${opp.title}`}
                                title="Archive this listing"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="p-4 space-y-2">
                            <h4 className="font-semibold text-theme-primary truncate group-hover:text-primary transition-colors">{opp.title}</h4>
                            {opp.city && (
                              <p className="text-xs text-theme-secondary flex items-center gap-1">
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
                                <span className="font-mono text-theme-secondary">{formatINR(opp.minInvestment)} min</span>
                              )}
                            </div>
                            {opp.company && (
                              <div className="pt-2 border-t border-theme flex items-center justify-between text-xs text-theme-secondary">
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
                <Search className="h-12 w-12 text-theme-tertiary mx-auto mb-4" />
                <h3 className="font-semibold text-theme-primary mb-1">{emptyTitle}</h3>
                <p className="text-sm text-theme-secondary">{emptyMessage}</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(filters.page - 1)}
                  disabled={filters.page <= 1}
                  className="px-3 py-2 text-sm rounded-lg border border-theme hover:bg-theme-surface disabled:opacity-50 disabled:cursor-not-allowed"
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
                          : 'border border-theme hover:bg-theme-surface'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
                <button
                  onClick={() => setPage(filters.page + 1)}
                  disabled={filters.page >= totalPages}
                  className="px-3 py-2 text-sm rounded-lg border border-theme hover:bg-theme-surface disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/40 shadow-lg text-sm text-red-700 dark:text-red-300 animate-fade-in">
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
