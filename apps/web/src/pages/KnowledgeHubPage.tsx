import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout'
import SEOHead from '@/components/SEOHead'
import WLogo3D from '@/components/ui/WLogo3D'
import KnowledgeArticleModal from '@/components/knowledge/KnowledgeArticleModal'
import { useKnowledgeArticles, type KnowledgeArticleSummary } from '@/hooks/useKnowledgeHub'
import { BookOpen, FileText, Image as ImageIcon, Loader2, ZoomIn, X } from 'lucide-react'
import { createPortal } from 'react-dom'

function ImageZoomModal({ url, onClose }: { url: string; onClose: () => void }) {
  const [isHidden, setIsHidden] = useState(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
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

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 p-4 secure-knowledge-viewer"
      onContextMenu={(e) => e.preventDefault()}
      style={{ userSelect: 'none' }}
    >
      <div
        className={`relative w-full max-w-5xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col transition-all items-center justify-center ${isHidden ? 'blur-xl' : ''}`}
        onContextMenu={(e) => e.preventDefault()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <img
          src={url}
          alt="Zoomed"
          draggable={false}
          className="max-w-full max-h-[90vh] object-contain pointer-events-none select-none"
        />
      </div>
    </div>,
    document.body
  )
}

function KnowledgeTile({ article, onOpen, onZoom }: { article: KnowledgeArticleSummary; onOpen: () => void; onZoom: (url: string) => void }) {
  return (
    <button
      onClick={onOpen}
      className="group text-left card overflow-hidden p-0 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)] transition-all duration-300"
    >
      {/* Cover */}
      <div className="relative aspect-video bg-[var(--bg-surface-hover)] overflow-hidden flex items-center justify-center">
        {article.coverImageUrl ? (
          <>
            <img
              src={article.coverImageUrl}
              alt={article.title}
              draggable={false}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            />
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onZoom(article.coverImageUrl!)
              }}
              className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full text-white/90 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-lg"
              title="Zoom Image"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <WLogo3D size={72} light={false} className="opacity-80 block dark:hidden" />
            <WLogo3D size={72} light={true} className="opacity-80 hidden dark:block" />
          </>
        )}
      </div>

      {/* Body */}
      <div className="p-5 space-y-2.5">
        <h3 className="font-display text-lg font-bold text-theme-primary leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {article.title}
        </h3>
        <p className="text-sm text-theme-secondary leading-relaxed line-clamp-3">{article.synopsis}</p>

        {(article.imageCount > 0 || article.pdfCount > 0) && (
          <div className="flex items-center gap-2 pt-1">
            {article.pdfCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-theme-tertiary bg-[var(--bg-surface-hover)] border border-theme rounded-full px-2 py-0.5">
                <FileText className="h-3 w-3" /> {article.pdfCount} PDF{article.pdfCount > 1 ? 's' : ''}
              </span>
            )}
            {article.imageCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-theme-tertiary bg-[var(--bg-surface-hover)] border border-theme rounded-full px-2 py-0.5">
                <ImageIcon className="h-3 w-3" /> {article.imageCount} image{article.imageCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  )
}

export default function KnowledgeHubPage() {
  const { data: articles, isLoading } = useKnowledgeArticles()
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null)

  return (
    <MainLayout>
      <SEOHead
        title="Knowledge Hub"
        description="Curated insights, guides and research to help you research, evaluate and invest with confidence."
        path="/knowledge-hub"
      />

      {/* Hero — matches the standard page-hero used across the app */}
      <section className="page-hero-navbar bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 -mt-16 relative overflow-hidden pt-[8.5rem] pb-12 lg:pb-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/18 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-[30rem] h-[30rem] rounded-full bg-violet-500/12 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-body text-[11px] font-bold uppercase tracking-[0.28em] text-[#D4AF37] mb-3">
            WealthSpot Knowledge
          </p>
          <h1 className="font-hero text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight leading-[1.1]">
            Knowledge Hub
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed font-body">
            Curated insights, guides and research to help you research, evaluate and invest with confidence.
          </p>
        </div>
      </section>

      {/* Tiles */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : !articles || articles.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-[var(--bg-surface-hover)] flex items-center justify-center mb-4">
              <BookOpen className="h-7 w-7 text-theme-tertiary" />
            </div>
            <h3 className="font-display text-lg font-bold text-theme-primary mb-1">No articles yet</h3>
            <p className="text-sm text-theme-secondary">Fresh insights are on the way — check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <KnowledgeTile key={article.id} article={article} onOpen={() => setActiveSlug(article.slug)} onZoom={(url) => setZoomImageUrl(url)} />
            ))}
          </div>
        )}
      </div>

      {activeSlug && <KnowledgeArticleModal slug={activeSlug} onClose={() => setActiveSlug(null)} />}
      {zoomImageUrl && <ImageZoomModal url={zoomImageUrl} onClose={() => setZoomImageUrl(null)} />}
    </MainLayout>
  )
}
