import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, FileText } from 'lucide-react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { useKnowledgeArticle } from '@/hooks/useKnowledgeHub'
import IntrinsicValueArticleContent from './IntrinsicValueArticleContent'

/** Themed renderers so admin-authored Markdown looks like a real article page. */
const mdComponents: Components = {
  h1: ({ children }) => <h2 className="font-display text-xl font-bold text-theme-primary mt-6 mb-3 first:mt-0">{children}</h2>,
  h2: ({ children }) => <h2 className="font-display text-lg font-bold text-theme-primary mt-6 mb-3 first:mt-0 pb-1.5 border-b border-theme">{children}</h2>,
  h3: ({ children }) => <h3 className="font-display text-base font-bold text-theme-primary mt-5 mb-2">{children}</h3>,
  p: ({ children }) => <p className="text-[15px] text-theme-secondary leading-relaxed my-3">{children}</p>,
  strong: ({ children }) => <strong className="font-bold text-theme-primary">{children}</strong>,
  em: ({ children }) => <em className="italic text-theme-secondary">{children}</em>,
  ul: ({ children }) => <ul className="list-disc list-outside ml-5 space-y-1.5 my-3 text-[15px] text-theme-secondary marker:text-primary">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-outside ml-5 space-y-1.5 my-3 text-[15px] text-theme-secondary marker:text-theme-tertiary">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">{children}</a>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-700 dark:text-amber-400 italic [&>p]:my-0 [&>p]:text-amber-700 dark:[&>p]:text-amber-400">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-6 border-theme" />,
  code: ({ children }) => <code className="bg-[var(--bg-surface-hover)] border border-theme px-1.5 py-0.5 rounded text-[13px] font-mono text-theme-primary">{children}</code>,
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-theme">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-[var(--bg-surface-hover)]">{children}</thead>,
  th: ({ children }) => <th className="text-left font-semibold text-theme-primary px-3 py-2 border-b border-theme">{children}</th>,
  td: ({ children }) => <td className="text-theme-secondary px-3 py-2 border-b border-theme align-top">{children}</td>,
  tr: ({ children }) => <tr className="even:bg-[var(--bg-surface-hover)]/40">{children}</tr>,
}

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
  const videos = (article?.assets ?? []).filter((a) => a.assetType === 'video')

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

              {/* Body — Markdown rendered as a styled article */}
              {article.slug && ['intrinsic-value', 'calculating-intrinsic-value'].includes(article.slug) ? (
                <div className="knowledge-body mt-4">
                  <IntrinsicValueArticleContent />
                </div>
              ) : article.body ? (
                <div className="knowledge-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={mdComponents}>
                    {article.body}
                  </ReactMarkdown>
                </div>
              ) : null}

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
                      <div className="flex items-center gap-3 p-3 border-b border-theme/50">
                        <FileText className="h-5 w-5 text-primary shrink-0" />
                        <span className="text-sm font-semibold text-theme-primary truncate">
                          {pdf.filename ?? 'Document'}
                        </span>
                      </div>
                      <iframe
                        src={`${pdf.url}#toolbar=0&navpanes=0&scrollbar=0`}
                        title={pdf.filename ?? 'PDF'}
                        className="w-full h-[500px]"
                      />
                    </div>
                  ))}
                </section>
              )}

              {/* Videos */}
              {videos.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">Videos</h3>
                  <div className="flex flex-col gap-4">
                    {videos.map((vid) => (
                      <div key={vid.id} className="rounded-xl overflow-hidden border border-theme bg-black relative">
                        <video 
                          src={vid.url} 
                          controls 
                          controlsList="nodownload" 
                          disablePictureInPicture
                          className="w-full h-auto max-h-[600px] object-contain"
                        />
                      </div>
                    ))}
                  </div>
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
