import { PortalLayout } from '@/components/layout'
import MetricCard from '@/components/wealth/MetricCard'
import FundingBar from '@/components/wealth/FundingBar'
import StatusBadge from '@/components/wealth/StatusBadge'
import { formatINRCompact } from '@/lib/formatters'
import { Link } from 'react-router-dom'
import {
  Building2, Users, IndianRupee, ArrowRight, Clock,
  FileText, AlertCircle, PlusCircle,
} from 'lucide-react'

// Mock data — will be replaced with API hooks
const MOCK_METRICS = {
  totalRaised: 85000000,
  activeListings: 4,
  totalInvestors: 312,
  pendingDocuments: 2,
}

const MOCK_PROPERTIES = [
  {
    id: '1', title: 'Skyline Towers', city: 'Bengaluru', status: 'live' as const,
    raised: 32000000, target: 50000000, investors: 128,
  },
  {
    id: '2', title: 'Green Valley', city: 'Pune', status: 'upcoming' as const,
    raised: 0, target: 30000000, investors: 0,
  },
  {
    id: '3', title: 'Harbour Point', city: 'Mumbai', status: 'funded' as const,
    raised: 75000000, target: 75000000, investors: 184,
  },
]

export default function BuilderDashboardPage() {
  return (
    <PortalLayout variant="builder">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">Builder Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage your property listings</p>
          </div>
          <Link to="/portal/builder/listings/new" className="btn-primary inline-flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Add New Property
          </Link>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Raised"
            value={formatINRCompact(MOCK_METRICS.totalRaised)}
            icon={<IndianRupee className="h-5 w-5 text-primary" />}
          />
          <MetricCard
            label="Active Listings"
            value={String(MOCK_METRICS.activeListings)}
            icon={<Building2 className="h-5 w-5 text-primary" />}
          />
          <MetricCard
            label="Total Investors"
            value={String(MOCK_METRICS.totalInvestors)}
            icon={<Users className="h-5 w-5 text-primary" />}
          />
          <MetricCard
            label="Pending Documents"
            value={String(MOCK_METRICS.pendingDocuments)}
            icon={<FileText className="h-5 w-5 text-warning" />}
          />
        </div>

        {/* Alerts */}
        {MOCK_METRICS.pendingDocuments > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{MOCK_METRICS.pendingDocuments} documents need attention</p>
              <p className="text-xs text-gray-600 mt-0.5">Please upload pending property documents to maintain compliance.</p>
              <Link to="/portal/builder/documents" className="text-xs text-primary font-semibold hover:underline mt-1 inline-block">
                View Documents →
              </Link>
            </div>
          </div>
        )}

        {/* Property Cards */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-gray-900">My Properties</h2>
            <Link to="/portal/builder/listings" className="text-sm text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_PROPERTIES.map((p) => (
              <Link key={p.id} to={`/portal/builder/listings/${p.id}`} className="card p-5 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{p.title}</h3>
                    <p className="text-xs text-gray-500">{p.city}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <FundingBar raised={p.raised} target={p.target} showLabels showPercent showAmount />
                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {p.investors} investors
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Last updated 2d ago
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity placeholder */}
        <div className="card p-6">
          <h2 className="font-display text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {[
              { text: 'New investment of ₹2,00,000 in Skyline Towers', time: '2 hours ago' },
              { text: 'Document uploaded for Green Valley', time: '1 day ago' },
              { text: 'Harbour Point reached full funding target', time: '3 days ago' },
            ].map((activity, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="h-2 w-2 bg-primary rounded-full mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-700">{activity.text}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}
