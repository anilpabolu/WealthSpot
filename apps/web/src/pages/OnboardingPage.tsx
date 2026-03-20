import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import OnboardingVideo from '@/components/OnboardingVideo'

/**
 * /onboarding — Mandatory first-time video after signup.
 * If user has already been onboarded, redirect straight to KYC.
 */
export default function OnboardingPage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (localStorage.getItem('ws_onboarded') === 'true') {
      navigate('/vaults', { replace: true })
    }
  }, [navigate])

  const handleComplete = () => {
    localStorage.setItem('ws_onboarded', 'true')
    navigate('/vaults')
  }

  return <OnboardingVideo mode="onboarding" onComplete={handleComplete} />
}
