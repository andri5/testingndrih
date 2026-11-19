import { useEffect } from 'react'
import { X, Download, ExternalLink, FileText, FileSpreadsheet, FileType } from 'lucide-react'

function isImageMime(mime) {
  return String(mime || '').startsWith('image/')
}

function fileKind(mime, name = '') {
  const m = String(mime || '').toLowerCase()
  const n = String(name || '').toLowerCase()
  if (m.includes('pdf') || n.endsWith('.pdf')) return 'pdf'
  if (
    m.includes('sheet') ||
    m.includes('excel') ||
    m.includes('csv') ||
    /\.(xlsx?|csv|ods)$/.test(n)
  ) {
    return 'excel'
  }
  if (m.includes('word') || m.includes('msword') || /\.(docx?|odt)$/.test(n)) return 'word'
  if (isImageMime(m)) return 'image'
  return 'file'
}

/**
 * Medium-sized preview popup for case attachments (images inline; docs via open/download).
 * Responsive: full-width on small screens, compact header actions.
 */
export default function AttachmentPreviewModal({ attachment, onClose }) {
  useEffect(() => {
    if (!attachment) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [attachment, onClose])

  if (!attachment) return null

  const kind = fileKind(attachment.mimeType, attachment.originalName)
  const title = attachment.originalName || 'Attachment'

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-xl max-h-[92vh] sm:max-h-[85vh] overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white border border-surface-border shadow-2xl pb-[env(safe-area-inset-bottom)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start sm:items-center justify-between gap-2 px-3 sm:px-4 py-3 border-b border-surface-border bg-surface-muted/40">
          <div className="min-w-0 flex-1 pr-1">
            <p className="text-sm font-semibold text-ink truncate" title={title}>
              {title}
            </p>
            <p className="text-[11px] text-ink-muted truncate">
              {attachment.mimeType || kind}
              {attachment.size ? ` · ${(attachment.size / 1024).toFixed(1)} KB` : ''}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <a
              href={attachment.url}
              download={attachment.originalName}
              className="inline-flex items-center justify-center gap-1 min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium text-ink-muted hover:bg-white border border-transparent hover:border-surface-border"
              title="Download"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Download</span>
            </a>
            <a
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium text-ink-muted hover:bg-white border border-transparent hover:border-surface-border"
              title="Open"
            >
              <ExternalLink size={14} />
              <span className="hidden sm:inline">Open</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center min-w-[36px] min-h-[36px] p-1.5 rounded-lg text-ink-muted hover:bg-white hover:text-ink border border-transparent hover:border-surface-border"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-[#f7fafa] flex items-center justify-center min-h-[180px] sm:min-h-[220px] max-h-[calc(92vh-4.5rem)] sm:max-h-[calc(85vh-4.5rem)] overflow-auto">
          {kind === 'image' ? (
            <img
              src={attachment.url}
              alt={title}
              className="max-w-full max-h-[55vh] sm:max-h-[60vh] object-contain rounded-lg shadow-sm border border-surface-border bg-white"
            />
          ) : (
            <div className="text-center px-4 sm:px-6 py-6 sm:py-8 w-full">
              <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-surface-border flex items-center justify-center mb-3">
                {kind === 'excel' ? (
                  <FileSpreadsheet size={28} className="text-emerald-600" />
                ) : kind === 'word' ? (
                  <FileType size={28} className="text-sky-600" />
                ) : (
                  <FileText size={28} className="text-brand" />
                )}
              </div>
              <p className="text-sm font-medium text-ink mb-1 break-words">{title}</p>
              <p className="text-xs text-ink-muted mb-4">
                Preview inline tidak tersedia untuk file ini. Buka atau unduh untuk melihat isinya.
              </p>
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-medium bg-brand text-white hover:bg-brand-hover"
              >
                <ExternalLink size={15} />
                Buka file
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
