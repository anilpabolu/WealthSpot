type SplashScreenProps = {
  exiting: boolean
}

export default function SplashScreen({ exiting }: SplashScreenProps) {
  // Don't show the splash when landing directly on pages that render
  // behind the header (e.g. /vaults) — it can cover the hero and confuse
  // header contrast detection. This keeps startup UX consistent.
  if (typeof window !== 'undefined' && location.pathname.startsWith('/vaults')) {
    return null
  }

  return (
    <div
      className={`boot-splash${exiting ? ' boot-splash--exit' : ''}`}
      role="status"
      aria-label="Loading WealthSpot"
      aria-live="polite"
    >
      <img
        src="/wealthspot-logo-light.png"
        alt="WealthSpot"
        width={280}
        height={88}
        draggable={false}
        className="boot-splash__logo"
      />
    </div>
  )
}
