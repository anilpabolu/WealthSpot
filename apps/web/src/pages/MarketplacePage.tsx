import { MainLayout } from '@/components/layout'
import SEOHead from '@/components/SEOHead'
import { type StatusType } from '@/components/wealth/StatusBadge'
import PropertyCard from '@/components/wealth/PropertyCard'
import { useProperties, type Property } from '@/hooks/useProperties'
import { useOpportunities } from '@/hooks/useOpportunities'
import { useMarketplaceStore } from '@/stores/marketplace.store'
import { useVaultConfig } from '@/hooks/useVaultConfig'
import { useContent } from '@/hooks/useSiteContent'
import { VaultComingSoonBanner } from '@/components/VaultComingSoonOverlay'
import { ASSET_TYPES, INDIAN_CITIES } from '@/lib/constants'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, Grid3X3, List, X, Building2, MapPin, AlertCircle, Trash2, Gift, Edit2, ChevronRight, Plus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Select } from '@/components/ui'

import { ShieldInfoModal } from '@/components/shield/ShieldInfoModal'

const VAULT_HERO_IMAGES: Record<string, string> = {
  wealth: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1400&auto=format&fit=crop&q=90',
  safe:   'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1400&auto=format&fit=crop&q=90',
  community: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1400&auto=format&fit=crop&q=90',
}
import { useUserStore } from '@/stores/user.store'
import { useQueryClient } from '@tanstack/react-query'
import { apiDelete } from '@/lib/api'
import { shareOpportunityDynamic } from '@/lib/shareOpportunity'

/* ------------------------------------------------------------------ */
/*  Per-vault hero theming (gradient · accent · copy)                  */
/* ------------------------------------------------------------------ */

const VAULT_HERO_CONFIG: Record<
  string,
  {
    badge: string
    leftGradient: string
    rightGradient: string
    mobileGradient: string
    separatorRgba: [string, string]
    accentDot: string
    accentText: string
    defaultTitle: string
    defaultSubtitle: string
    shieldNote: string
    cmsTag: string
  }
> = {
  wealth: {
    badge: 'Wealth Vault',
    leftGradient: 'from-slate-900 via-indigo-950 to-slate-900',
    rightGradient: 'from-indigo-950/80 via-purple-950/60 to-slate-900',
    mobileGradient: 'from-slate-900 via-indigo-950 to-slate-900',
    separatorRgba: ['rgba(99,102,241,0.15)', 'rgba(139,92,246,0.08)'],
    accentDot: 'bg-emerald-400',
    accentText: 'text-emerald-400',
    defaultTitle: 'Wealth Vault',
    defaultSubtitle: "Discover curated investment opportunities across India\u2019s top cities.",
    shieldNote:
      'Every listing passes through a rigorous 7-layer Shield review \u2014 from builder credibility to exit clauses \u2014 before it earns',
    cmsTag: 'wealth',
  },
  safe: {
    badge: 'Safe Vault',
    leftGradient: 'from-[#0D4A3A] via-[#145C47] to-[#0D4A3A]',
    rightGradient: 'from-[#145C47]/80 via-[#0A3A2E]/60 to-[#0D4A3A]',
    mobileGradient: 'from-[#0D4A3A] via-[#145C47] to-[#0D4A3A]',
    separatorRgba: ['rgba(32,227,178,0.15)', 'rgba(32,227,178,0.08)'],
    accentDot: 'bg-[#20E3B2]',
    accentText: 'text-[#20E3B2]',
    defaultTitle: 'Safe Vault',
    defaultSubtitle: 'Fixed-return investments secured by mortgage agreements and real property.',
    shieldNote:
      'Every project passes through a rigorous 7-layer Shield review — from builder credibility to mortgage documentation — before it earns',
    cmsTag: 'safe',
  },
  community: {
    badge: 'Community Vault',
    leftGradient: 'from-[#2E1A06] via-[#4A2A0A] to-[#2E1A06]',
    rightGradient: 'from-[#3D2008]/80 via-[#1A3D2E]/60 to-[#2E1A06]',
    mobileGradient: 'from-[#2E1A06] via-[#4A2A0A] to-[#2E1A06]',
    separatorRgba: ['rgba(6,95,70,0.15)', 'rgba(217,119,6,0.08)'],
    accentDot: 'bg-[#F59E0B]',
    accentText: 'text-[#F59E0B]',
    defaultTitle: 'Community Vault',
    defaultSubtitle: 'Co-invest and co-partner with like-minded collaborators on curated deals.',
    shieldNote:
      'Every community deal passes through a rigorous 7-layer Shield review \u2014 from partner credibility to exit clauses \u2014 before it earns',
    cmsTag: 'community',
  },
}

function FilterSidebar({ vaultParam }: { vaultParam?: string }) {
  const { filters, setFilter, resetFilters } = useMarketplaceStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isSafe = vaultParam === 'safe'
  const isWealth = !vaultParam || vaultParam === 'wealth'

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

      {/* Asset Type — Wealth Vault only */}
      {isWealth && (
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
      )}

      {/* Payout Frequency — Safe Vault only */}
      {isSafe && (
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-theme-secondary mb-2 block">Payout Frequency</label>
          <div className="flex flex-wrap gap-2">
            {(['', 'monthly', 'quarterly', 'yearly'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter('payoutFrequency', f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:shadow-md ${
                  filters.payoutFrequency === f
                    ? 'bg-[#20E3B2] text-[#0D4A3A] font-bold shadow-md'
                    : 'bg-theme-surface-hover text-theme-secondary hover:bg-[var(--bg-surface-hover)] shadow-sm'
                }`}
              >
                {f === '' ? 'Any' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-theme-secondary mb-2 block">Status</label>
        <div className="flex flex-wrap gap-2">
          {(['', 'upcoming', 'live', 'fully_funded', 'deal_closed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter('status', s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:shadow-md ${
                filters.status === s
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-theme-surface-hover text-theme-secondary hover:bg-[var(--bg-surface-hover)] shadow-sm'
              }`}
            >
              {s === '' ? 'All' : s === 'upcoming' ? 'Upcoming' : s === 'live' ? 'Live' : s === 'fully_funded' ? 'Fully Funded' : 'Deal Closed'}
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
            { value: 'funding', label: 'Most Funded' },
            { value: 'price_low', label: 'Lowest Price' },
            { value: 'price_high', label: 'Highest Price' },
          ]}
        />
      </div>

      {/* Reset */}
      <button onClick={resetFilters} className="btn-ghost text-sm w-full shadow-sm hover:shadow-md transition-shadow">
        Reset All Filters
      </button>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-gray-200 shadow-[4px_0_24px_rgba(0,0,0,0.06)] sticky top-[4.5rem] h-[calc(100vh-4.5rem)] bg-white z-10 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <h3 className="font-display font-bold text-gray-900 mb-6 flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
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

export default function MarketplacePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { filters, viewMode, setViewMode, setPage, setFilter: _setFilter } = useMarketplaceStore()

  // Map display-level status filters to backend status values
  const STATUS_MAP: Record<string, string> = {
    upcoming: 'approved',
    live: 'active,funding',
    fully_funded: 'funded',
    deal_closed: 'closed,exited',
  }
  // Public default: never expose draft/pending_approval to investors
  // 'approved' = upcoming (funding_open_at in future) — must be included so
  // approved-but-not-yet-active listings are visible on the vault pages.
  const PUBLIC_STATUSES = 'approved,active,funding,funded,closed'
  const apiStatus = filters.status ? (STATUS_MAP[filters.status] ?? filters.status) : ''
  const effectiveStatus = apiStatus || PUBLIC_STATUSES
  const apiFilters = { ...filters, status: apiStatus }

  const { data, isLoading } = useProperties(apiFilters)
  const queryClient = useQueryClient()
  const userRole = useUserStore((s) => s.user?.role)
  const userReferralCode = useUserStore((s) => s.user?.referralCode)
  const isAdmin = userRole === 'admin' || userRole === 'super_admin'
  const [toast, setToast] = useState<string | null>(null)
  const [showShieldPopup, setShowShieldPopup] = useState(false)

  // Vault hero config (keyed by ?vault= param, defaults to wealth)
  const vaultParam = searchParams.get('vault') ?? ''
  const vaultKey = (vaultParam || 'wealth') as string
  const hero = VAULT_HERO_CONFIG[vaultKey] ?? VAULT_HERO_CONFIG.wealth!

  // CMS content — tagged per vault so each vault can have unique copy
  const heroSubtitle = useContent('marketplace', `hero_subtitle_${hero.cmsTag}`, hero.defaultSubtitle)
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

  const subtypeParam = searchParams.get('subtype') ?? ''
  const { isVaultEnabled } = useVaultConfig()
  const isVaultDisabled = vaultParam && !isVaultEnabled(vaultParam)

  // Fetch all opportunities for the active vault — always filter to non-draft statuses
  const { data: oppsData } = useOpportunities(
    vaultParam
      ? { vaultType: vaultParam, ...(subtypeParam && { communitySubtype: subtypeParam }), city: filters.city || undefined, status: effectiveStatus }
      : { city: filters.city || undefined, status: effectiveStatus }
  )
  // Client-side filter for Safe Vault payout frequency (stored in JSONB safe_vault_data)
  const opportunities = (oppsData?.items ?? []).filter((opp) => {
    if (!filters.payoutFrequency) return true
    return (opp.safeVaultData as { payout_frequency?: string } | null)?.payout_frequency === filters.payoutFrequency
  })

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
      <SEOHead
        title="Marketplace"
        description="Browse premium fractional real estate and investment opportunities on WealthSpot. Wealth, Safe, and Community Vaults."
        path="/marketplace"
      />
      <ShieldInfoModal open={showShieldPopup} onClose={() => setShowShieldPopup(false)} />

      {/* New Hero Section */}
      <div className="relative border-b border-theme/20 pt-24 pb-8 px-6 sm:px-8 overflow-hidden bg-black">
        {/* Background Image - Matches Vault Page */}
        <img
          src={VAULT_HERO_IMAGES[vaultKey] || VAULT_HERO_IMAGES.wealth}
          alt="Vault Background"
          className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
              {hero.badge}
            </h1>
            <p className="text-base md:text-lg text-white/80 max-w-2xl leading-relaxed font-light">
              {heroSubtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 w-full bg-white min-h-screen">
        <FilterSidebar vaultParam={vaultParam} />

        <div className="flex-1 min-w-0 p-6 lg:p-10">
          {/* Vault disabled banner */}
          {isVaultDisabled && (
            <VaultComingSoonBanner vaultId={vaultParam} onExploreOther={clearVault} />
          )}

          {/* Community subtype filter chips */}
          {vaultParam === 'community' && (
            <div className="flex items-center gap-2 mb-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mr-1">Type:</span>
              {([['', 'All'], ['co_investor', 'Co-Investor'], ['co_partner', 'Co-Partner']] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => handleCommunityFilter(val)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all hover:shadow-md ${
                    communityFilter === val
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-sm'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

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
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 w-full max-w-none'
                  : 'space-y-6 w-full max-w-none'
              }
            >
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <PropertyCard key={i} isLoading title="" city="" assetType="" coverImage="" minInvestment={0} raised={0} target={0} />
                  ))
                : (
                  <>
                    {/* Opportunity tiles */}
                    {opportunities.map((opp) => {
                      const coverUrl = opp.media?.find((m: any) => m.isCover)?.url ?? opp.coverImage ?? opp.gallery?.[0]
                      const rawStatus = (opp.status ?? '').toLowerCase()
                      const oppStatus = rawStatus === 'approved' ? 'Upcoming' : (rawStatus === 'active' || rawStatus === 'funding' ? 'Live' : (rawStatus === 'funded' ? 'Fully Funded' : (rawStatus === 'closed' || rawStatus === 'exited' ? 'Deal Closed' : rawStatus)))
                      
                      const allImages = opp.media?.length ? opp.media.map((m: any) => m.url) : (coverUrl ? [coverUrl] : [])
                      // Duplicate single image so it can be scrolled endlessly
                      const carouselImages = allImages.length === 1 ? [allImages[0], allImages[0], allImages[0]] : allImages

                      const tenure = (opp as any).tenure ?? '3 yr'
                      return (
                        <div
                          key={`opp-${opp.id}`}
                          onClick={() => navigate(`/opportunity/${opp.slug}`)}
                          className="bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgb(0,0,0,0.12)] border border-gray-100 hover:-translate-y-1.5 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer group flex flex-col h-full"
                        >
                          <div className="aspect-[4/3] relative bg-gray-100 overflow-hidden">
                            {carouselImages.length > 0 ? (
                              <div className="absolute inset-0 w-full h-full flex overflow-x-auto snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {carouselImages.map((url: string, idx: number) => (
                                  <div key={idx} className="w-full h-full flex-shrink-0 snap-center overflow-hidden relative">
                                    <img src={url} alt={`${opp.title} ${idx}`} className="absolute inset-0 block w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105" loading="lazy" />
                                  </div>
                                ))}
                                <style>{`.snap-x::-webkit-scrollbar { display: none; }`}</style>
                              </div>
                            ) : (
                              <div className="absolute inset-0 w-full h-full flex items-center justify-center text-gray-300">
                                <Building2 className="h-10 w-10" />
                              </div>
                            )}
                            
                            {/* Status Ribbon */}
                            {oppStatus && (
                               <div className="absolute top-4 right-0 bg-white shadow-md pl-4 pr-3 py-1.5 rounded-l-full z-10 font-bold text-xs uppercase tracking-wider text-gray-800">
                                 {oppStatus}
                               </div>
                            )}

                            {/* Admin Controls */}
                            {isAdmin && (
                              <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                                <button
                                  className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    navigate(`/portal/builder/listings/${opp.id}/edit`)
                                  }}
                                  title="Edit listing"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  className="flex items-center justify-center h-8 w-8 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteOpportunity(opp.id, opp.title)
                                  }}
                                  title="Archive listing"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          
                          <div className="p-4 md:p-5 flex-1 flex flex-col">
                            <h3 className="font-display text-lg md:text-xl font-bold text-gray-900 mb-1.5 truncate">{opp.title}</h3>
                            
                            <div className="flex flex-wrap items-center gap-2 mb-4 text-[11px] text-gray-500 font-medium">
                              {opp.property_type && (
                                <span className="flex items-center gap-1"><Building2 className="h-3 w-3 text-blue-500" /> {opp.property_type.replace(/_/g, ' ')}</span>
                              )}
                              {opp.city && (
                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-red-500" /> {opp.city}</span>
                              )}
                            </div>

                            {/* Specs Grid */}
                            <div className="grid grid-cols-2 gap-2 mb-5">
                               <div>
                                 <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">Tenure</p>
                                 <p className="font-display text-base font-bold text-gray-900">{tenure}</p>
                               </div>
                               <div>
                                 <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">Min. Entry</p>
                                 <p className="font-display text-base font-bold text-gray-900">
                                   {opp.minInvestment != null ? formatINR(opp.minInvestment) : 'TBD'}
                                 </p>
                               </div>
                            </div>

                            <div className="mt-auto flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   const btn = e.currentTarget;
                                   const originalHTML = btn.innerHTML;
                                   btn.innerHTML = '<span class="animate-pulse">Generating...</span>';
                                   btn.disabled = true;
                                   
                                   shareOpportunityDynamic({
                                     title: opp.title,
                                     targetIRR: (opp as any).targetIRR ?? '14%',
                                     tenure: (opp as any).tenure ?? '3 yr',
                                     minEntry: opp.minInvestment != null ? formatINR(opp.minInvestment) : 'TBD',
                                     coverImage: coverUrl,
                                     city: opp.city || undefined,
                                     slug: opp.slug,
                                     referralCode: userReferralCode || undefined
                                   }).catch(() => {/* shareOpportunityDynamic handles all errors internally */}).finally(() => {
                                     btn.innerHTML = originalHTML;
                                     btn.disabled = false;
                                   });
                                 }}
                                 className="px-5 py-2.5 rounded-full bg-[#D4AF37] hover:bg-[#B8962E] text-white font-semibold text-sm transition-colors flex items-center gap-1.5 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                               >
                                 <Gift className="h-4 w-4" /> Refer & Earn
                               </button>
                               <button className="px-4 py-2 rounded-full border border-theme-primary text-theme-primary font-semibold text-xs hover:bg-purple-50 transition-colors duration-300 flex items-center gap-1 shadow-sm hover:shadow-md">
                                 Express Interest <ChevronRight className="h-3.5 w-3.5" />
                               </button>
                            </div>
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
                        minInvestment={p.minInvestment}
                        raised={p.raised}
                        target={p.target}
                        investorCount={p.investorCount}
                        status={p.status as StatusType}
                        onCardClick={() => navigate(`/marketplace/${p.slug}`)}
                        onInvestClick={() => navigate(`/marketplace/${p.slug}`)}
                        isAdmin={isAdmin}
                        propertyId={p.id}
                        onDelete={handleDeleteProperty}
                      />
                    ))}
                    {userRole === 'super_admin' && (
                      <div
                        onClick={() => navigate(vaultParam ? `/create-opportunity?vault=${vaultParam}` : '/create-opportunity')}
                        className="bg-white rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:shadow-[0_24px_60px_rgba(0,0,0,0.16)] border-2 border-dashed border-gray-300 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all cursor-pointer group flex flex-col h-full min-h-[400px] items-center justify-center text-center p-8"
                      >
                        <div className="h-16 w-16 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center mb-4 group-hover:bg-[#D4AF37] transition-colors">
                          <Plus className="h-8 w-8 text-gray-400 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="font-display text-xl font-bold text-gray-900 group-hover:text-[#D4AF37] transition-colors">Create New Opportunity</h3>
                        <p className="text-sm text-gray-500 mt-2">Add a new investment listing to this vault</p>
                      </div>
                    )}
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
