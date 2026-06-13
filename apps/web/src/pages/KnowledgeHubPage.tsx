import { useState } from 'react'
import { MainLayout } from '@/components/layout'
import SEOHead from '@/components/SEOHead'
import WLogo3D from '@/components/ui/WLogo3D'
import KnowledgeArticleModal from '@/components/knowledge/KnowledgeArticleModal'
import { useKnowledgeArticles, type KnowledgeArticleSummary } from '@/hooks/useKnowledgeHub'
import { BookOpen, FileText, Image as ImageIcon, Loader2 } from 'lucide-react'

function KnowledgeTile({ article, onOpen }: { article: KnowledgeArticleSummary; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group text-left card overflow-hidden p-0 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)] transition-all duration-300"
    >
      {/* Cover */}
      <div className="aspect-video bg-[var(--bg-surface-hover)] overflow-hidden flex items-center justify-center">
        {article.coverImageUrl ? (
          <img
            src={article.coverImageUrl}
            alt={article.title}
            draggable={false}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
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
              <KnowledgeTile key={article.id} article={article} onOpen={() => setActiveSlug(article.slug)} />
            ))}
          </div>
        )}
      </div>

      {activeSlug && <KnowledgeArticleModal slug={activeSlug} onClose={() => setActiveSlug(null)} />}
    </MainLayout>
  )
}
