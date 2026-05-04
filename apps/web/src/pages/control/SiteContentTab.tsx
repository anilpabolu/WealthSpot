import { useState, useMemo } from 'react'
import { Search, Plus, Check, X, Edit3, Trash2, Loader2, FileText } from 'lucide-react'
import {
  useAllSiteContent,
  useUpdateSiteContent,
  useCreateSiteContent,
  useDeleteSiteContent,
  type SiteContentItem,
} from '@/hooks/useSiteContent'

export default function SiteContentTab() {
  const { data: allContent, isLoading } = useAllSiteContent()
  const updateMut = useUpdateSiteContent()
  const createMut = useCreateSiteContent()
  const deleteMut = useDeleteSiteContent()
  const [searchTerm, setSearchTerm] = useState('')
  const [activePage, setActivePage] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [newPage, setNewPage] = useState('')
  const [newSection, setNewSection] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const pageCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of allContent || []) {
      counts[c.page || 'unknown'] = (counts[c.page || 'unknown'] || 0) + 1
    }
    return counts
  }, [allContent])

  const pageNames = useMemo(() => Object.keys(pageCounts).sort(), [pageCounts])

  const items = useMemo(() => (allContent || []).filter((c) => {
    if (activePage && c.page !== activePage) return false
    if (!searchTerm) return true
    const q = searchTerm.toLowerCase()
    return c.page?.toLowerCase().includes(q) || c.section_tag?.toLowerCase().includes(q) || c.value?.toLowerCase().includes(q)
  }), [allContent, activePage, searchTerm])

  const grouped = useMemo(() => items.reduce<Record<string, SiteContentItem[]>>((acc, item) => {
    const page = item.page || 'unknown'
    ;(acc[page] ??= []).push(item)
    return acc
  }, {}), [items])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-theme-primary">Site Content (CMS)</h2>
          <p className="text-sm text-theme-secondary mt-1">Edit text content across all pages. Changes are reflected in real-time.</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="h-4 w-4" /> Add Content
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-tertiary" />
        <input
          type="text"
          placeholder="Search by page, section or text…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input pl-10"
        />
      </div>

      {pageNames.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActivePage(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activePage === null ? 'bg-primary text-white' : 'bg-theme-surface-hover text-theme-secondary hover:bg-theme-surface-hover/80'
            }`}
          >
            All Pages ({(allContent || []).length})
          </button>
          {pageNames.map((page) => (
            <button
              key={page}
              onClick={() => setActivePage(activePage === page ? null : page)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
                activePage === page ? 'bg-primary text-white' : 'bg-theme-surface-hover text-theme-secondary hover:bg-theme-surface-hover/80'
              }`}
            >
              {page} ({pageCounts[page]})
            </button>
          ))}
        </div>
      )}

      {showNew && (
        <div className="card p-4 space-y-3 border-primary/30">
          <h3 className="text-sm font-semibold text-theme-primary">New Content Entry</h3>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Page (e.g. landing)" value={newPage} onChange={(e) => setNewPage(e.target.value)} className="input text-sm" />
            <input placeholder="Section tag (e.g. hero_title)" value={newSection} onChange={(e) => setNewSection(e.target.value)} className="input text-sm" />
          </div>
          <textarea placeholder="Content value" value={newValue} onChange={(e) => setNewValue(e.target.value)} className="input text-sm min-h-[60px]" />
          <input placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="input text-sm" />
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (newPage && newSection && newValue) {
                  createMut.mutate({ page: newPage, section_tag: newSection, value: newValue, description: newDesc || undefined })
                  setShowNew(false); setNewPage(''); setNewSection(''); setNewValue(''); setNewDesc('')
                }
              }}
              disabled={!newPage || !newSection || !newValue || createMut.isPending}
              className="btn-primary text-sm"
            >
              {createMut.isPending ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setShowNew(false)} className="btn-ghost text-sm">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-theme-tertiary py-8">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading content…
        </div>
      ) : !items.length ? (
        <div className="text-center py-12 text-theme-tertiary">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No site content found. Click "Add Content" to create entries.</p>
        </div>
      ) : (
        Object.entries(grouped).sort().map(([page, pageItems]) => (
          <div key={page} className="space-y-2">
            <h3 className="font-semibold text-sm text-primary uppercase tracking-wide flex items-center gap-2">
              <FileText className="h-4 w-4" /> {page}
              <span className="text-theme-tertiary font-normal">({pageItems.length} entries)</span>
            </h3>
            <div className="divide-y bg-[var(--bg-surface)] rounded-lg border shadow-sm">
              {pageItems.map((item) => (
                <div key={item.id} className="px-4 py-3 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-theme-surface-hover px-1.5 py-0.5 rounded text-theme-secondary">{item.section_tag}</code>
                      {item.description && <span className="text-xs text-theme-tertiary">— {item.description}</span>}
                    </div>
                    {editingId === item.id ? (
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="input text-sm mt-2 min-h-[50px] w-full"
                        autoFocus
                      />
                    ) : (
                      <p className="text-sm text-theme-primary mt-1 line-clamp-2">{item.value}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 mt-1">
                    {editingId === item.id ? (
                      <>
                        <button
                          onClick={() => { updateMut.mutate({ id: item.id, value: editValue }); setEditingId(null) }}
                          className="p-1.5 rounded hover:bg-green-50"
                          disabled={updateMut.isPending}
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 rounded hover:bg-[var(--bg-surface-hover)]">
                          <X className="h-4 w-4 text-theme-tertiary" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditingId(item.id); setEditValue(item.value || '') }}
                          className="p-1.5 rounded hover:bg-[var(--bg-surface-hover)]"
                        >
                          <Edit3 className="h-4 w-4 text-theme-tertiary" />
                        </button>
                        <button
                          onClick={() => { if (confirm('Delete this content entry?')) deleteMut.mutate(item.id) }}
                          className="p-1.5 rounded hover:bg-red-50 dark:bg-red-900/30"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
