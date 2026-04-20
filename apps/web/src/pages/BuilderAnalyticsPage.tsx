import { PortalLayout } from '@/components/layout'
import { useBuilderAnalytics } from '@/hooks/useBuilderAnalytics'
import { formatINRCompact, formatPercent } from '@/lib/formatters'
import { EmptyState } from '@/components/ui'
import { ShieldMetricsCard } from '@/components/shield/ShieldMetricsCard'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, IndianRupee, Users, Building2, Loader2, Target, Clock, Repeat, Trophy, AlertTriangle } from 'lucide-react'

const VAULT_COLORS: Record<string, string> = {
  wealth: '#6366f1',
  opportunity: '#f59e0b',
  community: '#10b981',
}

function fmtCompact(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 1_00_00_000) return `${(v / 1_00_00_000).toFixed(1)} Cr`
  if (abs >= 1_00_000) return `${(v / 1_00_000).toFixed(1)} L`
  if (abs >= 1_000) return `${(v / 1_000).toFixed(1)} K`
  return String(v)
}

export default function BuilderAnalyticsPage() {
  const { data, isLoading, isError } = useBuilderAnalytics()

  if (isLoading) {
    return (
      <PortalLayout variant="builder">
        <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
      </PortalLayout>
    )
  }

  if (isError) {
    return (
      <PortalLayout variant="builder">
        <div>
          <h1 className="section-title text-2xl mb-1">Analytics</h1>
          <p className="text-theme-secondary mb-6">Insights across your listings</p>
          <EmptyState icon={AlertTriangle} title="Failed to load analytics" message="Something went wrong. Please try again later." />
        </div>
      </PortalLayout>
    )
  }

  if (!data || data.opportunityCount === 0) {
    return (
      <PortalLayout variant="builder">
        <div>
          <h1 className="section-title text-2xl mb-1">Analytics</h1>
          <p className="text-theme-secondary mb-6">Insights across your listings</p>
          <EmptyState icon={TrendingUp} title="No data yet" message="Analytics will appear once you have active listings with investments." />
        </div>
      </PortalLayout>
    )
  }

  const fundingPct = data.totalTarget > 0 ? (data.totalRaised / data.totalTarget) * 100 : 0

  // Vault type distribution for pie
  const vaultMap = new Map<string, number>()
  data.opportunities.forEach((o) => vaultMap.set(o.vaultType, (vaultMap.get(o.vaultType) ?? 0) + 1))
  const vaultPie = Array.from(vaultMap, ([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))

  return (
    <PortalLayout variant="builder">
      <div className="space-y-6">
        <div>
          <h1 className="section-title text-2xl">Analytics</h1>
          <p className="text-theme-secondary mt-1">Insights across your listings</p>
        </div>

        <ShieldMetricsCard title="My Shield pipeline" />

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard icon={IndianRupee} label="Total Raised" value={`₹${formatINRCompact(data.totalRaised)}`} color="text-emerald-600" />
          <KpiCard icon={Target} label="Target" value={`₹${formatINRCompact(data.totalTarget)}`} color="text-primary" />
          <KpiCard icon={Users} label="Investors" value={String(data.investorCount)} color="text-violet-600" />
          <KpiCard icon={Building2} label="Listings" value={String(data.opportunityCount)} sub={`${formatPercent(fundingPct)} funded`} color="text-amber-600" />
          <KpiCard icon={Clock} label="Avg Time to Fund" value={data.avgDaysToFund != null ? `${data.avgDaysToFund}d` : '—'} color="text-sky-600" />
          <KpiCard icon={Repeat} label="Repeat Investors" value={data.repeatInvestorRate > 0 ? `${data.repeatInvestorRate}%` : '—'} color="text-pink-600" />
        </div>

        {/* Top Performing Listing */}
        {data.topOpportunity && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl border border-amber-200 dark:border-amber-800/50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Top Performing Listing</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-theme-primary">{data.topOpportunity.title}</p>
                <p className="text-sm text-theme-secondary mt-0.5">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${VAULT_COLORS[data.topOpportunity.vaultType] ?? '#6366f1'}20`, color: VAULT_COLORS[data.topOpportunity.vaultType] ?? '#6366f1' }}>
                    {data.topOpportunity.vaultType}
                  </span>
                  <span className="ml-2">{data.topOpportunity.city || 'Unknown'}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatPercent(data.topOpportunity.fundingPct)}</p>
                <p className="text-xs text-theme-secondary">funded • {data.topOpportunity.investorCount} investors</p>
              </div>
            </div>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trends Area Chart */}
          {data.monthlyTrends.length > 0 && (
            <div className="bg-[var(--bg-surface)] rounded-xl border border-theme p-5">
              <h2 className="text-sm font-semibold text-theme-primary mb-4">Monthly Investment Trend</h2>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={data.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #e5e7eb)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--text-tertiary)" />
                  <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11 }} stroke="var(--text-tertiary)" />
                  <Tooltip formatter={(value) => [`₹${fmtCompact(Number(value))}`, 'Amount']} />
                  <Area type="monotone" dataKey="amount" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* City Distribution Bar Chart */}
          {data.cityDistribution.length > 0 && (
            <div className="bg-[var(--bg-surface)] rounded-xl border border-theme p-5">
              <h2 className="text-sm font-semibold text-theme-primary mb-4">Investment by City</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.cityDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #e5e7eb)" />
                  <XAxis type="number" tickFormatter={fmtCompact} tick={{ fontSize: 11 }} stroke="var(--text-tertiary)" />
                  <YAxis type="category" dataKey="city" tick={{ fontSize: 11 }} stroke="var(--text-tertiary)" width={80} />
                  <Tooltip formatter={(value) => [`₹${fmtCompact(Number(value))}`, 'Raised']} />
                  <Bar dataKey="totalRaised" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Vault Distribution Pie + Listings Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {vaultPie.length > 0 && (
            <div className="bg-[var(--bg-surface)] rounded-xl border border-theme p-5">
              <h2 className="text-sm font-semibold text-theme-primary mb-4">Vault Distribution</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={vaultPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(entry) => entry.name}>
                    {vaultPie.map((_entry, idx) => (
                      <Cell key={idx} fill={Object.values(VAULT_COLORS)[idx % 3]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Opportunity Breakdown Table */}
          <div className="lg:col-span-2 bg-[var(--bg-surface)] rounded-xl border border-theme p-5">
            <h2 className="text-sm font-semibold text-theme-primary mb-4">Listing Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-theme-tertiary text-xs border-b border-theme">
                    <th className="pb-2 font-medium">Listing</th>
                    <th className="pb-2 font-medium">Vault</th>
                    <th className="pb-2 font-medium text-right">Raised</th>
                    <th className="pb-2 font-medium text-right">Target</th>
                    <th className="pb-2 font-medium text-right">Investors</th>
                    <th className="pb-2 font-medium text-right">Funded</th>
                  </tr>
                </thead>
                <tbody>
                  {data.opportunities.map((opp) => (
                    <tr key={opp.id} className="border-b border-theme/50 last:border-0">
                      <td className="py-2 font-medium text-theme-primary truncate max-w-[180px]">{opp.title}</td>
                      <td className="py-2">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${VAULT_COLORS[opp.vaultType] ?? '#6366f1'}20`, color: VAULT_COLORS[opp.vaultType] ?? '#6366f1' }}>
                          {opp.vaultType}
                        </span>
                      </td>
                      <td className="py-2 text-right">₹{fmtCompact(opp.raisedAmount)}</td>
                      <td className="py-2 text-right text-theme-secondary">₹{fmtCompact(opp.targetAmount)}</td>
                      <td className="py-2 text-right">{opp.investorCount}</td>
                      <td className="py-2 text-right">{formatPercent(opp.fundingPct)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}

function KpiCard({ icon: Icon, label, value, sub, color }: { icon: typeof IndianRupee; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-[var(--bg-surface)] rounded-xl border border-theme p-4">
      <div className="flex items-center gap-2 text-theme-secondary text-xs mb-1"><Icon className={`h-3.5 w-3.5 ${color}`} />{label}</div>
      <p className="text-lg font-bold text-theme-primary">{value}</p>
      {sub && <p className="text-xs text-theme-tertiary mt-0.5">{sub}</p>}
    </div>
  )
}
