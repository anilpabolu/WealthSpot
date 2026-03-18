import { MainLayout } from '@/components/layout'
import PropertyCard from '@/components/wealth/PropertyCard'
import { useProperties, type Property } from '@/hooks/useProperties'
import { useMarketplaceStore } from '@/stores/marketplace.store'
import { ASSET_TYPES, INDIAN_CITIES } from '@/lib/constants'
import { useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal, Grid3X3, List, X } from 'lucide-react'
import { useState } from 'react'

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
          {['', 'active', 'funding', 'funded'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter('status', s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filters.status === s
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
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

export default function MarketplacePage() {
  const navigate = useNavigate()
  const { filters, viewMode, setViewMode, setPage } = useMarketplaceStore()
  const { data, isLoading } = useProperties(filters)

  const properties = data?.properties ?? ([] as Property[])
  const totalPages = data?.totalPages ?? 1

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-gray-900">Property Marketplace</h1>
          <p className="text-gray-500 mt-1">Discover RERA-verified investment opportunities</p>
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="search"
            placeholder="Search by property name, city, or RERA number..."
            className="w-full pl-11 pr-4 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

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
                      targetIrr={p.targetIrr}
                      minInvestment={p.minInvestment}
                      raised={p.raised}
                      target={p.target}
                      investorCount={p.investorCount}
                      reraNumber={p.reraNumber}
                      onCardClick={() => navigate(`/marketplace/${p.slug}`)}
                      onInvestClick={() => navigate(`/marketplace/${p.slug}`)}
                    />
                  ))}
            </div>

            {/* Empty state */}
            {!isLoading && properties.length === 0 && (
              <div className="text-center py-20">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-1">No properties found</h3>
                <p className="text-sm text-gray-500">Try adjusting your filters to see more results.</p>
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
