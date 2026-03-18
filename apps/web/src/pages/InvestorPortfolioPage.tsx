import { PortalLayout } from '@/components/layout'
import MetricCard from '@/components/wealth/MetricCard'
import { usePortfolioSummary, usePortfolioProperties } from '@/hooks/usePortfolio'
import { formatINRCompact, formatPercent } from '@/lib/formatters'
import { Wallet, TrendingUp, PieChart, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Link } from 'react-router-dom'

function SummaryMetrics() {
  const { data: summary, isLoading } = usePortfolioSummary()

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Total Invested"
        value={formatINRCompact(summary?.totalInvested ?? 0)}
        icon={<Wallet className="h-5 w-5 text-primary" />}
        isLoading={isLoading}
      />
      <MetricCard
        label="Current Value"
        value={formatINRCompact(summary?.currentValue ?? 0)}
        icon={<TrendingUp className="h-5 w-5 text-primary" />}
        delta={summary ? formatPercent((summary.currentValue - summary.totalInvested) / summary.totalInvested * 100) : undefined}
        deltaPositive={(summary?.currentValue ?? 0) >= (summary?.totalInvested ?? 0)}
        isLoading={isLoading}
      />
      <MetricCard
        label="XIRR"
        value={formatPercent(summary?.xirr ?? 0)}
        icon={<BarChart3 className="h-5 w-5 text-primary" />}
        isLoading={isLoading}
      />
      <MetricCard
        label="Monthly Income"
        value={formatINRCompact(summary?.monthlyIncome ?? 0)}
        icon={<PieChart className="h-5 w-5 text-primary" />}
        isLoading={isLoading}
      />
    </div>
  )
}

function AssetAllocation() {
  const { data: summary, isLoading } = usePortfolioSummary()
  const allocation = summary?.assetAllocation ?? []

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="skeleton h-6 w-40 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-8 w-full rounded" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <h3 className="font-display text-lg font-bold text-gray-900 mb-4">Asset Allocation</h3>
      {allocation.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No data</p>
      ) : (
        <div className="space-y-3">
          {allocation.map((a) => (
            <div key={a.type}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700 capitalize">{a.type.replace('_', ' ')}</span>
                <span className="text-sm font-mono font-semibold text-gray-900">{formatPercent(a.percentage)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${a.percentage}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CityDistribution() {
  const { data: summary, isLoading } = usePortfolioSummary()
  const cities = summary?.cityDistribution ?? []

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="skeleton h-6 w-40 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-8 w-full rounded" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <h3 className="font-display text-lg font-bold text-gray-900 mb-4">City Distribution</h3>
      {cities.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No data</p>
      ) : (
        <div className="space-y-3">
          {cities.map((c) => (
            <div key={c.city} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
              <span className="text-sm text-gray-700">{c.city}</span>
              <div className="text-right">
                <span className="text-sm font-mono font-semibold text-gray-900">{formatINRCompact(c.value)}</span>
                <span className="text-xs text-gray-500 ml-2">({formatPercent(c.percentage)})</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PropertiesTable() {
  const { data: properties, isLoading } = usePortfolioProperties()

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="skeleton h-6 w-40 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-16 w-full rounded-lg" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-6 pb-3">
        <h3 className="font-display text-lg font-bold text-gray-900">My Properties</h3>
      </div>

      {!properties?.length ? (
        <div className="p-6 pt-0 text-center">
          <p className="text-sm text-gray-400 py-8">No investments yet. Start investing today!</p>
          <Link to="/marketplace" className="btn-primary">
            Explore Properties
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase text-gray-500">Property</th>
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase text-gray-500">Invested</th>
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase text-gray-500">Current Value</th>
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase text-gray-500">Returns</th>
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase text-gray-500">IRR</th>
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {properties.map((p) => {
                const returnPct = p.returnPercentage
                const isPositive = returnPct >= 0
                return (
                  <tr key={p.propertyId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={p.propertyImage} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        <div>
                          <p className="font-medium text-gray-900">{p.propertyTitle}</p>
                          <p className="text-xs text-gray-500">{p.propertyCity} · {p.assetType}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono">{formatINRCompact(p.investedAmount)}</td>
                    <td className="px-6 py-4 text-right font-mono">{formatINRCompact(p.currentValue)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center gap-1 font-mono font-semibold ${isPositive ? 'text-success' : 'text-danger'}`}>
                        {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                        {formatPercent(returnPct)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-semibold text-primary">{formatPercent(p.irr)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="pill-active">{p.status}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function InvestorPortfolioPage() {
  return (
    <PortalLayout variant="investor">
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">My Portfolio</h1>
          <p className="text-gray-500 mt-1">Track your real estate investments</p>
        </div>

        <SummaryMetrics />

        <div className="grid lg:grid-cols-2 gap-6">
          <AssetAllocation />
          <CityDistribution />
        </div>

        <PropertiesTable />
      </div>
    </PortalLayout>
  )
}
