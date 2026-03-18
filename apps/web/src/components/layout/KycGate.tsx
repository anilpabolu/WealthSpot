import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { ShieldAlert, ArrowRight, Loader2 } from 'lucide-react'
import { KYC_STATUS } from '@/lib/constants'

interface KycGateProps {
  /** Current user KYC status */
  kycStatus: string
  /** Content to show when KYC is approved */
  children: ReactNode
  /** Loading while checking KYC status */
  isLoading?: boolean
  /** Custom fallback component instead of default prompt */
  fallback?: ReactNode
}

/**
 * KycGate wraps protected content and redirects users
 * to KYC verification if their status isn't approved.
 * Used to gate investment flows per SEBI compliance.
 */
export default function KycGate({
  kycStatus,
  children,
  isLoading = false,
  fallback,
}: KycGateProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    )
  }

  if (kycStatus === KYC_STATUS.APPROVED) {
    return <>{children}</>
  }

  if (kycStatus === KYC_STATUS.REJECTED) {
    return (
      fallback ?? (
        <div className="max-w-md mx-auto text-center py-16 px-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <ShieldAlert className="h-8 w-8 text-danger" />
          </div>
          <h2 className="font-display text-xl font-bold text-gray-900 mb-2">
            KYC Verification Failed
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Your identity verification was rejected. Please contact support or re-submit
            your documents for review.
          </p>
          <a
            href="/auth/kyc/identity"
            className="btn-primary inline-flex items-center gap-2"
          >
            Re-submit KYC
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      )
    )
  }

  if (kycStatus === KYC_STATUS.UNDER_REVIEW) {
    return (
      fallback ?? (
        <div className="max-w-md mx-auto text-center py-16 px-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
            <Loader2 className="h-8 w-8 text-warning animate-spin" />
          </div>
          <h2 className="font-display text-xl font-bold text-gray-900 mb-2">
            KYC Under Review
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Your documents are being verified. This usually takes 24-48 hours.
            We'll notify you once approved.
          </p>
          <div className="text-xs text-gray-400">
            Submitted documents are encrypted and processed securely.
          </div>
        </div>
      )
    )
  }

  // NOT_STARTED or IN_PROGRESS — redirect to KYC page
  if (kycStatus === KYC_STATUS.NOT_STARTED) {
    return <Navigate to="/auth/kyc/identity" replace />
  }

  // IN_PROGRESS
  return (
    fallback ?? (
      <div className="max-w-md mx-auto text-center py-16 px-4">
        <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <ShieldAlert className="h-8 w-8 text-primary" />
        </div>
        <h2 className="font-display text-xl font-bold text-gray-900 mb-2">
          Complete Your KYC
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Before you can invest, we need to verify your identity as per SEBI regulations.
          This is a one-time process and takes about 5 minutes.
        </p>
        <a
          href="/auth/kyc/identity"
          className="btn-primary inline-flex items-center gap-2"
        >
          Complete KYC Now
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    )
  )
}
