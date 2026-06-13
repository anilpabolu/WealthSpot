import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, FileText } from 'lucide-react'
import { useKnowledgeArticle } from '@/hooks/useKnowledgeHub'

/**
 * Knowledge article popup.
 *
 * - Closes ONLY via the ✕ button (no backdrop click, no Esc) — explicit requirement.
 * - Content is copy-protected like SecureDocViewer: right-click, text selection,
 *   image drag, and Ctrl/Cmd+S/P/C are blocked; the panel is hidden from print and
 *   blurred when the tab loses focus. (OS-level screenshots cannot truly be blocked
 *   in a browser — this raises the bar against casual copying only.)
 */
export default function KnowledgeArticleModal({
  slug,
  onClose,
}: {
  slug: string
  onClose: () => void
}) {
  const { data: article, isLoading } = useKnowledgeArticle(slug)
  const [isHidden, setIsHidden] = useState(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Block save / print / copy. Deliberately NOT closing on Escape.
      if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'c'].includes(e.key.toLowerCase())) {
        e.preventDefault()
      }
    }
    const onVisibility = () => setIsHidden(document.hidden)
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('visibilitychange', onVisibility)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('visibilitychange', onVisibility)
      document.body.style.overflow = prevOverflow
    }
  }, [])

  const images = (article?.assets ?? []).filter((a) => a.assetType === 'image')
  const pdfs = (article?.assets ?? []).filter((a) => a.assetType === 'pdf')
  const paragraphs = (article?.body ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 secure-knowledge-viewer"
      onContextMenu={(e) => e.preventDefault()}
      style={{ userSelect: 'none' }}
    >
      <div
        className={`relative w-full max-w-3xl max-h-[90vh] bg-[var(--bg-surface)] rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all ${isHidden ? 'blur-xl' : ''}`}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Header — the ✕ is the only way to close */}
        <div className="shrink-0 sticky top-0 z-10 flex items-start justify-between gap-4 px-6 py-4 border-b border-theme bg-[var(--bg-surface)]">
          <h2 className="font-display text-lg md:text-xl font-bold text-theme-primary leading-snug pr-2">
            {article?.title ?? 'Loading…'}
          </h2>
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] text-theme-tertiary hover:text-theme-primary transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {isLoading || !article ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Synopsis lead */}
              {article.synopsis && (
                <p className="text-base text-theme-secondary leading-relaxed border-l-2 border-primary/40 pl-4 italic">
                  {article.synopsis}
                </p>
              )}

              {/* Body */}
              {paragraphs.length > 0 && (
                <div className="space-y-4">
                  {paragraphs.map((p, i) => (
                    <p
                      key={i}
                      className="text-[15px] text-theme-primary leading-relaxed whitespace-pre-line"
                    >
                      {p}
                    </p>
                  ))}
                </div>
              )}

              {/* Images */}
              {images.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">Gallery</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {images.map((img) => (
                      <img
                        key={img.id}
                        src={img.url}
                        alt={img.filename ?? article.title}
                        draggable={false}
                        className="w-full rounded-xl border border-theme object-cover select-none pointer-events-none"
                        style={{ userSelect: 'none' }}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Documents (embedded, protected) */}
              {pdfs.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">Documents</h3>
                  {pdfs.map((pdf) => (
                    <div key={pdf.id} className="rounded-xl border border-theme overflow-hidden bg-[var(--bg-surface-hover)]">
                      <div className="flex items-center gap-2 px-3 py-2 border-b border-theme text-sm text-theme-secondary">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="truncate">{pdf.filename ?? 'Document'}</span>
                      </div>
                      <iframe
                        src={`${pdf.url}#toolbar=0&navpanes=0&scrollbar=0`}
                        title={pdf.filename ?? 'Document'}
                        className="w-full border-0"
                        style={{ height: '70vh' }}
                        sandbox="allow-same-origin allow-scripts"
                      />
                    </div>
                  ))}
                </section>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`@media print { .secure-knowledge-viewer { display: none !important; } }`}</style>
    </div>,
    document.body,
  )
}
