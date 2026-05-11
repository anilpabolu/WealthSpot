import { useCommDashboard } from '@/hooks/useCommMessages'
import { Loader2, Mail, MessageSquare, BellRing, AlertCircle, Clock } from 'lucide-react'

function KpiCard({
  label,
  sent,
  delivered,
  opened,
  failed,
}: {
  label: string
  sent: number
  delivered: number
  opened: number
  failed: number
}) {
  const deliveryRate = sent > 0 ? Math.round((delivered / sent) * 100) : 0
  return (
    <div className="rounded-xl border border-theme bg-[var(--bg-surface)] p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-theme-tertiary mb-3">{label}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-2xl font-bold text-theme-primary">{sent.toLocaleString()}</p>
          <p className="text-xs text-theme-secondary">Sent</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-emerald-500">{deliveryRate}%</p>
          <p className="text-xs text-theme-secondary">Delivered</p>
        </div>
        {opened > 0 && (
          <div>
            <p className="text-lg font-semibold text-theme-primary">{opened.toLocaleString()}</p>
            <p className="text-xs text-theme-secondary">Opened</p>
          </div>
        )}
        {failed > 0 && (
          <div>
            <p className="text-lg font-semibold text-red-500">{failed.toLocaleString()}</p>
            <p className="text-xs text-theme-secondary">Failed</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CommDashboard() {
  const { data, isLoading, error } = useCommDashboard(7)

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center gap-2 text-red-500 py-8">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">Failed to load dashboard</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-theme-primary">Communication Dashboard</h2>
        <p className="text-sm text-theme-secondary">Last {data.period_days} days</p>
      </div>

      {/* Outbox health */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <Clock className="h-4 w-4 text-amber-500" />
          <div>
            <p className="text-lg font-bold text-amber-500">{data.outbox_pending}</p>
            <p className="text-xs text-theme-secondary">Outbox pending</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <div>
            <p className="text-lg font-bold text-red-500">{data.outbox_failed}</p>
            <p className="text-xs text-theme-secondary">Outbox failed</p>
          </div>
        </div>
      </div>

      {/* Channel KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Email" icon={Mail} {...data.email} />
        <KpiCard label="SMS" icon={MessageSquare} {...data.sms} />
        <KpiCard label="WhatsApp" icon={MessageSquare} {...data.whatsapp} />
        <KpiCard label="In-App" icon={BellRing} {...data.in_app} />
      </div>
    </div>
  )
}
