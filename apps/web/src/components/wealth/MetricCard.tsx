import { memo } from 'react'
import { cn } from '@/lib/utils'

export interface MetricCardProps {
  label: string
  value: string
  delta?: string
  deltaPositive?: boolean
  icon?: React.ReactNode
  className?: string
  isLoading?: boolean
}

export default memo(function MetricCard({
  label,
  value,
  delta,
  deltaPositive,
  icon,
  className,
  isLoading = false,
}: MetricCardProps) {
  if (isLoading) {
    return (
      <div className={cn('stat-card', className)}>
        <div className="skeleton h-4 w-20 mb-3" />
        <div className="skeleton h-8 w-32 mb-2" />
        <div className="skeleton h-3 w-24" />
      </div>
    )
  }

  return (
    <div
      className={cn('stat-card', className)}
      role="group"
      aria-label={`${label}: ${value}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="metric-label">{label}</p>
          <p className="metric-value">{value}</p>
          {delta && (
            <p
              className={cn(
                'text-xs font-semibold flex items-center gap-1',
                deltaPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
              )}
            >
              <span>{deltaPositive ? '↗' : '↘'}</span>
              {delta}
            </p>
          )}
        </div>
        {icon && (
          <div className="stat-card-icon bg-primary/10">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
})
