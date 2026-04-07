import { PortalLayout } from '@/components/layout'
import MetricCard from '@/components/wealth/MetricCard'
import PropertyCard from '@/components/wealth/PropertyCard'
import { useInvestmentSummary } from '@/hooks/useInvestment'
import { useRecentTransactions } from '@/hooks/usePortfolio'
import { useFeaturedProperties, type Property } from '@/hooks/useProperties'
import { formatINRCompact, formatPercent, formatDate } from '@/lib/formatters'
import { useNavigate, Link } from 'react-router-dom'
import {
  Wallet, TrendingUp, PieChart, Building2, ArrowRight, ArrowUpRight,
  ArrowDownRight, Users, Gift, CreditCard,
} from 'lucide-react'

function PortfolioMetrics() {
  const { data: summary, isLoading } = useInvestmentSummary()

  const metrics = [
    { label: 'Total Invested', value: formatINRCompact(summary?.totalInvested ?? 0), icon: <Wallet className="h-5 w-5 text-primary" />, delta: undefined },
    { label: 'Current Value', value: formatINRCompact(summary?.currentValue ?? 0), icon: <TrendingUp className="h-5 w-5 text-primary" />, delta: summary ? ((summary.currentValue - summary.totalInvested) / summary.totalInvested * 100).toFixed(1) + '%' : undefined, deltaPositive: (summary?.currentValue ?? 0) >= (summary?.totalInvested ?? 0) },
    { label: 'Avg. IRR', value: formatPercent(summary?.avgIrr ?? 0), icon: <PieChart className="h-5 w-5 text-primary" />, delta: undefined },
    { label: 'Properties', value: String(summary?.propertiesCount ?? 0), icon: <Building2 className="h-5 w-5 text-primary" />, delta: undefined },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m) => (
        <MetricCard
          key={m.label}
          label={m.label}
          value={m.value}
          icon={m.icon}
          delta={m.delta}
          deltaPositive={m.deltaPositive}
          isLoading={isLoading}
        />
      ))}
    </div>
  )
}

function RecentTransactionsTable() {
  const { data: txns, isLoading } = useRecentTransactions(5)

  const typeIcon: Record<string, typeof Wallet> = {
    investment: ArrowUpRight,
    payout: ArrowDownRight,
    referral_bonus: Gift,
    wealthpass: CreditCard,
  }

  const typeColor: Record<string, string> = {
    investment: 'text-danger',
    payout: 'text-success',
    referral_bonus: 'text-primary',
    wealthpass: 'text-warning',
  }

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="skeleton h-6 w-40 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title text-lg">Recent Transactions</h3>
        <Link to="/portal/investor/transactions" className="text-sm font-semibold text-primary hover:underline">
          View All
        </Link>
      </div>

      {!txns?.length ? (
        <p className="text-sm text-gray-400 text-center py-8">No transactions yet</p>
      ) : (
        <div className="space-y-3">
          {txns.map((tx) => {
            const Icon = typeIcon[tx.type] ?? Wallet
            const color = typeColor[tx.type] ?? 'text-gray-400'
            return (
              <div key={tx.id} className="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl hover:bg-gray-100 transition-colors">
                <div className={`h-9 w-9 rounded-xl bg-white flex items-center justify-center shadow-sm ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{tx.propertyTitle || tx.type.replace('_', ' ')}</p>
                  <p className="text-xs text-gray-500">{formatDate(tx.date)}</p>
                </div>
                <p className={`font-mono text-sm font-semibold ${tx.type === 'investment' ? 'text-danger' : 'text-success'}`}>
                  {tx.type === 'investment' ? '-' : '+'}{formatINRCompact(tx.amount)}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function RecommendedProperties() {
  const navigate = useNavigate()
  const { data, isLoading } = useFeaturedProperties()
  const properties = data?.properties?.slice(0, 3) ?? ([] as Property[])

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title text-lg">Recommended for You</h3>
        <Link to="/marketplace" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
          Explore <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <PropertyCard key={i} isLoading title="" city="" assetType="" coverImage="" targetIrr={0} minInvestment={0} raised={0} target={0} />
            ))
          : properties.map((p) => (
              <PropertyCard
                key={p.id}
                title={p.title}
                city={p.city}
                assetType={p.assetType}
                coverImage={p.coverImage}
                targetIrr={p.targetIrr}
                minInvestment={p.minInvestment}
                raised={p.raised}
                target={p.target}
                onCardClick={() => navigate(`/marketplace/${p.slug}`)}
                onInvestClick={() => navigate(`/marketplace/${p.slug}`)}
              />
            ))}
      </div>
    </div>
  )
}

export default function InvestorDashboardPage() {
  return (
    <PortalLayout variant="investor">
      {/* Hero section */}
      <div className="page-hero bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        <div className="page-hero-content">
          <span className="page-hero-badge">Investor Dashboard</span>
          <h1 className="page-hero-title">Welcome back 👋</h1>
          <p className="page-hero-subtitle">Here's your portfolio overview — track your wealth journey in real time.</p>
        </div>
      </div>

      <div className="page-section">
        <div className="page-section-container space-y-8">
          <PortfolioMetrics />

          <div className="grid lg:grid-cols-2 gap-6">
            <RecentTransactionsTable />
            <div className="space-y-6">
              {/* Quick actions */}
              <div className="card p-6">
                <h3 className="section-title text-lg mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/marketplace" className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl hover:bg-primary/10 transition-all duration-200 hover:shadow-sm group">
                    <div className="stat-card-icon bg-primary/10 group-hover:scale-110 transition-transform">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">Browse Properties</span>
                  </Link>
                  <Link to="/portal/investor/portfolio" className="flex items-center gap-3 p-4 bg-stone-50 rounded-2xl hover:bg-gray-100 transition-all duration-200 hover:shadow-sm group">
                    <div className="stat-card-icon bg-gray-100 group-hover:scale-110 transition-transform">
                      <PieChart className="h-5 w-5 text-gray-500" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">My Portfolio</span>
                  </Link>
                  <Link to="/community" className="flex items-center gap-3 p-4 bg-stone-50 rounded-2xl hover:bg-gray-100 transition-all duration-200 hover:shadow-sm group">
                    <div className="stat-card-icon bg-gray-100 group-hover:scale-110 transition-transform">
                      <Users className="h-5 w-5 text-gray-500" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">Community</span>
                  </Link>
                  <Link to="/portal/investor/referrals" className="flex items-center gap-3 p-4 bg-stone-50 rounded-2xl hover:bg-gray-100 transition-all duration-200 hover:shadow-sm group">
                    <div className="stat-card-icon bg-gray-100 group-hover:scale-110 transition-transform">
                      <Gift className="h-5 w-5 text-gray-500" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">Refer & Earn</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <RecommendedProperties />
        </div>
      </div>
    </PortalLayout>
  )
}
