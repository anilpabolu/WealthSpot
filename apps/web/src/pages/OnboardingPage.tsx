import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

/**
 * /onboarding — Redirects straight to /vaults (video section removed).
 */
export default function OnboardingPage() {
  const navigate = useNavigate()

  useEffect(() => {
    localStorage.setItem('ws_onboarded', 'true')
    navigate('/vaults', { replace: true })
  }, [navigate])

  return null
}
