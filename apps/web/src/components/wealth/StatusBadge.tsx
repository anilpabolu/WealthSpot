import { cn } from '@/lib/utils'

export type StatusType =
  | 'draft'
  | 'under_review'
  | 'active'
  | 'funding'
  | 'funded'
  | 'exited'
  | 'rejected'
  | 'pending'
  | 'live'
  | 'upcoming'
  | 'closed'
  | 'failed'

export interface StatusBadgeProps {
  status: StatusType
  className?: string
}

const statusConfig: Record<string, { label: string; classes: string; icon: string }> = {
  draft: { label: 'Draft', classes: 'bg-gray-100 text-gray-600', icon: '◯' },
  under_review: { label: 'Under Review', classes: 'bg-amber-100 text-amber-700', icon: '◷' },
  active: { label: 'Active', classes: 'bg-emerald-100 text-emerald-700', icon: '●' },
  funding: { label: 'Funding', classes: 'bg-blue-100 text-blue-700', icon: '●' },
  funded: { label: 'Fully Funded', classes: 'bg-purple-100 text-purple-700', icon: '✓' },
  exited: { label: 'Exited', classes: 'bg-gray-100 text-gray-600', icon: '—' },
  rejected: { label: 'Rejected', classes: 'bg-red-100 text-red-600', icon: '✕' },
  pending: { label: 'Pending', classes: 'bg-amber-100 text-amber-700', icon: '◷' },
  // Legacy aliases
  live: { label: 'Live', classes: 'bg-emerald-100 text-emerald-700', icon: '●' },
  upcoming: { label: 'Upcoming', classes: 'bg-blue-100 text-blue-700', icon: '◷' },
  closed: { label: 'Closed', classes: 'bg-gray-100 text-gray-600', icon: '—' },
  failed: { label: 'Failed', classes: 'bg-red-100 text-red-600', icon: '✕' },
}

const fallbackConfig = { label: 'Unknown', classes: 'bg-gray-100 text-gray-500', icon: '?' }

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? fallbackConfig
  return (
    <span
      className={cn('text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1', config.classes, className)}
      aria-label={`Status: ${config.label}`}
    >
      <span className="text-[0.5rem]">{config.icon}</span>
      {config.label}
    </span>
  )
}
