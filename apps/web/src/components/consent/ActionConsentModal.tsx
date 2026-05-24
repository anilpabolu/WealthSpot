import { ShieldAlert, X } from 'lucide-react'
import { useState } from 'react'

export interface ActionConsentModalProps {
  onConsent: () => void
  onDecline: () => void
  title?: string
  disclaimerText?: string
}

export function ActionConsentModal({
  onConsent,
  onDecline,
  title = 'Risk Acknowledgement & Consent',
  disclaimerText = 'I acknowledge the risks of real estate investing and knowingly and willingly agree to proceed with this operation. I understand that my consent and device details will be recorded for compliance purposes.',
}: ActionConsentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConsent = async () => {
    setIsSubmitting(true)
    try {
      await onConsent()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay p-4 z-[9999]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onDecline} />
      <div className="modal-panel max-w-lg relative animate-fade-up">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--bg-surface)] border-b border-theme px-6 py-4 rounded-t-2xl flex items-center gap-3 z-10">
          <div className="p-2 bg-amber-500/10 rounded-lg shrink-0">
            <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="font-display text-lg font-bold text-theme-primary flex-1">{title}</h2>
          <button onClick={onDecline} disabled={isSubmitting} className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors disabled:opacity-50" aria-label="Close">
            <X className="h-5 w-5 text-theme-tertiary" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="p-4 bg-theme-surface-hover rounded-xl border border-theme text-sm text-theme-secondary leading-relaxed">
            {disclaimerText}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onDecline}
              disabled={isSubmitting}
              className="btn-secondary flex-1 py-3 font-semibold"
            >
              I Decline
            </button>
            <button
              onClick={handleConsent}
              disabled={isSubmitting}
              className="btn-primary flex-1 py-3 font-semibold flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'I Consent'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
