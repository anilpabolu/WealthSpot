/**
 * WLogo3D — The WealthSpot "W" logomark with a 3D rotation effect.
 *
 * Uses Framer Motion for CSS 3D perspective rotation (no extra deps).
 * When `/wealthspot-w-logo.png` is present in public/, it renders the image.
 * Falls back to a polished SVG "W" in gold gradient if the image is missing.
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface WLogo3DProps {
  size?: number
  spin?: boolean
  className?: string
}

/** Premium medallion fallback — renders if the logo image cannot load */
function WFallback({ size }: { size: number }) {
  const id = `goldGrad-${size}`
  const baseId = `baseGrad-${size}`
  const stroke = Math.max(4, size / 12)
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      style={{ filter: `drop-shadow(0 0 ${size / 4}px rgba(212,175,55,0.7))` }}
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF7B8" />
          <stop offset="45%" stopColor="#D4AF37" />
          <stop offset="72%" stopColor="#825B12" />
          <stop offset="100%" stopColor="#FAE284" />
        </linearGradient>
        <radialGradient id={baseId} cx="35%" cy="25%" r="75%">
          <stop offset="0%" stopColor="#1B173E" />
          <stop offset="55%" stopColor="#0D1029" />
          <stop offset="100%" stopColor="#040612" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="27" fill={`url(#${baseId})`} stroke={`url(#${id})`} strokeWidth="2.5" />
      <circle cx="32" cy="32" r="22" stroke="#D4AF37" strokeWidth="0.8" opacity="0.55" />
      <path
        d="M14.5 30.5C19 17 26.5 18.5 32 23C37.5 18.5 45 17 49.5 30.5"
        stroke="#D4AF37"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
      <path
        d="M16.5 20.5L23.6 44.2L32 28.6L40.4 44.2L47.5 20.5"
        stroke={`url(#${id})`}
        strokeWidth={stroke}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function WLogo3D({ size = 32, spin = true, className }: WLogo3DProps) {
  const [imgFailed, setImgFailed] = useState(false)

  return (
    <div
      className={cn('relative flex items-center justify-center shrink-0', className)}
      style={{ width: size, height: size, perspective: `${size * 25}px` }}
    >
      {/* Radial gold ambient glow behind the logo */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: size * 2.2,
          height: size * 2.2,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(212,175,55,0.30) 0%, rgba(212,175,55,0.08) 50%, transparent 75%)',
          filter: `blur(${size / 5}px)`,
          borderRadius: '50%',
        }}
      />

      <motion.div
        style={{ transformStyle: 'preserve-3d', width: size, height: size }}
        animate={spin ? { rotateY: [0, 360] } : {}}
        transition={spin ? { duration: 8, repeat: Infinity, ease: 'linear', repeatType: 'loop' } : {}}
      >
        {imgFailed ? (
          <WFallback size={size} />
        ) : (
          <img
            src="/wealthspot-w-logo.png"
            alt="WealthSpot"
            width={size}
            height={size}
            draggable={false}
            onError={() => setImgFailed(true)}
            style={{
              width: size,
              height: size,
              objectFit: 'contain',
              filter: `drop-shadow(0 0 ${size / 5}px rgba(212,175,55,0.75)) drop-shadow(0 0 ${size / 3}px rgba(212,175,55,0.35))`,
            }}
          />
        )}
      </motion.div>
    </div>
  )
}
