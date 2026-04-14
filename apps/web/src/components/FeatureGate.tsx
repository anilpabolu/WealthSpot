import { type ReactNode } from 'react'
import { useCanAccess } from '@/hooks/useVaultFeatures'

interface FeatureGateProps {
  vault: 'wealth' | 'opportunity' | 'community'
  feature: string
  children: ReactNode
  fallback?: ReactNode
}

export default function FeatureGate({ vault, feature, children, fallback = null }: FeatureGateProps) {
  const { allowed, isLoading } = useCanAccess(vault, feature)
  if (isLoading) return null
  return allowed ? <>{children}</> : <>{fallback}</>
}
