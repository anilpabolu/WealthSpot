import { PortalLayout } from '@/components/layout'
import StatusBadge from '@/components/wealth/StatusBadge'
import FundingBar from '@/components/wealth/FundingBar'
import { formatINRCompact, formatPercent } from '@/lib/formatters'
import { Link } from 'react-router-dom'
import { PlusCircle, Building2, Search, Eye, Edit, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { DataTable, Select, type Column } from '@/components/ui'

const MOCK_LISTINGS = [
  {
    id: '1', title: 'Skyline Towers', city: 'Bengaluru', micromarket: 'Whitefield',
    assetType: 'Residential', status: 'live' as const, irr: 14.5, minInvest: 50000,
    raised: 32000000, target: 50000000, investors: 128, image: '',
  },
  {
    id: '2', title: 'Green Valley Residences', city: 'Pune', micromarket: 'Hinjewadi',
    assetType: 'Residential', status: 'upcoming' as const, irr: 12.0, minInvest: 25000,
    raised: 0, target: 30000000, investors: 0, image: '',
  },
  {
    id: '3', title: 'Harbour Point Office', city: 'Mumbai', micromarket: 'BKC',
    assetType: 'Commercial', status: 'funded' as const, irr: 16.2, minInvest: 100000,
    raised: 75000000, target: 75000000, investors: 184, image: '',
  },
  {
    id: '4', title: 'Warehouse Hub', city: 'Hyderabad', micromarket: 'Shamshabad',
    assetType: 'Warehouse', status: 'live' as const, irr: 11.8, minInvest: 75000,
    raised: 18000000, target: 40000000, investors: 67, image: '',
  },
]

export default function BuilderListingsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = MOCK_LISTINGS.filter((l) => {
    if (search && !l.title.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter && l.status !== statusFilter) return false
    return true
  })

  return (
    <PortalLayout variant="builder">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="section-title text-2xl">My Listings</h1>
            <p className="text-gray-500 mt-1">Manage and track your property listings</p>
          </div>
          <Link to="/portal/builder/listings/new" className="btn-primary inline-flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Property
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search listings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
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
                  <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{l.title}</p>
                    <p className="text-xs text-gray-500">{l.micromarket}, {l.city} · {l.assetType}</p>
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
                  <Link to={`/portal/builder/listings/${l.id}`} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-primary" title="View">
                    <Eye className="h-4 w-4" />
                  </Link>
                  <Link to={`/portal/builder/listings/${l.id}/edit`} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-primary" title="Edit">
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-danger" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ),
            },
          ] as Column<typeof filtered[number]>[]}
        />
      </div>
    </PortalLayout>
  )
}
