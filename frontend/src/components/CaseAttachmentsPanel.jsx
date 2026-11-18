import { useRef, useState } from 'react'
import { Paperclip, Trash2, FileText, Loader2, Upload } from 'lucide-react'
import { scenarioAPI } from '../services/api'
import ExportFormatButton from './ExportFormatButton'

function isImageMime(mime) {
  return String(mime || '').startsWith('image/')
}

function formatBytes(n) {
  if (!n && n !== 0) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Testiny-style Attachments tab for a test case.
 */
export default function CaseAttachmentsPanel({
  scenarioId,
  attachments = [],
  onRefresh,
}) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState(null)

  const handleUpload = async (fileList) => {
    const files = [...(fileList || [])]
    if (!files.length || !scenarioId) return
    setUploading(true)
    setError(null)
    try {
      await scenarioAPI.uploadAttachments(scenarioId, files)
      await onRefresh?.()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Upload gagal')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleDelete = async (attachmentId) => {
    if (!scenarioId || !attachmentId) return
    setDeletingId(attachmentId)
    setError(null)
    try {
      await scenarioAPI.deleteAttachment(scenarioId, attachmentId)
      await onRefresh?.()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Gagal hapus')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Attachments</h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Screenshot, PDF, atau evidence untuk test case ini (maks. 12 · 8MB).
          </p>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <ExportFormatButton
            format="primary"
            icon={uploading ? Loader2 : Upload}
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={uploading ? '[&_svg]:animate-spin' : ''}
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </ExportFormatButton>
        </div>
      </div>

      {error && (
        <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {attachments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-border bg-surface-muted/50 px-4 py-10 text-center">
          <Paperclip size={22} className="mx-auto text-ink-subtle mb-2" />
          <p className="text-sm text-ink-muted">Belum ada attachment</p>
          <p className="text-xs text-ink-subtle mt-1">Drag file ke sini tidak wajib — pakai Upload.</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex gap-3 rounded-xl border border-surface-border bg-white p-3"
            >
              {isImageMime(a.mimeType) ? (
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <img
                    src={a.url}
                    alt={a.originalName}
                    className="w-16 h-16 object-cover rounded-lg border border-surface-border"
                  />
                </a>
              ) : (
                <div className="w-16 h-16 rounded-lg bg-surface-muted flex items-center justify-center shrink-0">
                  <FileText size={22} className="text-brand" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-ink hover:text-brand truncate block"
                  title={a.originalName}
                >
                  {a.originalName}
                </a>
                <p className="text-xs text-ink-muted mt-0.5">
                  {formatBytes(a.size)} · {new Date(a.createdAt).toLocaleString()}
                </p>
                <button
                  type="button"
                  onClick={() => handleDelete(a.id)}
                  disabled={deletingId === a.id}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  {deletingId === a.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  Hapus
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
