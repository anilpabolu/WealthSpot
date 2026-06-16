import { useControlDashboard } from '@/hooks/useControlCentre'
import { useApprovalStats } from '@/hooks/useApprovals'
import { ROLE_LABELS, type UserRole } from '@/lib/constants'
import { ShieldMetricsCard } from '@/components/shield/ShieldMetricsCard'
import { CenteredLoader, StatCard, SectionHeading } from '../control/shared'

export default function DashboardTab() {
  const { data, isLoading } = useControlDashboard()
  const { data: approvalStats } = useApprovalStats()

  if (isLoading) return <CenteredLoader />
  if (!data) return <p className="text-[var(--text-tertiary)] text-center py-12">Failed to load dashboard</p>

  return (
    <div className="space-y-8 max-w-5xl">
      <SectionHeading>Platform Overview</SectionHeading>

      <ShieldMetricsCard />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Users" value={data.totalUsers} color="text-[#D4AF37] bg-[var(--bg-surface)]" />
        <StatCard label="Pending Approvals" value={approvalStats?.pending ?? data.pendingApprovals} color="text-[#D4AF37] bg-[var(--bg-surface)]" />
        <StatCard label="Opportunities" value={data.totalOpportunities} color="text-[#D4AF37] bg-[var(--bg-surface)]" />
        <StatCard label="Active Configs" value={data.activeConfigs} color="text-[#D4AF37] bg-[var(--bg-surface)]" />
      </div>

      {/* Role distribution */}
      <div>
        <SectionHeading>Role Distribution</SectionHeading>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Object.entries(data.roleDistribution).map(([role, count]) => (
            <div key={role} className="rounded-xl border border-[rgba(209,196,157,0.25)] px-4 py-3 bg-[var(--bg-surface)] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <p className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">{ROLE_LABELS[role as UserRole] ?? role}</p>
              <p className="text-xl font-bold font-mono text-[var(--text-primary)] mt-1">{count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
