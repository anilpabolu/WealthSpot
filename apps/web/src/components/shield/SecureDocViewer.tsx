import { useEffect } from 'react'
import { X } from 'lucide-react'

interface SecureDocViewerProps {
  url: string
  filename: string
  contentType: string
  open: boolean
  onClose: () => void
}

/**
 * Secure in-app document viewer.
 *
 * Blocks print / save / copy keyboard shortcuts and right-click to
 * discourage casual exfiltration of sensitive evidence documents.
 * PDFs are embedded in a sandboxed iframe; images are rendered
 * non-draggable with pointer events disabled.
 */
export function SecureDocViewer({
  url,
  filename,
  contentType,
  open,
  onClose,
}: SecureDocViewerProps) {
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'c'].includes(e.key.toLowerCase())) {
        e.preventDefault()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  if (!open) return null

  const isPdf =
    contentType?.includes('pdf') || url.toLowerCase().includes('.pdf')
  const isImage =
    contentType?.startsWith('image/') ||
    /\.(png|jpe?g|gif|webp|svg)$/i.test(url)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 secure-doc-viewer"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-theme-card rounded-xl overflow-hidden flex flex-col"
        style={{ userSelect: 'none' }}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-theme bg-theme-surface shrink-0">
          <span className="text-sm font-medium text-theme-primary truncate max-w-[80%]">
            {filename}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-theme-surface text-theme-secondary"
          >
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 overflow-hidden min-h-0">
          {isPdf ? (
            <iframe
              src={`${url}#toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full border-0"
              style={{ height: '70vh' }}
              sandbox="allow-same-origin allow-scripts"
              title={filename}
            />
          ) : isImage ? (
            <div className="flex items-center justify-center p-4 h-full">
              <img
                src={url}
                alt={filename}
                className="max-w-full max-h-full object-contain"
                draggable={false}
                style={{ pointerEvents: 'none' }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 p-8">
              <p className="text-theme-secondary text-sm">
                Preview not available for this file type.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`@media print { .secure-doc-viewer { display: none !important; } }`}</style>
    </div>
  )
}
