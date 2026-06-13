import { useRef, useState } from 'react'
import { Plus, Trash2, Loader2, BookOpen, Upload, Star, FileText, Save } from 'lucide-react'
import {
  useAdminKnowledgeArticles,
  useCreateKnowledgeArticle,
  useUpdateKnowledgeArticle,
  useDeleteKnowledgeArticle,
  useUploadKnowledgeAssets,
  useDeleteKnowledgeAsset,
  type KnowledgeArticleDetail,
} from '@/hooks/useKnowledgeHub'

function ArticleEditor({ article }: { article: KnowledgeArticleDetail }) {
  const update = useUpdateKnowledgeArticle()
  const del = useDeleteKnowledgeArticle()
  const uploadAssets = useUploadKnowledgeAssets()
  const deleteAsset = useDeleteKnowledgeAsset()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(article.title)
  const [synopsis, setSynopsis] = useState(article.synopsis)
  const [body, setBody] = useState(article.body ?? '')

  const dirty = title !== article.title || synopsis !== article.synopsis || body !== (article.body ?? '')
  const images = article.assets.filter((a) => a.assetType === 'image')
  const pdfs = article.assets.filter((a) => a.assetType === 'pdf')

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${article.isPublished ? 'bg-green-500/15 text-green-600' : 'bg-amber-500/15 text-amber-600'}`}>
            {article.isPublished ? 'Published' : 'Draft'}
          </span>
          <code className="text-xs text-theme-tertiary truncate">/{article.slug}</code>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => update.mutate({ id: article.id, isPublished: !article.isPublished })}
            disabled={update.isPending}
            className="text-xs px-2.5 py-1 rounded-lg bg-theme-surface-hover text-theme-secondary hover:text-theme-primary"
          >
            {article.isPublished ? 'Unpublish' : 'Publish'}
          </button>
          <button
            onClick={() => { if (confirm('Delete this tile and all its files?')) del.mutate(article.id) }}
            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
            aria-label="Delete tile"
          >
            <Trash2 className="h-4 w-4 text-red-400" />
          </button>
        </div>
      </div>

      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="input text-sm font-semibold" />
      <textarea value={synopsis} onChange={(e) => setSynopsis(e.target.value)} placeholder="Synopsis (shown on the tile)" className="input text-sm min-h-[56px]" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body — shown in the popup. Supports Markdown: ## Heading, **bold**, - lists, | tables |, > callouts. Blank line = new paragraph." className="input text-sm min-h-[120px] font-mono" />

      {dirty && (
        <button
          onClick={() => update.mutate({ id: article.id, title, synopsis, body })}
          disabled={update.isPending || !title.trim() || !synopsis.trim()}
          className="btn-primary text-sm flex items-center gap-1.5"
        >
          {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
        </button>
      )}

      {/* Attachments */}
      <div className="pt-2 border-t border-theme space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-theme-tertiary">Attachments</span>
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
            {uploadAssets.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Upload images / PDFs
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              className="sr-only"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? [])
                if (files.length) uploadAssets.mutate({ articleId: article.id, files })
                e.target.value = ''
              }}
            />
          </label>
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {images.map((img) => (
              <div key={img.id} className="relative group rounded-lg overflow-hidden border border-theme">
                <img src={img.url} alt={img.filename ?? ''} className="w-full h-20 object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => update.mutate({ id: article.id, coverImageUrl: img.url })}
                    title="Set as cover"
                    className={`p-1.5 rounded-full ${article.coverImageUrl === img.url ? 'bg-primary text-white' : 'bg-white/90 text-slate-800'}`}
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteAsset.mutate({ articleId: article.id, assetId: img.id })}
                    title="Remove"
                    className="p-1.5 rounded-full bg-white/90 text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {article.coverImageUrl === img.url && (
                  <span className="absolute top-1 left-1 text-[9px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-full">COVER</span>
                )}
              </div>
            ))}
          </div>
        )}

        {pdfs.map((pdf) => (
          <div key={pdf.id} className="flex items-center justify-between gap-2 text-sm bg-theme-surface-hover rounded-lg px-3 py-2">
            <span className="flex items-center gap-2 min-w-0 text-theme-secondary">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{pdf.filename ?? 'Document.pdf'}</span>
            </span>
            <button
              onClick={() => deleteAsset.mutate({ articleId: article.id, assetId: pdf.id })}
              className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 shrink-0"
            >
              <Trash2 className="h-4 w-4 text-red-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function KnowledgeHubTab() {
  const { data: articles, isLoading } = useAdminKnowledgeArticles()
  const create = useCreateKnowledgeArticle()
  const [showNew, setShowNew] = useState(false)
  const [title, setTitle] = useState('')
  const [synopsis, setSynopsis] = useState('')
  const [body, setBody] = useState('')

  const submit = () => {
    if (!title.trim() || !synopsis.trim()) return
    create.mutate(
      { title, synopsis, body: body || null, isPublished: true },
      { onSuccess: () => { setShowNew(false); setTitle(''); setSynopsis(''); setBody('') } },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-theme-primary">Knowledge Hub</h2>
          <p className="text-sm text-theme-secondary mt-1">Create content tiles (text + images + PDFs) shown on the public Knowledge Hub.</p>
        </div>
        <button onClick={() => setShowNew((s) => !s)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="h-4 w-4" /> New Tile
        </button>
      </div>

      {showNew && (
        <div className="card p-4 space-y-3 border-primary/30">
          <h3 className="text-sm font-semibold text-theme-primary">New Knowledge Tile</h3>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="input text-sm" />
          <textarea value={synopsis} onChange={(e) => setSynopsis(e.target.value)} placeholder="Synopsis (shown on the tile)" className="input text-sm min-h-[56px]" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body (optional) — supports Markdown (## headings, **bold**, - lists, tables, > callouts). Add images / PDFs after creating." className="input text-sm min-h-[100px] font-mono" />
          <div className="flex gap-2">
            <button onClick={submit} disabled={!title.trim() || !synopsis.trim() || create.isPending} className="btn-primary text-sm">
              {create.isPending ? 'Creating…' : 'Create tile'}
            </button>
            <button onClick={() => setShowNew(false)} className="btn-ghost text-sm">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-theme-tertiary py-8">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading tiles…
        </div>
      ) : !articles || articles.length === 0 ? (
        <div className="text-center py-12 text-theme-tertiary">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No knowledge tiles yet. Click "New Tile" to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {articles.map((article) => (
            <ArticleEditor key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  )
}
