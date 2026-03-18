import { formatPercent } from '@/lib/formatters'
import { cn } from '@/lib/utils'

export interface IrrBadgeProps {
  value: number
  className?: string
}

export default function IrrBadge({ value, className }: IrrBadgeProps) {
  return (
    <span
      className={cn(
        'border border-primary text-primary text-xs font-bold font-mono px-2 py-0.5 rounded inline-flex items-center',
        className
      )}
      aria-label={`Target IRR ${formatPercent(value)}`}
    >
      {formatPercent(value)}
    </span>
  )
}
