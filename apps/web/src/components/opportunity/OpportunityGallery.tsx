import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Play, X } from 'lucide-react'
import WLogo3D from '@/components/ui/WLogo3D'

export function OpportunityGallery({ images, title, videoUrl, propertyVideosEnabled }: { images: string[]; title: string; videoUrl?: string; propertyVideosEnabled: boolean }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [showVideoPlayer, setShowVideoPlayer] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const touchStartRef = useRef(0)

  const startAutoPlay = useCallback(() => {
    if (images.length <= 1) return
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setActiveIdx((i) => (i < images.length - 1 ? i + 1 : 0))
    }, 5000)
  }, [images.length])

  // Circular navigation (wraps both directions — no blank slide).
  const goNext = useCallback(() => setActiveIdx((i) => (i < images.length - 1 ? i + 1 : 0)), [images.length])
  const goPrev = useCallback(() => setActiveIdx((i) => (i > 0 ? i - 1 : images.length - 1)), [images.length])

  useEffect(() => {
    startAutoPlay()
    return () => clearInterval(intervalRef.current)
  }, [startAutoPlay])

  // Lightbox: pause auto-play, lock body scroll, wire keyboard (Esc / arrows)
  // and block common save shortcuts (Ctrl/Cmd + S/P/C) while open.
  useEffect(() => {
    if (!lightboxOpen) return
    clearInterval(intervalRef.current)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
      else if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'c'].includes(e.key.toLowerCase())) e.preventDefault()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      startAutoPlay()
    }
  }, [lightboxOpen, goNext, goPrev, startAutoPlay])

  // No images uploaded for this opportunity → show the WealthSpot brand logo
  // centered (no carousel / auto-play). Theme-aware: dark mark on light bg, light mark on dark bg.
  if (!images.length) {
    return (
      <div className="aspect-video bg-theme-surface-hover rounded-xl flex items-center justify-center">
        <WLogo3D size={120} light={false} className="opacity-90 block dark:hidden" />
        <WLogo3D size={120} light={true} className="opacity-90 hidden dark:block" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        <div
          className="aspect-video rounded-xl overflow-hidden relative bg-black/5 dark:bg-white/5"
          onTouchStart={(e) => { touchStartRef.current = e.touches[0]?.clientX ?? 0 }}
          onTouchEnd={(e) => {
            const diff = touchStartRef.current - (e.changedTouches[0]?.clientX ?? 0)
            if (Math.abs(diff) > 50) {
              if (diff > 0) setActiveIdx((i) => (i < images.length - 1 ? i + 1 : 0))
              else setActiveIdx((i) => (i > 0 ? i - 1 : images.length - 1))
              startAutoPlay()
            }
          }}
        >
          <img
            src={images[activeIdx]}
            alt={`${title} - ${activeIdx + 1}`}
            onClick={() => setLightboxOpen(true)}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            className="w-full h-full block object-cover cursor-zoom-in select-none"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none'; 
              target.parentElement?.classList.add('bg-theme-surface-hover');
              
              // Only add placeholder if it doesn't exist
              if (!target.parentElement?.querySelector('.fallback-placeholder')) {
                const placeholder = document.createElement('div'); 
                placeholder.className = 'fallback-placeholder absolute inset-0 flex items-center justify-center bg-theme-surface-hover'; 
                placeholder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-theme-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>'; 
                target.parentElement?.appendChild(placeholder);
              }
            }}
            onLoad={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'block';
              const placeholder = target.parentElement?.querySelector('.fallback-placeholder');
              if (placeholder) placeholder.remove();
            }}
          />
          {images.length > 1 && (
            <>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button key={i} onClick={() => { setActiveIdx(i); startAutoPlay() }} className={`h-2 rounded-full transition-all ${i === activeIdx ? 'w-5 bg-[var(--bg-surface)]' : 'w-2 bg-[var(--bg-card)]'}`} aria-label={`Go to image ${i + 1}`} />
                ))}
              </div>
            </>
          )}
          <span className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-md">{activeIdx + 1} / {images.length}</span>
          {propertyVideosEnabled && videoUrl?.trim() && (
            <button
              onClick={() => setShowVideoPlayer(true)}
              className="absolute bottom-3 right-3 bg-black/70 hover:bg-black/90 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Play className="h-4 w-4 fill-white" /> Watch Video
            </button>
          )}
        </div>
      </div>

      {/* Video Player Modal */}
      {propertyVideosEnabled && showVideoPlayer && videoUrl?.trim() && (
        <div className="modal-overlay p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowVideoPlayer(false)} />
          <div className="relative bg-black rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden">
            <button
              onClick={() => setShowVideoPlayer(false)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
              aria-label="Close video"
            >
              <X className="h-5 w-5" />
            </button>
            <video
              src={videoUrl}
              controls
              autoPlay
              muted
              playsInline
              className="w-full aspect-video"
              controlsList="nodownload"
              onError={(e) => {
                const video = e.target as HTMLVideoElement;
                video.style.display = 'none';
                const msg = document.createElement('div');
                msg.className = 'w-full aspect-video flex flex-col items-center justify-center text-white/70 gap-3';
                msg.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15.6 11.6L22 7v10l-6.4-4.6M4 5h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7c0-1.1.9-2 2-2z"/><line x1="2" y1="2" x2="22" y2="22" stroke-width="2"/></svg><span class="text-sm">Video is not available at this moment</span>';
                video.parentElement?.appendChild(msg);
              }}
            >
              Your browser does not support video playback.
            </video>
          </div>
        </div>
      )}

      {/* Image lightbox */}
      {lightboxOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 secure-image-viewer select-none p-4"
          style={{ userSelect: 'none' }}
          onClick={() => setLightboxOpen(false)}
          onContextMenu={(e) => e.preventDefault()}
          onTouchStart={(e) => { touchStartRef.current = e.touches[0]?.clientX ?? 0 }}
          onTouchEnd={(e) => {
            const diff = touchStartRef.current - (e.changedTouches[0]?.clientX ?? 0)
            if (Math.abs(diff) > 50) { if (diff > 0) goNext(); else goPrev() }
          }}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>

          <img
            src={images[activeIdx]}
            alt={`${title} - ${activeIdx + 1}`}
            draggable={false}
            className="max-w-[92vw] max-h-[88vh] object-contain rounded-lg shadow-2xl select-none pointer-events-none"
            style={{ userSelect: 'none' }}
          />

          {images.length > 1 && (
            <>
              <span className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/10 text-white text-sm px-3 py-1 rounded-full">{activeIdx + 1} / {images.length}</span>
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setActiveIdx(i) }}
                    className={`h-2.5 rounded-full transition-all ${i === activeIdx ? 'w-6 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/70'}`}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          <style>{`@media print { .secure-image-viewer { display: none !important; } }`}</style>
        </div>,
        document.body,
      )}
    </>
  )
}
