import { dotColorForStatus } from '@/lib/assessments'

interface ShieldDotProps {
  status: string
  pulse?: boolean
  size?: 'sm' | 'md' | 'lg'
  title?: string
}

/**
 * The signature glowing dot of WealthSpot Shield. Green = passed,
 * amber = flagged, sky = in progress, muted = not started.
 */
export function ShieldDot({ status, pulse, size = 'md', title }: ShieldDotProps) {
  const dim =
    size === 'sm' ? 'h-2 w-2' : size === 'lg' ? 'h-3.5 w-3.5' : 'h-2.5 w-2.5'
  return (
    <span
      role="status"
      title={title ?? status}
      aria-label={title ?? status}
      className={[
        'inline-block rounded-full',
        dim,
        dotColorForStatus(status),
        pulse && status === 'in_progress' ? 'animate-pulse' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    />
  )
}
