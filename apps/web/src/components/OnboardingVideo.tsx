import { useRef, useState, useEffect, useCallback } from 'react'
import { SignUpButton } from '@clerk/react'
import { ArrowRight, X, SkipForward } from 'lucide-react'

/**
 * Full-page video overlay.
 *
 * mode = 'onboarding'  → first-time signup: no skip / close / controls. CTA at end.
 * mode = 'signup'      → Get Started click: video plays, sign-up CTA at end.
 * mode = 'browse'      → "How it Works" click: full controls, closeable.
 */
interface OnboardingVideoProps {
  mode: 'onboarding' | 'browse' | 'signup'
  onComplete: () => void
  onClose?: () => void
}

// Placeholder — replace URL with the real "How it Works" video asset
const VIDEO_SRC = 'https://www.w3schools.com/html/mov_bbb.mp4'

export default function OnboardingVideo({ mode, onComplete, onClose }: OnboardingVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ended, setEnded] = useState(false)
  const [progress, setProgress] = useState(0)
  const [videoError, setVideoError] = useState(false)

  const isControlled = mode === 'browse'  // only browse gets native controls

  // Prevent scrolling while overlay is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current
    if (!v || !v.duration) return
    setProgress((v.currentTime / v.duration) * 100)
  }, [])

  const handleEnded = useCallback(() => {
    setEnded(true)
  }, [])

  const handleSkip = useCallback(() => {
    if (mode === 'browse') {
      onClose?.()
    }
  }, [mode, onClose])

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Top bar — only in browse mode */}
      {/* Top bar — browse & signup modes */}
      {(mode === 'browse' || mode === 'signup') && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
          {mode === 'browse' && (
            <button
              onClick={handleSkip}
              className="flex items-center gap-1 text-white/70 hover:text-white text-sm transition-colors"
            >
              <SkipForward className="h-4 w-4" />
              Skip
            </button>
          )}
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
      )}

      {/* Video */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        {videoError ? (
          <div className="text-center space-y-4">
            <p className="text-white/60 text-sm">Video could not be loaded</p>
            <button
              onClick={() => { setVideoError(false); videoRef.current?.load() }}
              className="text-sm text-primary hover:underline"
            >
              Retry
            </button>
            {onClose && (
              <button onClick={onClose} className="block mx-auto text-white/40 hover:text-white/70 text-sm">
                Close
              </button>
            )}
          </div>
        ) : (
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          className="w-full h-full object-contain"
          autoPlay
          muted
          playsInline
          controls={isControlled}
          controlsList={!isControlled ? 'nodownload nofullscreen noremoteplayback' : undefined}
          disablePictureInPicture={!isControlled}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onError={() => setVideoError(true)}
          onContextMenu={!isControlled ? (e) => e.preventDefault() : undefined}
        />
        )}
      </div>

      {/* Progress bar — onboarding & signup modes (no native controls) */}
      {!isControlled && !ended && (
        <div className="h-1 bg-white/10">
          <div
            className="h-full bg-primary transition-all duration-300 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* CTA — shown when video ends (onboarding mode) */}
      {ended && mode === 'onboarding' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 animate-fade-in">
          <div className="text-center space-y-6">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-2xl shadow-primary/30">
              <svg viewBox="0 0 40 40" className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 5L35 15V30L20 35L5 30V15L20 5Z" />
                <path d="M13 20L18 25L27 16" />
              </svg>
            </div>
            <h2 className="font-display text-3xl font-bold text-white">
              You&apos;re Ready!
            </h2>
            <p className="text-white/60 max-w-md mx-auto">
              Your journey to building wealth through premium real estate starts now.
            </p>
            <button
              onClick={onComplete}
              className="btn-primary text-base px-8 py-3 inline-flex items-center gap-2 shadow-lg shadow-primary/30"
            >
              Unlock My World of Opportunities
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* CTA — shown when video ends (signup mode: Get Started flow) */}
      {ended && mode === 'signup' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 animate-fade-in">
          <div className="text-center space-y-6">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-2xl shadow-primary/30">
              <svg viewBox="0 0 40 40" className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 5L35 15V30L20 35L5 30V15L20 5Z" />
                <path d="M13 20L18 25L27 16" />
              </svg>
            </div>
            <h2 className="font-display text-3xl font-bold text-white">
              Ready to Start Your Journey?
            </h2>
            <p className="text-white/60 max-w-md mx-auto">
              Create your free account and unlock premium investment opportunities.
            </p>
            <SignUpButton mode="modal" forceRedirectUrl="/vaults">
              <button
                className="btn-primary text-base px-8 py-3 inline-flex items-center gap-2 shadow-lg shadow-primary/30"
              >
                Sign Up Now
                <ArrowRight className="h-5 w-5" />
              </button>
            </SignUpButton>
            <button
              onClick={onClose}
              className="block mx-auto text-white/40 hover:text-white/70 text-sm transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* Browse mode: ended state — auto close or show replay */}
      {ended && mode === 'browse' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="text-center space-y-4">
            <button
              onClick={() => {
                setEnded(false)
                setProgress(0)
                videoRef.current?.play()
              }}
              className="text-white/70 hover:text-white text-sm underline"
            >
              Replay
            </button>
            <button
              onClick={onClose}
              className="block mx-auto btn-primary text-base px-8 py-3"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
