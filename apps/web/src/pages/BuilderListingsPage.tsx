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
    return <span className="text-[11px] text-[#CDBFF4]">—</span>
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
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-[#D4AF37]/30 text-[11px] font-mono hover:border-[#D4AF37] transition-colors"
      title={`${passedCats}/${totalCats} Shield categories passed`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColorForStatus(status)}`} />
      <span className="text-[#F8F5FF]">
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
      <div 
        className="rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #2A1753 0%, #1F1243 55%, #160C34 100%)',
          border: '1px solid #D4AF37'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D4AF37]/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#CDBFF4]/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#F8F5FF]">Investors</p>
              <p className="text-[11px] text-[#CDBFF4] truncate max-w-[280px]">{title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[#CDBFF4] hover:text-[#F8F5FF] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-[#CDBFF4]">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
            </div>
          ) : investors.length === 0 ? (
            <div className="text-center py-10">
              <Users className="h-8 w-8 text-[#CDBFF4]/50 mx-auto mb-2" />
              <p className="text-sm text-[#CDBFF4]">No investors yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#D4AF37]/30">
                  <th className="text-left py-2 text-[11px] uppercase tracking-wider text-[#CDBFF4] font-semibold">Investor</th>
                  <th className="text-right py-2 text-[11px] uppercase tracking-wider text-[#CDBFF4] font-semibold">Amount</th>
                  <th className="text-right py-2 text-[11px] uppercase tracking-wider text-[#CDBFF4] font-semibold">Date</th>
                  <th className="text-center py-2 text-[11px] uppercase tracking-wider text-[#CDBFF4] font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {investors.map((inv) => (
                  <tr key={inv.investmentId} className="border-b border-[#D4AF37]/10 hover:bg-[#160C34]/50 transition-colors">
                    <td className="py-2.5 pr-3">
                      <p className="font-medium text-[#F8F5FF]">{inv.investorName}</p>
                      <p className="text-[11px] text-[#CDBFF4]">{inv.investorEmail}</p>
                    </td>
                    <td className="py-2.5 text-right font-mono font-semibold text-[#F8F5FF]">
                      {formatINRCompact(inv.amount)}
                    </td>
                    <td className="py-2.5 text-right text-[#CDBFF4]">
                      {new Date(inv.investedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-2.5 text-center">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        inv.status === 'confirmed'
                          ? 'bg-[#20E3B2]/20 text-[#20E3B2]'
                          : inv.status === 'pending'
                            ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                            : 'bg-white/10 text-[#CDBFF4]'
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
          <div className="px-5 py-3 border-t border-[#D4AF37]/30 bg-[#160C34]/80 shrink-0 flex items-center justify-between">
            <p className="text-xs text-[#CDBFF4]">
              <span className="font-semibold text-[#F8F5FF]">{data?.totalInvestors ?? investors.length}</span> investors
            </p>
            <p className="text-xs text-[#CDBFF4]">
              Total invested: <span className="font-mono font-semibold text-[#F8F5FF]">{formatINRCompact(data?.totalInvested ?? 0)}</span>
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
          className="page-hero-navbar relative overflow-hidden pt-[8.5rem] pb-14 lg:pb-16 -mt-16"
          style={{
            backgroundImage: "linear-gradient(135deg, rgba(7,16,31,0.85) 0%, rgba(15,27,58,0.75) 50%, rgba(7,16,31,0.85) 100%), url('/images/page-hero-bg-2.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Blur orbs — matching VaultsPage */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/18 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-[30rem] h-[30rem] rounded-full bg-violet-500/12 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-indigo-400/6 blur-3xl" />
          </div>
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-16 relative z-10">
            <div className="animate-fade-up">
              <h1 className="font-hero text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3 tracking-tight leading-[1.1]">
                {heroTitle}
              </h1>
              <p className="text-white/60 max-w-2xl text-base leading-relaxed font-body">
                {heroSubtitle}
              </p>
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
      <div className="bg-white min-h-full">
        <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]" />
              <input
                type="search"
                placeholder="Search listings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm text-[#F8F5FF] placeholder:text-[#CDBFF4]/50 rounded-lg focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition-all outline-none"
                style={{
                  background: 'linear-gradient(160deg, #2A1753 0%, #1F1243 55%, #160C34 100%)',
                  border: '1px solid #D4AF37'
                }}
              />
            </div>
            {/* The Select component doesn't accept inline style natively, so we pass a styled wrapper or we rely on standard classNames.
                Since it's a generic UI component, we will wrap it or style it if needed. 
                For now we'll just leave it default, it might inherit the dark theme. */}
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
            <div className="flex items-center justify-center py-20 text-[#2A1753]">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading listings…
            </div>
          ) : (
            <div 
              className="rounded-xl overflow-hidden shadow-[0_4px_24px_-8px_rgba(212,175,55,0.15)]"
              style={{
                background: 'linear-gradient(160deg, #2A1753 0%, #1F1243 55%, #160C34 100%)',
                border: '1px solid #D4AF37'
              }}
            >
              <DataTable
                className="!bg-transparent !border-0 text-[#F8F5FF]"
                data={filtered}
              keyExtractor={(l) => l.id}
              emptyMessage="No listings found"
              emptyIcon={Building2}
              columns={[
                {
                  key: 'property',
                  header: 'Property',
                  headerClassName: '!text-[#CDBFF4]',
                  render: (l) => (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-[#CDBFF4]/10 flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-[#D4AF37]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#F8F5FF]">{l.title}</p>
                        <p className="text-xs text-[#CDBFF4]">{l.micromarket}, {l.city} · {l.assetType}</p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  headerClassName: 'text-center !text-[#CDBFF4]',
                  className: 'text-center',
                  render: (l) => <StatusBadge status={l.status} />,
                },
                {
                  key: 'shield',
                  header: 'Shield',
                  headerClassName: 'text-center !text-[#CDBFF4]',
                  className: 'text-center',
                  render: (l) => <ShieldProgressChip opportunityId={l.id} />,
                },
                {
                  key: 'minInvest',
                  header: 'Min Invest',
                  headerClassName: 'text-right !text-[#CDBFF4]',
                  className: 'text-right font-mono text-[#F8F5FF]',
                  render: (l) => <>{formatINRCompact(l.minInvest)}</>,
                },
                {
                  key: 'funding',
                  header: 'Funding',
                  headerClassName: '!text-[#CDBFF4]',
                  className: 'min-w-[160px]',
                  render: (l) => <FundingBar raised={l.raised} target={l.target} showPercent textClassName="!text-[#CDBFF4]" labelClassName="!text-[#CDBFF4]/60" />,
                },
                {
                  key: 'investors',
                  header: 'Investors',
                  headerClassName: 'text-right !text-[#CDBFF4]',
                  className: 'text-right',
                  render: (l) => (
                    <button
                      onClick={() => setInvestorsPopup({ opportunityId: l.id, title: l.title })}
                      className="font-semibold text-[#D4AF37] hover:underline underline-offset-2 disabled:text-[#CDBFF4]/50 disabled:no-underline"
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
                  headerClassName: 'text-center !text-[#CDBFF4]',
                  render: (l) => (
                    <div className="flex items-center justify-center gap-1">
                      <Link to={`/portal/builder/listings/${l.id}`} className="p-1.5 rounded hover:bg-white/10 text-[#CDBFF4] hover:text-[#D4AF37]" title="View">
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link to={`/portal/builder/listings/${l.id}/edit`} className="p-1.5 rounded hover:bg-white/10 text-[#CDBFF4] hover:text-[#D4AF37]" title="Edit">
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button className="p-1.5 rounded hover:bg-red-500/20 text-[#CDBFF4] hover:text-red-400" title="Delete">
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
