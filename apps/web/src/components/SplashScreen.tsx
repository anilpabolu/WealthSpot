type SplashScreenProps = {
  exiting: boolean
}

export default function SplashScreen({ exiting }: SplashScreenProps) {
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
