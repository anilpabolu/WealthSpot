import { PortalLayout } from '@/components/layout'
import StatusBadge from '@/components/wealth/StatusBadge'
import FundingBar from '@/components/wealth/FundingBar'
import { formatINRCompact, formatPercent } from '@/lib/formatters'
import { Link } from 'react-router-dom'
import { PlusCircle, Building2, Search, Eye, Edit, Trash2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { DataTable, Select, type Column } from '@/components/ui'
import { useContent } from '@/hooks/useSiteContent'
import { useBuilderListings, type BuilderListing } from '@/hooks/useBuilderListings'

export default function BuilderListingsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const { listings, isLoading } = useBuilderListings()

  const filtered = listings.filter((l) => {
    if (search && !l.title.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter && l.status !== statusFilter) return false
    return true
  })

  return (
    <PortalLayout variant="builder">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="section-title text-2xl">{useContent('builder_listings', 'page_title', 'My Listings')}</h1>
            <p className="text-theme-secondary mt-1">{useContent('builder_listings', 'page_subtitle', 'Manage and track your property listings')}</p>
          </div>
          <Link to="/portal/builder/listings/new" className="btn-primary inline-flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Property
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-tertiary" />
            <input
              type="search"
              placeholder="Search listings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-[var(--bg-surface)] border border-theme rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'live', label: 'Live' },
              { value: 'upcoming', label: 'Upcoming' },
              { value: 'funded', label: 'Funded' },
              { value: 'closed', label: 'Closed' },
            ]}
            className="w-44"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-theme-secondary">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading listings…
          </div>
        ) : (
        <DataTable
          data={filtered}
          keyExtractor={(l) => l.id}
          emptyMessage="No listings found"
          emptyIcon={Building2}
          columns={[
            {
              key: 'property',
              header: 'Property',
              render: (l) => (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-theme-surface-hover flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-theme-tertiary" />
                  </div>
                  <div>
                    <p className="font-medium text-theme-primary">{l.title}</p>
                    <p className="text-xs text-theme-secondary">{l.micromarket}, {l.city} · {l.assetType}</p>
                  </div>
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              headerClassName: 'text-center',
              className: 'text-center',
              render: (l) => <StatusBadge status={l.status} />,
            },
            {
              key: 'irr',
              header: 'Target IRR',
              headerClassName: 'text-right',
              className: 'text-right font-mono font-semibold text-primary',
              render: (l) => <>{formatPercent(l.irr)}</>,
            },
            {
              key: 'minInvest',
              header: 'Min Invest',
              headerClassName: 'text-right',
              className: 'text-right font-mono',
              render: (l) => <>{formatINRCompact(l.minInvest)}</>,
            },
            {
              key: 'funding',
              header: 'Funding',
              className: 'min-w-[160px]',
              render: (l) => <FundingBar raised={l.raised} target={l.target} showPercent />,
            },
            {
              key: 'investors',
              header: 'Investors',
              headerClassName: 'text-right',
              className: 'text-right',
              render: (l) => <>{l.investors}</>,
            },
            {
              key: 'actions',
              header: 'Actions',
              headerClassName: 'text-center',
              render: (l) => (
                <div className="flex items-center justify-center gap-1">
                  <Link to={`/portal/builder/listings/${l.id}`} className="p-1.5 rounded hover:bg-[var(--bg-surface-hover)] text-theme-secondary hover:text-primary" title="View">
                    <Eye className="h-4 w-4" />
                  </Link>
                  <Link to={`/portal/builder/listings/${l.id}/edit`} className="p-1.5 rounded hover:bg-[var(--bg-surface-hover)] text-theme-secondary hover:text-primary" title="Edit">
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button className="p-1.5 rounded hover:bg-red-50 dark:bg-red-900/30 text-theme-secondary hover:text-danger" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ),
            },
          ] as Column<BuilderListing>[]}
        />
        )}
      </div>
    </PortalLayout>
  )
}
