/**
 * BuilderUpdatesPanel — read-only timeline of builder updates shown on
 * opportunity detail page sidebar.  Clicking an item opens a detail popup
 * with file-download links.
 */

import { useState } from 'react'
import { FileText, Download, ChevronRight, X, Calendar, Newspaper } from 'lucide-react'
import { useBuilderUpdates, type BuilderUpdate } from '@/hooks/useBuilderUpdates'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function UpdateDetailModal({ update, onClose }: { update: BuilderUpdate; onClose: () => void }) {
  return (
    <div className="modal-overlay p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" onClick={onClose} />
      <div className="modal-panel max-w-lg relative">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--bg-surface)] border-b border-theme px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
          <h2 className="font-display text-lg font-bold text-theme-primary truncate">{update.title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors" aria-label="Close">
            <X className="h-5 w-5 text-theme-tertiary" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Meta */}
          <div className="flex items-center gap-2 text-xs text-theme-secondary">
            <Calendar className="h-3.5 w-3.5" />
            <span>{new Date(update.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            {update.creator && (
              <>
                <span className="mx-1">·</span>
                <span>{update.creator.fullName}</span>
              </>
            )}
          </div>

          {/* Description */}
          {update.description && (
            <p className="text-sm text-theme-secondary whitespace-pre-line leading-relaxed">{update.description}</p>
          )}

          {/* Attachments */}
          {update.attachments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-theme-tertiary uppercase tracking-wide">Attachments</p>
              {update.attachments.map(att => (
                <a
                  key={att.id}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={att.filename ?? undefined}
                  className="flex items-center gap-3 p-3 rounded-lg bg-theme-surface hover:bg-theme-surface-hover transition-colors group"
                >
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-theme-primary truncate">{att.filename ?? 'File'}</p>
                    {att.sizeBytes != null && (
                      <p className="text-[11px] text-theme-tertiary">{(att.sizeBytes / 1024).toFixed(0)} KB</p>
                    )}
                  </div>
                  <Download className="h-4 w-4 text-theme-tertiary group-hover:text-primary transition-colors shrink-0" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BuilderUpdatesPanel({ opportunityId }: { opportunityId: string }) {
  const { data: updates, isLoading } = useBuilderUpdates(opportunityId)
  const [selected, setSelected] = useState<BuilderUpdate | null>(null)

  if (isLoading) {
    return (
      <div className="card p-5 space-y-3 animate-pulse">
        <div className="h-5 w-1/2 bg-theme-surface-hover rounded" />
        <div className="h-10 bg-theme-surface-hover rounded" />
        <div className="h-10 bg-theme-surface-hover rounded" />
      </div>
    )
  }

  if (!updates?.length) {
    return (
      <div className="card p-5 text-center">
        <Newspaper className="h-8 w-8 text-theme-tertiary mx-auto mb-2" />
        <p className="text-sm text-theme-secondary">No builder updates yet.</p>
      </div>
    )
  }

  return (
    <>
      <div className="card p-5 space-y-3">
        <h3 className="font-display text-base font-bold text-theme-primary flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-primary" /> Builder Updates
        </h3>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {updates.map(u => (
            <button
              key={u.id}
              type="button"
              onClick={() => setSelected(u)}
              className="w-full text-left flex items-start gap-3 p-3 rounded-lg bg-theme-surface hover:bg-theme-surface-hover transition-colors group"
            >
              <div className="mt-0.5 h-2 w-2 rounded-full bg-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-theme-primary group-hover:text-primary transition-colors truncate">{u.title}</p>
                <p className="text-[11px] text-theme-tertiary mt-0.5">{timeAgo(u.createdAt)}</p>
              </div>
              {u.attachments.length > 0 && (
                <FileText className="h-4 w-4 text-theme-tertiary shrink-0 mt-0.5" />
              )}
              <ChevronRight className="h-4 w-4 text-theme-tertiary shrink-0 mt-0.5" />
            </button>
          ))}
        </div>
      </div>

      {selected && <UpdateDetailModal update={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
