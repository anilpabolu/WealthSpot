import { cn } from '@/lib/utils'

interface WLogo3DProps {
  size?: number | string
  spin?: boolean
  light?: boolean
  className?: string
}

export default function WLogo3D({ size = 32, light = true, className }: WLogo3DProps) {
  return (
    <img
      src={light ? '/wealthspot-logo-light.png' : '/wealthspot-logo-dark.png'}
      alt="WealthSpot"
      width={size}
      height={size}
      draggable={false}
      className={cn('shrink-0 object-contain', className)}
      style={{
        width: size,
        height: size,
      }}
    />
  )
}
