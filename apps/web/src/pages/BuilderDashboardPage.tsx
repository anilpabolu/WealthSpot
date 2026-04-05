import { PortalLayout } from '@/components/layout'
import MetricCard from '@/components/wealth/MetricCard'
import FundingBar from '@/components/wealth/FundingBar'
import StatusBadge from '@/components/wealth/StatusBadge'
import { formatINRCompact } from '@/lib/formatters'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { dashboardBff } from '@/services/bff/dashboard.bff'
import {
  Building2, Users, IndianRupee, ArrowRight, Clock,
  AlertCircle, PlusCircle, Loader2,
} from 'lucide-react'

export default function BuilderDashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['builder-dashboard'],
    queryFn: () => dashboardBff.getBuilderDashboard(),
    staleTime: 60_000,
  })

  const stats = data?.stats
  const listings = data?.listings ?? []

  return (
    <PortalLayout variant="builder">
      {/* Hero */}
      <div className="page-hero bg-gradient-to-br from-[#1B2A4A] via-[#2D3F5E] to-[#1B2A4A]">
        <div className="page-hero-content flex items-center justify-between">
          <div>
            <span className="page-hero-badge">Builder Portal</span>
            <h1 className="page-hero-title">Builder Dashboard</h1>
            <p className="page-hero-subtitle">Manage your property listings and track investor activity.</p>
          </div>
          <Link to="/portal/builder/listings/new" className="btn-gradient bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hidden sm:inline-flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Add New Property
          </Link>
        </div>
      </div>

      <div className="page-section">
        <div className="page-section-container space-y-6">

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            Failed to load dashboard data. Please try again later.
          </div>
        )}

        {stats && (
          <>
            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Total Raised"
                value={formatINRCompact(stats.total_raised)}
                icon={<IndianRupee className="h-5 w-5 text-primary" />}
              />
              <MetricCard
                label="Active Listings"
                value={String(stats.active_count)}
                icon={<Building2 className="h-5 w-5 text-primary" />}
              />
              <MetricCard
                label="Total Investors"
                value={String(stats.investor_count)}
                icon={<Users className="h-5 w-5 text-primary" />}
              />
              <MetricCard
                label="Total Properties"
                value={String(listings.length)}
                icon={<Building2 className="h-5 w-5 text-primary" />}
              />
            </div>

            {/* Property Cards */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title text-lg">My Properties</h2>
                <Link to="/portal/builder/listings" className="text-sm text-primary hover:underline flex items-center gap-1">
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {listings.length === 0 ? (
                <div className="card p-8 text-center">
                  <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No properties yet. Create your first listing!</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {listings.slice(0, 6).map((p) => (
                    <Link key={p.id} to={`/portal/builder/listings/${p.id}`} className="card p-5 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{p.title}</h3>
                          <p className="text-xs text-gray-500">{p.city ?? ''}</p>
                        </div>
                        <StatusBadge status={p.status as 'live' | 'upcoming' | 'funded'} />
                      </div>
                      <FundingBar raised={p.raised_amount} target={p.target_amount} showLabels showPercent showAmount />
                      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {p.investor_count} investors
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {p.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Verification notice */}
            {data?.builder && !data.builder.verified && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Verification pending</p>
                  <p className="text-xs text-gray-600 mt-0.5">Your builder profile is awaiting admin verification. Some features may be limited.</p>
                </div>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </PortalLayout>
  )
}
