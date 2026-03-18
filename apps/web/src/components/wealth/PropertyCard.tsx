import { cn } from '@/lib/utils'
import { formatINRCompact, formatPercent } from '@/lib/formatters'
import FundingBar from './FundingBar'
import type { StatusType } from './StatusBadge'

export interface PropertyCardProps {
  title: string
  city: string
  micromarket?: string
  assetType: string
  coverImage: string
  targetIrr: number
  minInvestment: number
  raised: number
  target: number
  investorCount?: number
  status?: StatusType
  reraNumber?: string
  className?: string
  isLoading?: boolean
  onInvestClick?: () => void
  onCardClick?: () => void
}

export default function PropertyCard({
  title,
  city,
  micromarket,
  assetType,
  coverImage,
  targetIrr,
  minInvestment,
  raised,
  target,
  investorCount,
  reraNumber,
  className,
  isLoading = false,
  onInvestClick,
  onCardClick,
}: PropertyCardProps) {
  if (isLoading) {
    return (
      <div className={cn('bg-white border border-gray-200 rounded-xl overflow-hidden', className)}>
        <div className="skeleton aspect-video w-full" />
        <div className="p-4 space-y-3">
          <div className="skeleton h-5 w-3/4" />
          <div className="skeleton h-3 w-1/2" />
          <div className="flex gap-4">
            <div className="skeleton h-8 w-20" />
            <div className="skeleton h-8 w-20" />
          </div>
          <div className="skeleton h-1 w-full rounded-full" />
          <div className="skeleton h-4 w-24 ml-auto" />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'bg-white border border-gray-200 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-gray-300 cursor-pointer group',
        className
      )}
      onClick={onCardClick}
      role="article"
      aria-label={`${title} — ${city}`}
    >
      {/* Cover Image */}
      <div className="aspect-video relative overflow-hidden">
        <img
          src={coverImage}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          width={640}
          height={360}
        />
        {/* Category badge */}
        <span className="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
          {assetType}
        </span>
        {/* Property info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
          <h3 className="text-white font-semibold text-lg drop-shadow-sm">{title}</h3>
          <p className="text-gray-200 text-sm flex items-center gap-1">
            📍 {micromarket ? `${micromarket}, ` : ''}{city}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Financial metrics */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Target IRR</p>
            <p className="font-mono font-bold text-2xl text-gray-900">{formatPercent(targetIrr)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Min Invest</p>
            <p className="font-mono font-bold text-lg text-gray-900">{formatINRCompact(minInvestment)}</p>
          </div>
        </div>

        {/* Funding progress */}
        <FundingBar raised={raised} target={target} showLabels={false} />

        {/* Footer */}
        <div className="flex items-center justify-between mt-3">
          {investorCount !== undefined && (
            <span className="text-xs text-gray-400">{investorCount} investors</span>
          )}
          {reraNumber && (
            <span className="text-xs text-gray-400 truncate max-w-[120px]" title={reraNumber}>
              RERA ✓
            </span>
          )}
          <button
            className="text-primary font-semibold text-sm hover:underline ml-auto"
            onClick={(e) => {
              e.stopPropagation()
              onInvestClick?.()
            }}
            aria-label={`Invest now in ${title}`}
          >
            INVEST NOW ›
          </button>
        </div>
      </div>
    </div>
  )
}
