import { useState } from 'react'
import { ShieldAlert, ExternalLink, Check, Loader2 } from 'lucide-react'
import { useUser } from '@clerk/react'
import { useUserStore } from '@/stores/user.store'
import { useRecordConsent, useConsentStatus } from '@/hooks/useConsent'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function GlobalConsentGate({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useUser()
  const { isAuthenticated } = useUserStore()
  
  const queryClient = useQueryClient()
  const recordConsent = useRecordConsent()
  const { data: status, isLoading: statusLoading } = useConsentStatus()

  const [regulatoryAccepted, setRegulatoryAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [communicationAccepted, setCommunicationAccepted] = useState(false)

  // Block rendering until auth is loaded and we know if the user is authenticated
  if (!isLoaded) return null

  // If not authenticated, we don't need consent to view public pages
  if (!isAuthenticated) return <>{children}</>

  // If status is loading, we could render children or a loader, 
  // but to prevent flash of content, we'll render children and overlay later if needed
  const needsConsent = !statusLoading && status && !status.has_consented

  const isSubmitEnabled = regulatoryAccepted && privacyAccepted
  const CURRENT_VERSION = status?.consent_version || "v1.0"

  const handleConsent = async () => {
    if (!isSubmitEnabled) return
    
    try {
      await recordConsent.mutateAsync({
        context: 'ONBOARDING',
        consent_version: CURRENT_VERSION,
        regulatory_accepted: regulatoryAccepted,
        privacy_accepted: privacyAccepted,
        communication_accepted: communicationAccepted
      })
      // Update cache so the gate closes immediately
      queryClient.setQueryData(['consent_status'], { has_consented: true, consent_version: CURRENT_VERSION })
    } catch {
      console.warn("Failed to record consent API call.")
    }
  }

  if (!needsConsent) {
    return <>{children}</>
  }

  return (
    <>
      {children}
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        {/* Intentionally opaque backdrop that cannot be clicked away */}
        <div className="absolute inset-0 bg-theme-surface/95 backdrop-blur-xl" />
        
        <div className="modal-panel w-full max-w-2xl relative animate-fade-up shadow-2xl border border-theme max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-[var(--bg-surface)] border-b border-theme px-6 py-5 shrink-0 flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/15 rounded-xl shrink-0">
              <ShieldAlert className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-theme-primary">Platform Agreements</h2>
              <p className="text-xs text-theme-secondary mt-0.5">Please review and accept our core policies to continue.</p>
            </div>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
            {/* Checkbox 1 */}
            <div className={cn(
              "p-4 rounded-xl border transition-colors cursor-pointer",
              regulatoryAccepted ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-theme bg-theme-surface-hover"
            )} onClick={() => setRegulatoryAccepted(!regulatoryAccepted)}>
              <div className="flex gap-4">
                <div className="pt-1">
                  <div className={cn(
                    "w-6 h-6 rounded border flex items-center justify-center transition-colors",
                    regulatoryAccepted ? "bg-[#D4AF37] border-[#D4AF37] text-black" : "border-theme-border bg-theme-surface"
                  )}>
                    {regulatoryAccepted && <Check className="w-4 h-4" />}
                  </div>
                </div>
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                    <span className="font-semibold text-theme-primary text-sm">Platform Role & Regulatory Acknowledgement</span>
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-red-500/10 text-red-500 w-fit">Mandatory</span>
                  </div>
                  <p className="text-sm text-theme-secondary leading-relaxed">
                    I understand and acknowledge that WealthSpot operates solely as a real estate discovery, intelligence, networking, and advisory platform. WealthSpot does not pool investor funds, manage collective investment structures, provide regulated investment advisory services, or guarantee investment outcomes. All investment decisions and transactions are undertaken independently by me and directly with the respective developer, seller, or asset owner.
                  </p>
                </div>
              </div>
            </div>

            {/* Checkbox 2 */}
            <div className={cn(
              "p-4 rounded-xl border transition-colors cursor-pointer",
              privacyAccepted ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-theme bg-theme-surface-hover"
            )} onClick={() => setPrivacyAccepted(!privacyAccepted)}>
              <div className="flex gap-4">
                <div className="pt-1">
                  <div className={cn(
                    "w-6 h-6 rounded border flex items-center justify-center transition-colors",
                    privacyAccepted ? "bg-[#D4AF37] border-[#D4AF37] text-black" : "border-theme-border bg-theme-surface"
                  )}>
                    {privacyAccepted && <Check className="w-4 h-4" />}
                  </div>
                </div>
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                    <span className="font-semibold text-theme-primary text-sm">Privacy & Data Processing Consent</span>
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-red-500/10 text-red-500 w-fit">Mandatory</span>
                  </div>
                  <p className="text-sm text-theme-secondary leading-relaxed">
                    I consent to the collection, storage, processing, and use of my personal information by WealthSpot for platform onboarding, opportunity discovery, communication, due diligence coordination, documentation support, and related advisory interactions in accordance with the Privacy Policy and applicable data protection laws.
                  </p>
                </div>
              </div>
            </div>

            {/* Checkbox 3 */}
            <div className={cn(
              "p-4 rounded-xl border transition-colors cursor-pointer",
              communicationAccepted ? "border-primary bg-primary/5" : "border-theme bg-theme-surface-hover"
            )} onClick={() => setCommunicationAccepted(!communicationAccepted)}>
              <div className="flex gap-4">
                <div className="pt-1">
                  <div className={cn(
                    "w-6 h-6 rounded border flex items-center justify-center transition-colors",
                    communicationAccepted ? "bg-primary border-primary text-primary-foreground" : "border-theme-border bg-theme-surface"
                  )}>
                    {communicationAccepted && <Check className="w-4 h-4" />}
                  </div>
                </div>
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                    <span className="font-semibold text-theme-primary text-sm">Communication Consent</span>
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 w-fit">Recommended</span>
                  </div>
                  <p className="text-sm text-theme-secondary leading-relaxed">
                    I agree to receive communications, market insights, opportunity updates, event invitations, and related notifications from WealthSpot through email, phone calls, SMS, or WhatsApp.
                  </p>
                </div>
              </div>
            </div>

            {/* Links section */}
            <div className="pt-2 flex flex-wrap gap-4 items-center justify-center text-xs">
              <Link to="/legal/terms" target="_blank" className="text-theme-secondary hover:text-[#D4AF37] flex items-center gap-1 transition-colors">
                Terms of Use <ExternalLink className="w-3 h-3" />
              </Link>
              <span className="w-1 h-1 rounded-full bg-theme-border"></span>
              <Link to="/legal/privacy" target="_blank" className="text-theme-secondary hover:text-[#D4AF37] flex items-center gap-1 transition-colors">
                Privacy Policy <ExternalLink className="w-3 h-3" />
              </Link>
              <span className="w-1 h-1 rounded-full bg-theme-border"></span>
              <Link to="/legal/terms" target="_blank" className="text-theme-secondary hover:text-[#D4AF37] flex items-center gap-1 transition-colors">
                Risk Disclosure <ExternalLink className="w-3 h-3" />
              </Link>
              <span className="w-1 h-1 rounded-full bg-theme-border"></span>
              <Link to="/legal/terms" target="_blank" className="text-theme-secondary hover:text-[#D4AF37] flex items-center gap-1 transition-colors">
                Disclaimer <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
          
          <div className="bg-[var(--bg-surface)] border-t border-theme px-6 py-5 shrink-0">
            <button
              onClick={handleConsent}
              disabled={recordConsent.isPending || !isSubmitEnabled}
              className="btn-primary w-full py-3.5 font-bold flex justify-center items-center gap-2"
            >
              {recordConsent.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Accept & Continue'
              )}
            </button>
            {!isSubmitEnabled && (
              <p className="text-center text-xs text-theme-secondary mt-3">
                You must accept the mandatory terms to continue.
              </p>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
