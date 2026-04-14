import { memo } from 'react'
import { cn } from '@/lib/utils'
import { formatINR } from '@/lib/formatters'

export interface FundingBarProps {
  raised: number
  target: number
  showLabels?: boolean
  showPercent?: boolean
  showAmount?: boolean
  className?: string
  isLoading?: boolean
}

export default memo(function FundingBar({
  raised,
  target,
  showLabels = true,
  showPercent = true,
  showAmount = true,
  className,
  isLoading = false,
}: FundingBarProps) {
  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-1 w-full rounded-full" />
      </div>
    )
  }

  const percent = target > 0 ? Math.min((raised / target) * 100, 100) : 0
  const percentStr = `${percent.toFixed(0)}%`

  return (
    <div className={cn('space-y-1', className)} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={`Funding progress: ${percentStr}`}>
      {(showPercent || showAmount) && (
        <div className="flex items-center justify-between text-sm">
          {showPercent && (
            <span className="text-primary font-semibold text-sm">{percentStr} Funded</span>
          )}
          {showAmount && (
            <span className="text-theme-secondary font-mono text-xs">
              {formatINR(raised, 0)} of {formatINR(target, 0)}
            </span>
          )}
        </div>
      )}
      <div className="h-1 bg-[var(--bg-surface-hover)] rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
          style={{ width: percentStr }}
        />
      </div>
      {showLabels && (
        <div className="flex items-center justify-between text-xs text-theme-tertiary">
          <span>Raised</span>
          <span>Target</span>
        </div>
      )}
    </div>
  )
})
