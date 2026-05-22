import { cn } from '@/lib/utils'

interface WLogo3DProps {
  size?: number
  spin?: boolean
  light?: boolean
  className?: string
}

export default function WLogo3D({ size = 32, className }: WLogo3DProps) {
  return (
    <img
      src="/wealthspot-logo-light.png"
      alt="WealthSpot"
      width={size}
      height={size}
      draggable={false}
      className={cn('shrink-0 object-contain', className)}
      style={{ width: size, height: size }}
    />
  )
}
