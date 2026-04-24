import { useState, useMemo } from 'react'
import { PortalLayout } from '@/components/layout'
import { DataTable, type Column, EmptyState, Select } from '@/components/ui'
import { useBuilderInvestors, type BuilderInvestor } from '@/hooks/useBuilderInvestors'
import { formatINRCompact, formatDate } from '@/lib/formatters'
import { Users, Search, IndianRupee, UserCheck, Loader2 } from 'lucide-react'

export default function BuilderInvestorsPage() {
  const { data, isLoading } = useBuilderInvestors()
  const [search, setSearch] = useState('')
  const [oppFilter, setOppFilter] = useState('')

  const investors = useMemo(() => data?.investors ?? [], [data?.investors])
  const oppOptions = useMemo(() => {
    const map = new Map<string, string>()
    investors.forEach((inv) => map.set(inv.opportunityId, inv.opportunityTitle))
    return Array.from(map, ([value, label]) => ({ value, label }))
  }, [investors])

  const filtered = investors.filter((inv) => {
    if (search && !inv.investorName.toLowerCase().includes(search.toLowerCase()) && !inv.investorEmail.toLowerCase().includes(search.toLowerCase())) return false
    if (oppFilter && inv.opportunityId !== oppFilter) return false
    return true
  })

  const columns: Column<BuilderInvestor>[] = [
    {
      key: 'investorName',
      header: 'Investor',
      render: (inv) => (
        <div className="flex items-center gap-2">
          {inv.investorAvatar ? (
            <img src={inv.investorAvatar} alt={inv.investorName} className="h-7 w-7 rounded-full object-cover" />
          ) : (
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              {inv.investorName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-theme-primary">{inv.investorName}</p>
            <p className="text-xs text-theme-tertiary">{inv.investorEmail}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'opportunityTitle',
      header: 'Property',
      render: (inv) => <span className="text-sm">{inv.opportunityTitle}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (inv) => <span className="text-sm font-medium">₹{formatINRCompact(inv.amount)}</span>,
    },
    {
      key: 'investedAt',
      header: 'Date',
      render: (inv) => <span className="text-xs text-theme-secondary">{formatDate(inv.investedAt)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (inv) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${inv.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'}`}>
          {inv.status}
        </span>
      ),
    },
  ]

  return (
    <PortalLayout variant="builder">
      <div className="space-y-6">
        <div>
          <h1 className="section-title text-2xl">Investors</h1>
          <p className="text-theme-secondary mt-1">Track investments across all your listings</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[var(--bg-surface)] rounded-xl border border-theme p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><UserCheck className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xs text-theme-secondary">Total Investors</p>
              <p className="text-lg font-bold text-theme-primary">{data?.totalInvestors ?? 0}</p>
            </div>
          </div>
          <div className="bg-[var(--bg-surface)] rounded-xl border border-theme p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"><IndianRupee className="h-5 w-5 text-emerald-600" /></div>
            <div>
              <p className="text-xs text-theme-secondary">Total Invested</p>
              <p className="text-lg font-bold text-theme-primary">₹{formatINRCompact(data?.totalInvested ?? 0)}</p>
            </div>
          </div>
          <div className="bg-[var(--bg-surface)] rounded-xl border border-theme p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center"><Users className="h-5 w-5 text-violet-600" /></div>
            <div>
              <p className="text-xs text-theme-secondary">Properties with Investment</p>
              <p className="text-lg font-bold text-theme-primary">{oppOptions.length}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-tertiary" />
            <input type="search" placeholder="Search investors..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm bg-[var(--bg-surface)] border border-theme rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          {oppOptions.length > 1 && (
            <Select value={oppFilter} onChange={setOppFilter} placeholder="All Properties" options={[{ value: '', label: 'All Properties' }, ...oppOptions]} />
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title="No investors yet" message="Once investors fund your listings, they'll appear here." />
        ) : (
          <DataTable columns={columns} data={filtered} keyExtractor={(row) => row.investmentId} />
        )}
      </div>
    </PortalLayout>
  )
}
