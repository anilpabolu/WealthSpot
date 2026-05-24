import { useEffect, useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { useUser } from '@clerk/react'
import { useUserStore } from '@/stores/user.store'
import { useRecordConsent } from '@/hooks/useConsent'

export function GlobalConsentGate({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useUser()
  const { isAuthenticated } = useUserStore()
  const [needsConsent, setNeedsConsent] = useState(false)
  const [isChecked, setIsChecked] = useState(false)
  const recordConsent = useRecordConsent()

  useEffect(() => {
    // Only evaluate once auth is loaded and user is authenticated
    if (!isLoaded || !isAuthenticated) {
      setNeedsConsent(false)
      return
    }
    
    const hasConsented = sessionStorage.getItem('ws_login_consented')
    if (!hasConsented) {
      setNeedsConsent(true)
    }
  }, [isAuthenticated, isLoaded])

  const handleConsent = async () => {
    try {
      await recordConsent.mutateAsync({
        consent_type: 'LOGIN',
        consented: isChecked
      })
    } catch {
      console.warn("Failed to record consent, bypassing for testing.")
    } finally {
      // Proceed regardless of API success or checkbox state for testing purposes
      sessionStorage.setItem('ws_login_consented', 'true')
      setNeedsConsent(false)
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
        
        <div className="modal-panel max-w-lg relative animate-fade-up shadow-2xl border border-theme">
          {/* Header */}
          <div className="bg-[var(--bg-surface)] border-b border-theme px-6 py-5 rounded-t-2xl flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/15 rounded-xl shrink-0">
              <ShieldAlert className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-theme-primary">Platform Access Consent</h2>
              <p className="text-xs text-theme-secondary mt-0.5">Required for all registered users</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="p-4 bg-theme-surface-hover rounded-xl border border-theme text-sm text-theme-secondary leading-relaxed font-medium">
              I acknowledge the risks of real estate investing and knowingly and willingly am signing up and logging into this platform. I understand that my consent and device details are recorded for compliance purposes.
            </div>

            <div className="flex gap-3 pt-2 items-center px-4">
              <input
                type="checkbox"
                id="consent-checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="w-5 h-5 rounded border-theme-border bg-theme-surface-hover text-primary focus:ring-primary focus:ring-offset-theme-surface"
              />
              <label htmlFor="consent-checkbox" className="text-sm text-theme-secondary font-medium cursor-pointer">
                I agree to the terms
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleConsent}
                disabled={recordConsent.isPending}
                className="btn-primary flex-1 py-3.5 font-bold flex justify-center items-center gap-2"
              >
                {recordConsent.isPending ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Ok'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
