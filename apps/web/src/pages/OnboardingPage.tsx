import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import OnboardingVideo from '@/components/OnboardingVideo'
import { useVaultConfig } from '@/hooks/useVaultConfig'

/**
 * /onboarding — Mandatory first-time video after signup.
 * If user has already been onboarded, or intro videos are disabled in
 * Control Centre, redirect straight to /vaults.
 */
export default function OnboardingPage() {
  const navigate = useNavigate()
  const { introVideosEnabled } = useVaultConfig()

  useEffect(() => {
    if (localStorage.getItem('ws_onboarded') === 'true') {
      navigate('/vaults', { replace: true })
    }
  }, [navigate])

  // If the admin has disabled intro videos, skip straight through.
  useEffect(() => {
    if (introVideosEnabled === false) {
      localStorage.setItem('ws_onboarded', 'true')
      navigate('/vaults', { replace: true })
    }
  }, [introVideosEnabled, navigate])

  const handleComplete = () => {
    localStorage.setItem('ws_onboarded', 'true')
    navigate('/vaults')
  }

  // While config is loading (undefined) show nothing to avoid a flash.
  if (introVideosEnabled !== true) return null

  return <OnboardingVideo mode="onboarding" onComplete={handleComplete} />
}
