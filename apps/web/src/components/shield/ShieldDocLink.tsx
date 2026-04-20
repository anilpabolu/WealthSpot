import { Download, Lock } from 'lucide-react'
import { useDownloadAssessmentDocument } from '@/hooks/useShield'
import type { AssessmentDocumentRead } from '@/lib/assessments'

interface ShieldDocLinkProps {
  opportunityId: string
  doc: AssessmentDocumentRead
}

/**
 * Download link for a single evidence document.
 *
 * If the doc is locked (sensitive + viewer has no approved EOI),
 * we show a lock icon + an "Express interest to unlock" hint instead
 * of a working link.
 */
export function ShieldDocLink({ opportunityId, doc }: ShieldDocLinkProps) {
  const download = useDownloadAssessmentDocument()

  if (doc.locked) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-theme bg-theme-surface text-[12px] text-theme-tertiary">
        <Lock size={14} className="text-amber-500" />
        <span className="flex-1 truncate">{doc.filename ?? 'Document'}</span>
        <span className="text-[10px] uppercase tracking-wider text-amber-500">
          EOI required
        </span>
      </div>
    )
  }

  const href = doc.url
  async function handleClick(e: React.MouseEvent) {
    if (href) return // let the browser follow the direct link
    e.preventDefault()
    try {
      const res = await download.mutateAsync({
        opportunityId,
        mediaId: doc.id,
      })
      if (res.url) window.open(res.url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      console.error('[shield] download failed', err)
    }
  }

  return (
    <a
      href={href ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-theme bg-theme-surface hover:border-primary text-[12px] text-theme-primary transition"
    >
      <Download size={14} className="text-primary" />
      <span className="flex-1 truncate">{doc.filename ?? 'Document'}</span>
      {doc.sizeBytes ? (
        <span className="text-[10px] text-theme-tertiary">
          {(doc.sizeBytes / 1024).toFixed(0)} KB
        </span>
      ) : null}
    </a>
  )
}
