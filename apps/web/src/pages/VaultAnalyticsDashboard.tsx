import { useState, useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar,
} from 'recharts'
import {
  TrendingUp, IndianRupee, Users, Building2, MapPin,
  Target, RefreshCw, ArrowUpRight, ArrowDownRight, Percent, BarChart3,
  PieChart as PieChartIcon, Activity, Layers, Filter,
} from 'lucide-react'

import {
  useFullAnalytics,
  useRefreshAnalytics,
  type FullAnalyticsResponse,
} from '@/hooks/useAnalytics'
import { formatINR, formatINRCompact } from '@/lib/formatters'
import { EmptyState as UIEmptyState } from '@/components/ui'

/* ── Palette ──────────────────────────────────────────────────────────────── */

const VAULT_COLORS: Record<string, string> = {
  wealth: '#6366f1',
  opportunity: '#f59e0b',
  community: '#10b981',
}

const VAULT_LABELS: Record<string, string> = {
  wealth: 'Wealth Vault',
  opportunity: 'Opportunity Vault',
  community: 'Community Vault',
}

const STATUS_COLORS: Record<string, string> = {
  submitted: '#6366f1',
  builder_connected: '#8b5cf6',
  deal_in_progress: '#f59e0b',
  payment_done: '#10b981',
  deal_completed: '#059669',
  token_paid: '#0ea5e9',
  closed: '#6b7280',
}

const EOI_STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  builder_connected: 'Builder Connected',
  deal_in_progress: 'Deal in Progress',
  payment_done: 'Payment Done',
  deal_completed: 'Deal Completed',
  token_paid: 'Token Paid',
  closed: 'Closed',
}

const TXN_LABELS: Record<string, string> = {
  investment: 'Investment',
  rental_payout: 'Rental Payout',
  exit_payout: 'Exit Payout',
  refund: 'Refund',
  fee: 'Platform Fee',
}

const TXN_COLORS: Record<string, string> = {
  investment: '#6366f1',
  rental_payout: '#10b981',
  exit_payout: '#f59e0b',
  refund: '#ef4444',
  fee: '#8b5cf6',
}

const PIE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#0ea5e9', '#ef4444', '#8b5cf6', '#ec4899']

type SubTab = 'overview' | 'vaults' | 'investors' | 'geography' | 'pipeline' | 'revenue'

/* ── Number formatters ────────────────────────────────────────────────────── */

function fmtCompact(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 1_00_00_000) return `${(v / 1_00_00_000).toFixed(1)} Cr`
  if (abs >= 1_00_000) return `${(v / 1_00_000).toFixed(1)} L`
  if (abs >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return v.toFixed(0)
}

function fmtPct(v: number | null | undefined): string {
  if (v == null) return '—'
  return `${Number(v).toFixed(1)}%`
}

/* ── Shared UI atoms ──────────────────────────────────────────────────────── */

function KPICard({ label, value, sub, icon: Icon, trend, color = 'text-primary' }: {
  label: string
  value: string
  sub?: string
  icon: typeof TrendingUp
  trend?: 'up' | 'down' | 'neutral'
  color?: string
}) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/60 p-5 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {trend === 'up' && <ArrowUpRight className="h-4 w-4 text-emerald-500" />}
        {trend === 'down' && <ArrowDownRight className="h-4 w-4 text-red-500" />}
      </div>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  )
}

function ChartCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/60 p-5 shadow-sm ${className}`}>
      <h4 className="text-sm font-semibold text-gray-700 mb-4">{title}</h4>
      {children}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return <UIEmptyState icon={BarChart3} title="No Data" message={message} />
}

/* ── Custom Tooltip ───────────────────────────────────────────────────────── */

function ChartTooltip({ active, payload, label, formatter }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
  formatter?: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  const fmt = formatter ?? ((v: number) => formatINR(v, 0))
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-gray-600 mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-semibold text-gray-800">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

/* ── SUB-TAB: Overview ────────────────────────────────────────────────────── */

function OverviewTab({ data }: { data: FullAnalyticsResponse }) {
  const { vaultSummary: vs, investmentTrends: it, investors: inv, eoiFunnel: eoi } = data

  // Consolidated monthly trend data for stacked area
  const trendData = useMemo(() => {
    const byMonth = new Map<string, Record<string, number>>()
    for (const t of it.trends) {
      if (!byMonth.has(t.month)) byMonth.set(t.month, {})
      const entry = byMonth.get(t.month)!
      entry[t.vaultType] = (entry[t.vaultType] ?? 0) + t.totalAmount
    }
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, vals]) => ({ month, ...vals }))
  }, [it.trends])

  // Vault composition for pie chart
  const vaultPie = useMemo(() =>
    vs.vaults.map(v => ({
      name: VAULT_LABELS[v.vaultType] || v.vaultType,
      value: Number(v.totalRaisedAmount),
      color: VAULT_COLORS[v.vaultType] || '#6b7280',
    })),
    [vs.vaults],
  )

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Platform AUM" value={formatINRCompact(vs.platformAum)} sub="Assets Under Management" icon={IndianRupee} color="text-emerald-600" />
        <KPICard label="Active Investors" value={inv.totalInvestors.toLocaleString()} sub={`${fmtPct(inv.kycCompletionRate)} KYC done`} icon={Users} color="text-violet-600" />
        <KPICard label="Opportunities" value={vs.totalOpportunities.toLocaleString()} sub={`Across ${vs.vaults.length} vaults`} icon={Building2} color="text-amber-600" />
        <KPICard label="Avg Deal Size" value={formatINRCompact(vs.avgDealSize)} sub="Per opportunity" icon={Target} color="text-sky-600" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Investment Volume Trend */}
        <ChartCard title="Investment Volume (Monthly)" className="lg:col-span-2">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData}>
                <defs>
                  {Object.entries(VAULT_COLORS).map(([k, c]) => (
                    <linearGradient key={k} id={`grad_${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtCompact} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                {Object.entries(VAULT_COLORS).map(([k, c]) => (
                  <Area
                    key={k}
                    type="monotone"
                    dataKey={k}
                    name={VAULT_LABELS[k] || k}
                    stackId="1"
                    stroke={c}
                    fill={`url(#grad_${k})`}
                    strokeWidth={2}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No investment data yet" />}
        </ChartCard>

        {/* Vault Composition Donut */}
        <ChartCard title="Vault Composition (AUM)">
          {vaultPie.some(p => p.value > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={vaultPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {vaultPie.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatINR(Number(value), 0)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No vault data yet" />}
        </ChartCard>
      </div>

      {/* Second Row: Investor Growth + EOI conversion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Investor Growth (Cumulative)">
          {inv.growth.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={inv.growth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                <Tooltip content={<ChartTooltip formatter={(v) => v.toLocaleString()} />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="cumulativeUsers" name="Total Users" stroke="#6366f1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="cumulativeInvestors" name="Investors" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No user data yet" />}
        </ChartCard>

        <ChartCard title="EOI Pipeline Conversion">
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="text-3xl font-bold text-gray-900">{eoi.totalEois}</div>
              <div className="text-sm text-gray-500">Total EOIs</div>
              <div className="mt-3 text-3xl font-bold text-emerald-600">{fmtPct(eoi.conversionRate)}</div>
              <div className="text-sm text-gray-500">Conversion Rate</div>
              <div className="mt-3 text-lg font-semibold text-gray-700">{formatINRCompact(eoi.totalInterest)}</div>
              <div className="text-sm text-gray-500">Total Interest Expressed</div>
            </div>
            <div className="w-40">
              <ResponsiveContainer width="100%" height={200}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" data={[
                  { name: 'Conversion', value: Number(eoi.conversionRate), fill: '#10b981' },
                ]} startAngle={90} endAngle={-270}>
                  <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#f1f5f9' }} />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-xl font-bold" fill="#111827">
                    {fmtPct(eoi.conversionRate)}
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  )
}

/* ── SUB-TAB: Vault Performance ───────────────────────────────────────────── */

function VaultPerformanceTab({ data }: { data: FullAnalyticsResponse }) {
  const { vaultSummary: vs, topOpportunities: top } = data
  const [selectedVault, setSelectedVault] = useState<string | null>(null)

  const filteredVaults = selectedVault ? vs.vaults.filter(v => v.vaultType === selectedVault) : vs.vaults

  // IRR comparison bar chart
  const irrData = useMemo(() =>
    vs.vaults.map(v => ({
      name: VAULT_LABELS[v.vaultType] || v.vaultType,
      'Target IRR': Number(v.avgTargetIrr),
      'Expected IRR': Number(v.avgExpectedIrr),
      'Actual IRR': Number(v.avgActualIrr),
    })),
    [vs.vaults],
  )

  // Funding progress
  const fundingData = useMemo(() =>
    vs.vaults.map(v => ({
      name: VAULT_LABELS[v.vaultType] || v.vaultType,
      raised: Number(v.totalRaisedAmount),
      remaining: Math.max(0, Number(v.totalTargetAmount) - Number(v.totalRaisedAmount)),
      pct: Number(v.fundingPct),
    })),
    [vs.vaults],
  )

  return (
    <div className="space-y-6">
      {/* Vault Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-400" />
        <button
          onClick={() => setSelectedVault(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!selectedVault ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          All Vaults
        </button>
        {vs.vaults.map(v => (
          <button
            key={v.vaultType}
            onClick={() => setSelectedVault(v.vaultType === selectedVault ? null : v.vaultType)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedVault === v.vaultType ? 'text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            style={selectedVault === v.vaultType ? { background: VAULT_COLORS[v.vaultType] } : {}}
          >
            {VAULT_LABELS[v.vaultType] || v.vaultType}
          </button>
        ))}
      </div>

      {/* Vault KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredVaults.map(v => (
          <div key={v.vaultType} className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/60 p-5 shadow-sm"
               style={{ borderLeftWidth: 4, borderLeftColor: VAULT_COLORS[v.vaultType] }}>
            <div className="text-sm font-semibold mb-3" style={{ color: VAULT_COLORS[v.vaultType] }}>
              {VAULT_LABELS[v.vaultType] || v.vaultType}
            </div>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div>
                <div className="text-gray-400 text-xs">Opportunities</div>
                <div className="font-semibold text-gray-900">{v.totalOpportunities}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs">Investors</div>
                <div className="font-semibold text-gray-900">{v.totalInvestors}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs">AUM</div>
                <div className="font-semibold text-gray-900">{formatINRCompact(v.totalRaisedAmount)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs">Funding</div>
                <div className="font-semibold text-gray-900">{fmtPct(v.fundingPct)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs">Target IRR</div>
                <div className="font-semibold text-gray-900">{fmtPct(v.avgTargetIrr)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs">Actual IRR</div>
                <div className="font-semibold text-emerald-600">{fmtPct(v.avgActualIrr)}</div>
              </div>
            </div>
            {/* Mini progress bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Raised: {formatINRCompact(v.totalRaisedAmount)}</span>
                <span>Target: {formatINRCompact(v.totalTargetAmount)}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(Number(v.fundingPct), 100)}%`, background: VAULT_COLORS[v.vaultType] }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="IRR Comparison by Vault">
          {irrData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={irrData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} tickLine={false} />
                <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Target IRR" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expected IRR" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Actual IRR" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No IRR data" />}
        </ChartCard>

        <ChartCard title="Funding Progress by Vault">
          {fundingData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={fundingData} layout="vertical" barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={fmtCompact} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} tickLine={false} />
                <Tooltip formatter={(v) => formatINR(Number(v), 0)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="raised" name="Raised" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="remaining" name="Remaining" stackId="a" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No funding data" />}
        </ChartCard>
      </div>

      {/* Top Opportunities Table */}
      <ChartCard title="Top Performing Opportunities">
        {top.opportunities.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="pb-2 font-medium text-gray-500">Opportunity</th>
                  <th className="pb-2 font-medium text-gray-500">Vault</th>
                  <th className="pb-2 font-medium text-gray-500">City</th>
                  <th className="pb-2 font-medium text-gray-500 text-right">Raised</th>
                  <th className="pb-2 font-medium text-gray-500 text-right">Target</th>
                  <th className="pb-2 font-medium text-gray-500 text-right">Funding</th>
                  <th className="pb-2 font-medium text-gray-500 text-right">IRR</th>
                  <th className="pb-2 font-medium text-gray-500 text-right">Investors</th>
                </tr>
              </thead>
              <tbody>
                {top.opportunities
                  .filter(o => !selectedVault || o.vaultType === selectedVault)
                  .map(o => (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-stone-50/50">
                    <td className="py-2.5">
                      <div className="font-medium text-gray-900 truncate max-w-[200px]">{o.title}</div>
                      {o.companyName && <div className="text-xs text-gray-400">{o.companyName}</div>}
                    </td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ background: VAULT_COLORS[o.vaultType] }}>
                        {o.vaultType}
                      </span>
                    </td>
                    <td className="py-2.5 text-gray-600">{o.city || '—'}</td>
                    <td className="py-2.5 text-right font-medium text-gray-900">{formatINRCompact(o.raisedAmount)}</td>
                    <td className="py-2.5 text-right text-gray-500">{o.targetAmount ? formatINRCompact(o.targetAmount) : '—'}</td>
                    <td className="py-2.5 text-right">
                      <span className={`font-medium ${Number(o.fundingPct) >= 75 ? 'text-emerald-600' : Number(o.fundingPct) >= 50 ? 'text-amber-600' : 'text-gray-600'}`}>
                        {fmtPct(o.fundingPct)}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-gray-600">{o.targetIrr ? fmtPct(o.targetIrr) : '—'}</td>
                    <td className="py-2.5 text-right text-gray-600">{o.investorCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState message="No opportunities to display" />}
      </ChartCard>
    </div>
  )
}

/* ── SUB-TAB: Investor Intelligence ───────────────────────────────────────── */

function InvestorTab({ data }: { data: FullAnalyticsResponse }) {
  const { investors: inv } = data

  // Monthly new signups bar chart
  const signupData = useMemo(() =>
    inv.growth.map(g => ({
      month: g.month,
      Investors: g.newInvestors,
      Builders: g.newBuilders,
      Others: g.newUsers - g.newInvestors - g.newBuilders,
    })),
    [inv.growth],
  )

  // KYC funnel
  const kycData = useMemo(() => {
    const total = inv.totalUsers
    const approved = inv.growth.reduce((s, g) => s + g.kycApproved, 0)
    const inProgress = inv.growth.reduce((s, g) => s + g.kycInProgress, 0)
    return [
      { stage: 'Registered', count: total, pct: 100, fill: '#6366f1' },
      { stage: 'KYC In Progress', count: inProgress, pct: total > 0 ? Math.round(inProgress / total * 100) : 0, fill: '#f59e0b' },
      { stage: 'KYC Approved', count: approved, pct: total > 0 ? Math.round(approved / total * 100) : 0, fill: '#10b981' },
    ]
  }, [inv])

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard label="Total Users" value={inv.totalUsers.toLocaleString()} icon={Users} color="text-violet-600" />
        <KPICard label="Investors" value={inv.totalInvestors.toLocaleString()} icon={TrendingUp} color="text-emerald-600" />
        <KPICard label="Builders" value={inv.totalBuilders.toLocaleString()} icon={Building2} color="text-amber-600" />
        <KPICard label="KYC Rate" value={fmtPct(inv.kycCompletionRate)} icon={Percent} color="text-sky-600" />
        <KPICard label="Avg Signups/mo" value={Number(inv.avgMonthlySignups).toFixed(0)} icon={Activity} color="text-pink-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Signups */}
        <ChartCard title="Monthly User Signups">
          {signupData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={signupData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                <Tooltip content={<ChartTooltip formatter={(v) => v.toLocaleString()} />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Investors" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Builders" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Others" stackId="a" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No signup data" />}
        </ChartCard>

        {/* KYC Funnel */}
        <ChartCard title="KYC Verification Funnel">
          <div className="space-y-4 py-4">
            {kycData.map((stage) => (
              <div key={stage.stage}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{stage.stage}</span>
                  <span className="text-gray-500">{stage.count.toLocaleString()} ({stage.pct}%)</span>
                </div>
                <div className="h-8 rounded-lg bg-gray-100 overflow-hidden relative">
                  <div
                    className="h-full rounded-lg transition-all flex items-center justify-end pr-2"
                    style={{ width: `${Math.max(stage.pct, 5)}%`, background: stage.fill }}
                  >
                    <span className="text-xs font-bold text-white">{stage.pct}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Cumulative Growth */}
      <ChartCard title="Cumulative User Growth">
        {inv.growth.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={inv.growth}>
              <defs>
                <linearGradient id="grad_users" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad_inv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} />
              <Tooltip content={<ChartTooltip formatter={(v) => v.toLocaleString()} />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="cumulativeUsers" name="Total Users" stroke="#6366f1" fill="url(#grad_users)" strokeWidth={2} />
              <Area type="monotone" dataKey="cumulativeInvestors" name="Investors" stroke="#10b981" fill="url(#grad_inv)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : <EmptyState message="No growth data" />}
      </ChartCard>
    </div>
  )
}

/* ── SUB-TAB: Geographic ──────────────────────────────────────────────────── */

function GeographyTab({ data }: { data: FullAnalyticsResponse }) {
  const { geographic: geo } = data

  // Aggregate by city (all vault types combined)
  const cityData = useMemo(() => {
    const byCityMap: Record<string, { city: string; state: string; raised: number; opportunities: number; investors: number }> = {}
    for (const c of geo.cities) {
      if (!byCityMap[c.city]) byCityMap[c.city] = { city: c.city, state: c.state, raised: 0, opportunities: 0, investors: 0 }
      const entry = byCityMap[c.city]!
      entry.raised += Number(c.totalRaised)
      entry.opportunities += c.opportunityCount
      entry.investors += c.totalInvestors
    }
    return Object.values(byCityMap).sort((a, b) => b.raised - a.raised).slice(0, 15)
  }, [geo.cities])

  // State aggregation for pie
  const stateData = useMemo(() => {
    const byState: Record<string, number> = {}
    for (const c of geo.cities) {
      byState[c.state] = (byState[c.state] || 0) + Number(c.totalRaised)
    }
    return Object.entries(byState)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([state, value], idx) => ({ name: state, value, color: PIE_COLORS[idx % PIE_COLORS.length] }))
  }, [geo.cities])

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard label="Cities Covered" value={geo.totalCities.toString()} icon={MapPin} color="text-sky-600" />
        <KPICard label="Top City" value={geo.topCity || '—'} icon={Building2} color="text-violet-600" />
        <KPICard label="Total Deployed" value={formatINRCompact(cityData.reduce((s, c) => s + c.raised, 0))} icon={IndianRupee} color="text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* City-wise bar chart */}
        <ChartCard title="Top Cities by AUM" className="lg:col-span-2">
          {cityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(280, cityData.length * 36)}>
              <BarChart data={cityData} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={fmtCompact} tickLine={false} />
                <YAxis dataKey="city" type="category" tick={{ fontSize: 11 }} width={100} tickLine={false} />
                <Tooltip formatter={(v) => formatINR(Number(v), 0)} />
                <Bar dataKey="raised" name="Raised Amount" fill="#6366f1" radius={[0, 6, 6, 0]}>
                  {cityData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No geographic data" />}
        </ChartCard>

        {/* State-wise pie */}
        <ChartCard title="State-wise Distribution">
          {stateData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stateData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {stateData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatINR(Number(value), 0)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No state data" />}
        </ChartCard>
      </div>

      {/* City Detail Table */}
      <ChartCard title="City-wise Breakdown">
        {cityData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="pb-2 font-medium text-gray-500">City</th>
                  <th className="pb-2 font-medium text-gray-500">State</th>
                  <th className="pb-2 font-medium text-gray-500 text-right">Opportunities</th>
                  <th className="pb-2 font-medium text-gray-500 text-right">Capital Raised</th>
                  <th className="pb-2 font-medium text-gray-500 text-right">Investors</th>
                </tr>
              </thead>
              <tbody>
                {cityData.map(c => (
                  <tr key={c.city} className="border-b border-gray-50 hover:bg-stone-50/50">
                    <td className="py-2.5 font-medium text-gray-900">{c.city}</td>
                    <td className="py-2.5 text-gray-600">{c.state}</td>
                    <td className="py-2.5 text-right text-gray-900">{c.opportunities}</td>
                    <td className="py-2.5 text-right font-medium text-gray-900">{formatINRCompact(c.raised)}</td>
                    <td className="py-2.5 text-right text-gray-600">{c.investors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState message="No city data" />}
      </ChartCard>
    </div>
  )
}

/* ── SUB-TAB: Pipeline Analytics ──────────────────────────────────────────── */

function PipelineTab({ data }: { data: FullAnalyticsResponse }) {
  const { eoiFunnel: eoi, vaultSummary: vs } = data

  // Group EOI by status (across vaults)
  const funnelData = useMemo(() => {
    const byStatus: Record<string, number> = {}
    for (const item of eoi.funnel) {
      byStatus[item.status] = (byStatus[item.status] || 0) + item.eoiCount
    }
    const ordered = ['submitted', 'builder_connected', 'deal_in_progress', 'payment_done', 'token_paid', 'deal_completed', 'closed']
    return ordered
      .filter(s => byStatus[s] != null)
      .map(s => ({
        stage: EOI_STATUS_LABELS[s] || s,
        count: byStatus[s] ?? 0,
        fill: STATUS_COLORS[s] || '#6b7280',
      }))
  }, [eoi.funnel])

  // Opportunity status distribution
  const oppStatusData = useMemo(() => {
    const statusMap: Record<string, number> = {}
    for (const v of vs.vaults) {
      for (const [key, count] of [
        ['Active', v.activeOpportunities],
        ['Funding', v.fundingOpportunities],
        ['Funded', v.fundedOpportunities],
        ['Closed', v.closedOpportunities],
      ] as [string, number][]) {
        statusMap[key] = (statusMap[key] || 0) + count
      }
    }
    return Object.entries(statusMap).map(([name, value]) => ({ name, value }))
  }, [vs.vaults])

  // EOI by vault
  const eoiByVault = useMemo(() => {
    const byVault: Record<string, number> = {}
    for (const item of eoi.funnel) {
      byVault[item.vaultType] = (byVault[item.vaultType] || 0) + item.eoiCount
    }
    return Object.entries(byVault).map(([k, v]) => ({
      name: VAULT_LABELS[k] || k,
      value: v,
      color: VAULT_COLORS[k] || '#6b7280',
    }))
  }, [eoi.funnel])

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total EOIs" value={eoi.totalEois.toLocaleString()} icon={Layers} color="text-violet-600" />
        <KPICard label="Interest Value" value={formatINRCompact(eoi.totalInterest)} icon={IndianRupee} color="text-emerald-600" />
        <KPICard label="Conversion Rate" value={fmtPct(eoi.conversionRate)} icon={TrendingUp} color="text-sky-600" />
        <KPICard label="Avg Interest" value={
          eoi.totalEois > 0 ? formatINRCompact(eoi.totalInterest / eoi.totalEois) : '—'
        } icon={Target} color="text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* EOI Funnel */}
        <ChartCard title="EOI Stage Funnel">
          {funnelData.length > 0 ? (
            <div className="space-y-3 py-2">
              {funnelData.map((stage) => {
                const maxCount = Math.max(...funnelData.map(f => f.count))
                const widthPct = maxCount > 0 ? (stage.count / maxCount) * 100 : 0
                return (
                  <div key={stage.stage}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{stage.stage}</span>
                      <span className="text-gray-500">{stage.count}</span>
                    </div>
                    <div className="h-7 rounded-md bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-md transition-all flex items-center pl-2"
                        style={{ width: `${Math.max(widthPct, 3)}%`, background: stage.fill }}
                      >
                        {widthPct > 20 && <span className="text-xs font-bold text-white">{stage.count}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : <EmptyState message="No EOI data" />}
        </ChartCard>

        {/* Opportunity Status */}
        <ChartCard title="Opportunity Status Distribution">
          {oppStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={oppStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {oppStatusData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No opportunity data" />}
        </ChartCard>
      </div>

      {/* EOI by Vault Type */}
      <ChartCard title="EOI Distribution by Vault">
        {eoiByVault.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={eoiByVault} barSize={50}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} />
              <Tooltip formatter={(v) => Number(v).toLocaleString()} />
              <Bar dataKey="value" name="EOIs" radius={[6, 6, 0, 0]}>
                {eoiByVault.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyState message="No vault EOI data" />}
      </ChartCard>
    </div>
  )
}

/* ── SUB-TAB: Revenue & Transactions ──────────────────────────────────────── */

function RevenueTab({ data }: { data: FullAnalyticsResponse }) {
  const { revenue: rev } = data

  // Monthly revenue stacked area
  const monthlyData = useMemo(() => {
    const byMonth: Record<string, Record<string, number>> = {}
    for (const t of rev.monthly) {
      if (!byMonth[t.month]) byMonth[t.month] = {}
      const monthEntry = byMonth[t.month]!
      monthEntry[t.txnType] = (monthEntry[t.txnType] || 0) + Number(t.totalAmount)
    }
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, vals]) => ({ month, ...vals }))
  }, [rev.monthly])

  // Type breakdown pie
  const typeData = useMemo(() =>
    Object.entries(rev.byType).map(([type, amount]) => ({
      name: TXN_LABELS[type] || type,
      value: Number(amount),
      color: TXN_COLORS[type] || '#6b7280',
    })),
    [rev.byType],
  )

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard label="Total Transaction Volume" value={formatINRCompact(rev.totalRevenue)} icon={IndianRupee} color="text-emerald-600" />
        <KPICard label="Transaction Types" value={Object.keys(rev.byType).length.toString()} icon={BarChart3} color="text-violet-600" />
        <KPICard label="Monthly Entries" value={rev.monthly.length.toString()} icon={Activity} color="text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly revenue trend */}
        <ChartCard title="Monthly Transaction Volume" className="lg:col-span-2">
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={monthlyData}>
                <defs>
                  {Object.entries(TXN_COLORS).map(([k, c]) => (
                    <linearGradient key={k} id={`txn_${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtCompact} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                {Object.entries(TXN_COLORS).map(([k, c]) => (
                  <Area
                    key={k}
                    type="monotone"
                    dataKey={k}
                    name={TXN_LABELS[k] || k}
                    stackId="1"
                    stroke={c}
                    fill={`url(#txn_${k})`}
                    strokeWidth={2}
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No transaction data" />}
        </ChartCard>

        {/* Type breakdown donut */}
        <ChartCard title="Revenue by Transaction Type">
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {typeData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatINR(Number(value), 0)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No type data" />}
        </ChartCard>
      </div>

      {/* Transaction Detail Table */}
      <ChartCard title="Monthly Transaction Breakdown">
        {rev.monthly.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="pb-2 font-medium text-gray-500">Month</th>
                  <th className="pb-2 font-medium text-gray-500">Type</th>
                  <th className="pb-2 font-medium text-gray-500 text-right">Count</th>
                  <th className="pb-2 font-medium text-gray-500 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {rev.monthly.map((t, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-stone-50/50">
                    <td className="py-2 text-gray-900">{t.month}</td>
                    <td className="py-2">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ background: TXN_COLORS[t.txnType] || '#6b7280' }}>
                        {TXN_LABELS[t.txnType] || t.txnType}
                      </span>
                    </td>
                    <td className="py-2 text-right text-gray-600">{t.txnCount}</td>
                    <td className="py-2 text-right font-medium text-gray-900">{formatINR(t.totalAmount, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState message="No transactions" />}
      </ChartCard>
    </div>
  )
}

/* ── Main Export: VaultAnalyticsDashboard ──────────────────────────────────── */

const SUB_TABS: Array<{ id: SubTab; label: string; icon: typeof BarChart3 }> = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'vaults', label: 'Vault Performance', icon: Layers },
  { id: 'investors', label: 'Investor Intelligence', icon: Users },
  { id: 'geography', label: 'Geographic Insights', icon: MapPin },
  { id: 'pipeline', label: 'Pipeline Analytics', icon: Activity },
  { id: 'revenue', label: 'Revenue & Transactions', icon: IndianRupee },
]

export default function VaultAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<SubTab>('overview')
  const { data, isLoading, error } = useFullAnalytics()
  const refreshMutation = useRefreshAnalytics()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-3 text-gray-500 text-sm">Loading analytics…</span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <PieChartIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Failed to load analytics data</p>
        <p className="text-xs text-gray-400 mt-1">Please try again later</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">Vault Analytics</h2>
          <p className="text-sm text-gray-500 mt-0.5">Real-time platform metrics across all vaults</p>
        </div>
        <button
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/5 text-primary text-sm font-medium hover:bg-primary/10 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-gray-200">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-t-lg text-sm font-medium transition-colors border-b-2 ${
                active
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-stone-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab data={data} />}
      {activeTab === 'vaults' && <VaultPerformanceTab data={data} />}
      {activeTab === 'investors' && <InvestorTab data={data} />}
      {activeTab === 'geography' && <GeographyTab data={data} />}
      {activeTab === 'pipeline' && <PipelineTab data={data} />}
      {activeTab === 'revenue' && <RevenueTab data={data} />}
    </div>
  )
}
