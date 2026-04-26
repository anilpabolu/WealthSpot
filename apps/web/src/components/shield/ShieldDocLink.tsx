import { useState } from 'react'
import { Download } from 'lucide-react'
import { useDownloadAssessmentDocument } from '@/hooks/useShield'
import type { AssessmentDocumentRead } from '@/lib/assessments'
import { SecureDocViewer } from './SecureDocViewer'

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
  const [open, setOpen] = useState(false)
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(doc.url ?? null)

  if (doc.locked) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-theme bg-theme-surface/50 text-[12px] text-theme-tertiary w-full">
        <span className="flex-1 truncate">{doc.filename ?? 'Document'}</span>
        <span className="text-[10px] font-medium text-amber-600 border border-amber-500/40 bg-amber-500/10 rounded px-1.5 py-0.5">
          EOI required
        </span>
      </div>
    )
  }

  async function handleOpen(e: React.MouseEvent) {
    e.preventDefault()
    if (resolvedUrl) {
      setOpen(true)
      return
    }
    try {
      const res = await download.mutateAsync({ opportunityId, mediaId: doc.id })
      if (res.url) {
        setResolvedUrl(res.url)
        setOpen(true)
      }
    } catch (err) {
      console.error('[shield] download failed', err)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={download.isPending}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-theme bg-theme-surface hover:border-primary text-[12px] text-theme-primary transition w-full text-left"
      >
        <Download size={14} className="text-primary shrink-0" />
        <span className="flex-1 truncate">{doc.filename ?? 'Document'}</span>
        {doc.sizeBytes ? (
          <span className="text-[10px] text-theme-tertiary">
            {(doc.sizeBytes / 1024).toFixed(0)} KB
          </span>
        ) : null}
      </button>
      {resolvedUrl && (
        <SecureDocViewer
          url={resolvedUrl}
          filename={doc.filename ?? 'Document'}
          contentType={doc.contentType ?? ''}
          open={open}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
