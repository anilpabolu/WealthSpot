import { useUser } from '@clerk/react'
import { Navigate, useLocation } from 'react-router-dom'

/**
 * Wraps a route element so that:
 * 1. While Clerk is still loading → show nothing (parent Suspense shows loader)
 * 2. If no authenticated user → redirect to landing page
 * 3. If authenticated → render children
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded, user } = useUser()
  const location = useLocation()

  if (!isLoaded) return null // Suspense fallback handles the loading UX

  if (!user) {
    return <Navigate to="/" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}
