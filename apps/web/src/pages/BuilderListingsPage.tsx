import { PortalLayout } from '@/components/layout'
import StatusBadge from '@/components/wealth/StatusBadge'
import FundingBar from '@/components/wealth/FundingBar'
import { formatINRCompact } from '@/lib/formatters'
import { Link } from 'react-router-dom'
import { Building2, Search, Eye, Edit, Trash2, Loader2, Users, X } from 'lucide-react'
import { useState } from 'react'
import { DataTable, Select, type Column } from '@/components/ui'
import { useContent } from '@/hooks/useSiteContent'
import { useBuilderListings, type BuilderListing } from '@/hooks/useBuilderListings'
import { useOpportunityAssessments } from '@/hooks/useShield'
import { dotColorForStatus } from '@/lib/assessments'
import { useBuilderInvestorsByOpportunity, type BuilderInvestor } from '@/hooks/useBuilderInvestors'

function ShieldProgressChip({ opportunityId }: { opportunityId: string }) {
  const { data, isLoading } = useOpportunityAssessments(opportunityId)
  if (isLoading || !data) {
    return <span className="text-[11px] text-theme-tertiary">—</span>
  }
  const passedCats = data.categories.filter(
    (c) => c.status === 'passed',
  ).length
  const totalCats = data.categories.length
  const flagged = data.categories.some((c) => c.status === 'flagged')
  const status = data.certified
    ? 'passed'
    : flagged
      ? 'flagged'
      : passedCats > 0
        ? 'in_progress'
        : 'not_started'
  return (
    <Link
      to={`/portal/builder/listings/${opportunityId}#shield`}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-theme text-[11px] font-mono hover:border-primary"
      title={`${passedCats}/${totalCats} Shield categories passed`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColorForStatus(status)}`} />
      <span className="text-theme-primary">
        {passedCats}/{totalCats}
      </span>
    </Link>
  )
}

function InvestorListPopup({
  opportunityId,
  title,
  onClose,
}: {
  opportunityId: string
  title: string
  onClose: () => void
}) {
  const { data, isLoading } = useBuilderInvestorsByOpportunity(opportunityId)
  const investors: BuilderInvestor[] = data?.investors ?? []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[var(--bg-card)] rounded-2xl border border-theme shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-theme-primary">Investors</p>
              <p className="text-[11px] text-theme-tertiary truncate max-w-[280px]">{title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] text-theme-tertiary hover:text-theme-primary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-theme-secondary">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
            </div>
          ) : investors.length === 0 ? (
            <div className="text-center py-10">
              <Users className="h-8 w-8 text-theme-tertiary mx-auto mb-2" />
              <p className="text-sm text-theme-secondary">No investors yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-theme">
                  <th className="text-left py-2 text-[11px] uppercase tracking-wider text-theme-tertiary font-semibold">Investor</th>
                  <th className="text-right py-2 text-[11px] uppercase tracking-wider text-theme-tertiary font-semibold">Amount</th>
                  <th className="text-right py-2 text-[11px] uppercase tracking-wider text-theme-tertiary font-semibold">Date</th>
                  <th className="text-center py-2 text-[11px] uppercase tracking-wider text-theme-tertiary font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {investors.map((inv) => (
                  <tr key={inv.investmentId} className="border-b border-theme/50 hover:bg-[var(--bg-surface-hover)] transition-colors">
                    <td className="py-2.5 pr-3">
                      <p className="font-medium text-theme-primary">{inv.investorName}</p>
                      <p className="text-[11px] text-theme-tertiary">{inv.investorEmail}</p>
                    </td>
                    <td className="py-2.5 text-right font-mono font-semibold text-theme-primary">
                      {formatINRCompact(inv.amount)}
                    </td>
                    <td className="py-2.5 text-right text-theme-secondary">
                      {new Date(inv.investedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-2.5 text-center">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        inv.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : inv.status === 'pending'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-[var(--bg-surface)] text-theme-secondary'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer summary */}
        {!isLoading && investors.length > 0 && (
          <div className="px-5 py-3 border-t border-theme bg-[var(--bg-surface)] rounded-b-2xl shrink-0 flex items-center justify-between">
            <p className="text-xs text-theme-secondary">
              <span className="font-semibold text-theme-primary">{data?.totalInvestors ?? investors.length}</span> investors
            </p>
            <p className="text-xs text-theme-secondary">
              Total invested: <span className="font-mono font-semibold text-theme-primary">{formatINRCompact(data?.totalInvested ?? 0)}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function BuilderListingsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [investorsPopup, setInvestorsPopup] = useState<{ opportunityId: string; title: string } | null>(null)
  const { listings, isLoading } = useBuilderListings()

  const heroBadge = useContent('builder_listings', 'hero_badge', 'Builder Portal')
  const heroTitle = useContent('builder_listings', 'hero_title', 'My Listings')
  const heroSubtitle = useContent('builder_listings', 'hero_subtitle', 'Manage and track your property listings')

  const filtered = listings.filter((l) => {
    if (search && !l.title.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter && l.status !== statusFilter) return false
    return true
  })

  return (
    <PortalLayout 
      variant="builder"
      hero={
        <section
          id="hero"
          className="page-hero relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 pt-[8.25rem] pb-10 px-6 lg:px-8"
        >
          {/* Blur orbs — matching VaultsPage */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/18 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-[30rem] h-[30rem] rounded-full bg-violet-500/12 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-indigo-400/6 blur-3xl" />
          </div>
          <div className="page-hero-content">
            <div className="animate-fade-up flex flex-col gap-5 sm:gap-0 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="page-hero-badge">{heroBadge}</span>
                <h1 className="page-hero-title">{heroTitle}</h1>
                <p className="page-hero-subtitle">{heroSubtitle}</p>
              </div>
            </div>
          </div>
        </section>
      }
    >
      {/* Investor list popup (portal) */}
      {investorsPopup && (
        <InvestorListPopup
          opportunityId={investorsPopup.opportunityId}
          title={investorsPopup.title}
          onClose={() => setInvestorsPopup(null)}
        />
      )}

      {/* Main content — sits beside the sidebar */}
      <div className="content-section-bg min-h-full">
        <div className="p-6 lg:p-8 space-y-6">

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-tertiary" />
              <input
                type="search"
                placeholder="Search listings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-[var(--bg-surface)] border border-[#D4AF37]/50 rounded-lg focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition-all"
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
                { value: 'draft', label: 'Draft' },
                { value: 'pending_approval', label: 'Pending Approval' },
                { value: 'rejected', label: 'Rejected' },
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
            <div className="rounded-xl border border-[#D4AF37]/30 shadow-[0_4px_24px_-8px_rgba(212,175,55,0.15)] bg-[var(--bg-surface)] overflow-hidden">
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
                  key: 'shield',
                  header: 'Shield',
                  headerClassName: 'text-center',
                  className: 'text-center',
                  render: (l) => <ShieldProgressChip opportunityId={l.id} />,
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
                  render: (l) => (
                    <button
                      onClick={() => setInvestorsPopup({ opportunityId: l.id, title: l.title })}
                      className="font-semibold text-primary hover:underline underline-offset-2 disabled:text-theme-tertiary disabled:no-underline"
                      disabled={l.investors === 0}
                      title={l.investors === 0 ? 'No investors yet' : `View ${l.investors} investor(s)`}
                    >
                      {l.investors}
                    </button>
                  ),
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
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  )
}
