import type { ReactNode } from 'react'

/**
 * Minimal layout shell for auth-flow pages (persona selection, onboarding).
 * No navbar / footer — just a clean full-screen wrapper.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  return <>{children}</>
}
