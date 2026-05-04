import { useControlDashboard } from '@/hooks/useControlCentre'
import { useApprovalStats } from '@/hooks/useApprovals'
import { ROLE_LABELS, type UserRole } from '@/lib/constants'
import { ShieldMetricsCard } from '@/components/shield/ShieldMetricsCard'
import { CenteredLoader, StatCard } from './shared'

export default function DashboardTab() {
  const { data, isLoading } = useControlDashboard()
  const { data: approvalStats } = useApprovalStats()

  if (isLoading) return <CenteredLoader />
  if (!data) return <p className="text-theme-tertiary text-center py-12">Failed to load dashboard</p>

  return (
    <div className="space-y-8">
      <h2 className="font-display text-xl font-bold text-theme-primary">Platform Overview</h2>

      <ShieldMetricsCard />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={data.totalUsers} color="text-primary bg-primary/5" />
        <StatCard label="Pending Approvals" value={approvalStats?.pending ?? data.pendingApprovals} color="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30" />
        <StatCard label="Opportunities" value={data.totalOpportunities} color="text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30" />
        <StatCard label="Active Configs" value={data.activeConfigs} color="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30" />
      </div>

      {/* Role distribution */}
      <div>
        <h3 className="font-semibold text-theme-primary mb-3">Role Distribution</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(data.roleDistribution).map(([role, count]) => (
            <div key={role} className="rounded-lg border border-theme px-4 py-3 bg-[var(--bg-surface)]">
              <p className="text-xs font-medium text-theme-tertiary uppercase tracking-wider">{ROLE_LABELS[role as UserRole] ?? role}</p>
              <p className="text-lg font-bold font-mono text-theme-primary mt-1">{count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
