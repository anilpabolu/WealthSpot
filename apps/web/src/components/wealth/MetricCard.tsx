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

export default function MetricCard({
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
      <div className={cn('bg-white border border-gray-200 rounded-xl p-6', className)}>
        <div className="skeleton h-4 w-20 mb-3" />
        <div className="skeleton h-8 w-32 mb-2" />
        <div className="skeleton h-3 w-24" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'bg-white border border-gray-200 rounded-xl p-6 transition-shadow hover:shadow-md',
        className
      )}
      role="group"
      aria-label={`${label}: ${value}`}
    >
      {icon && (
        <div className="flex justify-end mb-2">
          <div className="text-gray-300 w-8 h-8">{icon}</div>
        </div>
      )}
      <p className="metric-label">{label}</p>
      <p className="metric-value mt-1">{value}</p>
      {delta && (
        <p
          className={cn(
            'text-xs font-medium mt-1 flex items-center gap-1',
            deltaPositive ? 'text-green-600' : 'text-red-500'
          )}
        >
          <span>{deltaPositive ? '↗' : '↘'}</span>
          {delta}
        </p>
      )}
    </div>
  )
}
