import { PortalLayout } from '@/components/layout'
import StatusBadge from '@/components/wealth/StatusBadge'
import FundingBar from '@/components/wealth/FundingBar'
import { formatINRCompact, formatPercent } from '@/lib/formatters'
import { Link } from 'react-router-dom'
import { PlusCircle, Building2, Search, Eye, Edit, Trash2 } from 'lucide-react'
import { useState } from 'react'

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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All Statuses</option>
            <option value="live">Live</option>
            <option value="upcoming">Upcoming</option>
            <option value="funded">Funded</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase text-gray-500">Property</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold uppercase text-gray-500">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold uppercase text-gray-500">Target IRR</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold uppercase text-gray-500">Min Invest</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-500">Funding</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold uppercase text-gray-500">Investors</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold uppercase text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <Building2 className="h-5 w-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{l.title}</p>
                          <p className="text-xs text-gray-500">{l.micromarket}, {l.city} · {l.assetType}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-semibold text-primary">
                      {formatPercent(l.irr)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono">
                      {formatINRCompact(l.minInvest)}
                    </td>
                    <td className="px-6 py-4 min-w-[160px]">
                      <FundingBar raised={l.raised} target={l.target} showPercent />
                    </td>
                    <td className="px-6 py-4 text-right">{l.investors}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          to={`/portal/builder/listings/${l.id}`}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-primary"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/portal/builder/listings/${l.id}/edit`}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-primary"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-danger"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No listings found</p>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  )
}
