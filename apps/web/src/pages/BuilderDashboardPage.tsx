import { PortalLayout } from '@/components/layout'
import MetricCard from '@/components/wealth/MetricCard'
import FundingBar from '@/components/wealth/FundingBar'
import StatusBadge from '@/components/wealth/StatusBadge'
import { formatINRCompact } from '@/lib/formatters'
import { useContent } from '@/hooks/useSiteContent'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { dashboardBff } from '@/services/bff/dashboard.bff'
import {
  Building2, Users, IndianRupee, ArrowRight, Clock,
  AlertCircle, PlusCircle, Loader2,
} from 'lucide-react'
import { EmptyState } from '@/components/ui'

export default function BuilderDashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['builder-dashboard'],
    queryFn: () => dashboardBff.getBuilderDashboard(),
    staleTime: 60_000,
  })

  const stats = data?.stats
  const listings = data?.listings ?? []

  const heroBadge = useContent('builder_dashboard', 'hero_badge', 'Builder Portal')
  const heroTitle = useContent('builder_dashboard', 'hero_title', 'Builder Dashboard')
  const heroSubtitle = useContent('builder_dashboard', 'hero_subtitle', 'Manage your property listings and track investor activity.')
  const ctaAdd = useContent('builder_dashboard', 'cta_add', 'Add New Property')
  const sectionProperties = useContent('builder_dashboard', 'section_properties', 'My Properties')
  const emptyTitle = useContent('builder_dashboard', 'empty_title', 'No Properties Yet')
  const emptyMessage = useContent('builder_dashboard', 'empty_message', 'Create your first listing!')
  const errorMessage = useContent('builder_dashboard', 'error_message', 'Failed to load dashboard data. Please try again later.')
  const verifyTitle = useContent('builder_dashboard', 'verify_title', 'Verification pending')
  const verifyMessage = useContent('builder_dashboard', 'verify_message', 'Your builder profile is awaiting admin verification. Some features may be limited.')

  return (
    <PortalLayout variant="builder">
      {/* Hero */}
      <div className="page-hero bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        <div className="page-hero-content flex items-center justify-between">
          <div>
            <span className="page-hero-badge">{heroBadge}</span>
            <h1 className="page-hero-title">{heroTitle}</h1>
            <p className="page-hero-subtitle">{heroSubtitle}</p>
          </div>
          <Link to="/portal/builder/listings/new" className="btn-gradient bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hidden sm:inline-flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            {ctaAdd}
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
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/40 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
            {errorMessage}
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
                <h2 className="section-title text-lg">{sectionProperties}</h2>
                <Link to="/portal/builder/listings" className="text-sm text-primary hover:underline flex items-center gap-1">
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {listings.length === 0 ? (
                <EmptyState icon={Building2} title={emptyTitle} message={emptyMessage} />
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {listings.slice(0, 6).map((p) => (
                    <Link key={p.id} to={`/portal/builder/listings/${p.id}`} className="card p-5 hover:border-theme transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-theme-primary">{p.title}</h3>
                          <p className="text-xs text-theme-secondary">{p.city ?? ''}</p>
                        </div>
                        <StatusBadge status={p.status as 'live' | 'upcoming' | 'funded'} />
                      </div>
                      <FundingBar raised={p.raised_amount} target={p.target_amount} showLabels showPercent showAmount />
                      <div className="flex items-center justify-between mt-3 text-xs text-theme-secondary">
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
              <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/40 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-theme-primary">{verifyTitle}</p>
                  <p className="text-xs text-theme-secondary mt-0.5">{verifyMessage}</p>
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
