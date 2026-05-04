/**
 * ProjectUpdatesPopup — read-only timeline of builder updates for a holding,
 * shown when investor clicks "Updates" on a holding row.
 */

import { useState } from 'react'
import { X, FileText, Download, Loader2, Newspaper, Calendar, Clock } from 'lucide-react'
import { useBuilderUpdates, useMarkBuilderUpdateRead, type BuilderUpdate } from '@/hooks/useBuilderUpdates'
import type { HoldingItem } from '@/hooks/usePortfolio'

/* ── helpers ─────────────────────────────────────────────────────── */

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/* ── UpdateDetailModal ───────────────────────────────────────────── */

function UpdateDetailModal({ update, onClose }: { update: BuilderUpdate; onClose: () => void }) {
  return (
    <div className="modal-overlay p-4 z-[70]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex flex-col bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh]">
        <div className="sticky top-0 bg-[var(--bg-surface)] border-b border-theme px-6 py-4 rounded-t-2xl flex items-center justify-between z-10 shrink-0">
          <h3 className="font-display text-base font-bold text-theme-primary truncate">{update.title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors" aria-label="Close">
            <X className="h-5 w-5 text-theme-tertiary" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs text-theme-secondary">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{new Date(update.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            {update.creator && (
              <>
                <span className="mx-1">·</span>
                <span>{update.creator.fullName}</span>
              </>
            )}
          </div>
          {update.description && (
            <p className="text-sm text-theme-secondary whitespace-pre-line leading-relaxed">{update.description}</p>
          )}
          {update.attachments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-theme-tertiary uppercase tracking-wide">Attachments</p>
              {update.attachments.map((att) => (
                <a
                  key={att.id}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={att.filename ?? undefined}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-surface-hover)] hover:bg-theme-surface transition-colors group"
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

/* ── Main popup ─────────────────────────────────────────────────── */

export function ProjectUpdatesPopup({
  holding,
  onClose,
}: {
  holding: HoldingItem
  onClose: () => void
}) {
  const [selectedUpdate, setSelectedUpdate] = useState<BuilderUpdate | null>(null)
  const { data: updates, isLoading } = useBuilderUpdates(holding.opportunityId ?? undefined)
  const markRead = useMarkBuilderUpdateRead(holding.opportunityId ?? '')

  const unreadCount = updates ? updates.filter((u) => !u.isRead).length : 0

  function handleReadMore(u: BuilderUpdate) {
    setSelectedUpdate(u)
    if (!u.isRead) {
      markRead.mutate(u.id)
    }
  }

  return (
    <>
      <div className="modal-overlay p-4 z-[60]" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        <div className="relative flex flex-col bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-theme shrink-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-theme-primary text-lg">Project Updates</h2>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary text-white text-[10px] font-bold leading-none">
                    {unreadCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-theme-tertiary truncate">{holding.projectTitle}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors ml-3" aria-label="Close">
              <X className="h-5 w-5 text-theme-tertiary" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-theme-tertiary">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading updates…</span>
              </div>
            ) : !updates || updates.length === 0 ? (
              <div className="text-center py-10">
                <Newspaper className="h-10 w-10 text-theme-tertiary mx-auto mb-3 opacity-40" />
                <p className="text-sm text-theme-secondary">No updates posted yet.</p>
                <p className="text-xs text-theme-tertiary mt-1">Check back later for project news.</p>
              </div>
            ) : (
              <ol className="relative border-l border-theme ml-3 space-y-6">
                {updates.map((u) => (
                  <li key={u.id} className="ml-4">
                    {u.isRead ? (
                      <span className="absolute -left-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-primary/20 ring-2 ring-[var(--bg-surface)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </span>
                    ) : (
                      <span className="absolute -left-1.5 flex h-3 w-3 items-center justify-center rounded-full ring-2 ring-[var(--bg-surface)]">
                        <span className="h-3 w-3 rounded-full bg-primary animate-pulse" />
                      </span>
                    )}
                    <div className={`p-4 rounded-xl border transition-colors ${u.isRead ? 'border-theme bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)]' : 'border-primary/30 bg-primary/5 hover:bg-primary/10'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-theme-primary truncate">{u.title}</p>
                            {!u.isRead && (
                              <span className="shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-primary text-white leading-none">New</span>
                            )}
                          </div>
                          {u.description && (
                            <p className="text-xs text-theme-secondary mt-1 line-clamp-2">{u.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-theme-tertiary">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {timeAgo(u.createdAt)}
                            </span>
                            {u.creator && <span>{u.creator.fullName}</span>}
                            {u.attachments.length > 0 && (
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {u.attachments.length} file{u.attachments.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleReadMore(u)}
                          className="shrink-0 text-xs font-medium text-primary hover:underline whitespace-nowrap"
                        >
                          Read more
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>

      {selectedUpdate && (
        <UpdateDetailModal update={selectedUpdate} onClose={() => setSelectedUpdate(null)} />
      )}
    </>
  )
}
