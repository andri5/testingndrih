import { useRef, useState } from 'react'
import {
  Paperclip,
  Trash2,
  Upload,
  Eye,
  Loader2,
  FileText,
  FileSpreadsheet,
  FileType,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { scenarioAPI } from '../services/api'
import AttachmentPreviewModal from './AttachmentPreviewModal'

const ACCEPT =
  'image/png,image/jpeg,image/webp,image/gif,application/pdf,' +
  'application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,' +
  'application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,' +
  'text/csv,.doc,.docx,.xls,.xlsx,.pdf,.odt,.ods'

function isImageMime(mime) {
  return String(mime || '').startsWith('image/')
}

function fileIcon(mime, name = '') {
  const m = String(mime || '').toLowerCase()
  const n = String(name || '').toLowerCase()
  if (m.includes('sheet') || m.includes('excel') || m.includes('csv') || /\.(xlsx?|csv|ods)$/.test(n)) {
    return FileSpreadsheet
  }
  if (m.includes('word') || m.includes('msword') || /\.(docx?|odt)$/.test(n)) {
    return FileType
  }
  return FileText
}

function formatBytes(n) {
  if (!n && n !== 0) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Compact attachment list + upload for a single test step.
 */
export default function StepAttachmentsBlock({
  scenarioId,
  stepId,
  attachments = [],
  onChanged,
  compact = false,
}) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [preview, setPreview] = useState(null)

  const handleUpload = async (fileList) => {
    const files = [...(fileList || [])]
    if (!files.length || !scenarioId || !stepId) return
    setUploading(true)
    try {
      await scenarioAPI.uploadStepAttachments(scenarioId, stepId, files)
      toast.success(files.length > 1 ? `${files.length} file diunggah` : 'File diunggah')
      await onChanged?.()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Upload gagal')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleDelete = async (attachmentId) => {
    if (!scenarioId || !stepId || !attachmentId) return
    setDeletingId(attachmentId)
    try {
      await scenarioAPI.deleteStepAttachment(scenarioId, stepId, attachmentId)
      toast.success('Attachment dihapus')
      if (preview?.id === attachmentId) setPreview(null)
      await onChanged?.()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Gagal hapus')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className={compact ? 'mt-2' : 'mt-2 space-y-2'}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-subtle flex items-center gap-1">
          <Paperclip size={11} />
          Attachment ({attachments.length})
        </p>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading || !stepId}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:text-brand-hover disabled:opacity-40"
          >
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            Upload
          </button>
        </div>
      </div>

      {attachments.length === 0 ? (
        <p className="text-[11px] text-ink-subtle">Belum ada file di step ini.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {attachments.map((a) => {
            const Icon = fileIcon(a.mimeType, a.originalName)
            return (
              <li
                key={a.id}
                className="flex items-center gap-2 rounded-lg border border-surface-border bg-white px-2 py-1.5 max-w-full"
              >
                {isImageMime(a.mimeType) ? (
                  <button type="button" onClick={() => setPreview(a)} className="shrink-0">
                    <img
                      src={a.url}
                      alt={a.originalName}
                      className="w-8 h-8 object-cover rounded border border-surface-border"
                    />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPreview(a)}
                    className="w-8 h-8 rounded bg-surface-muted flex items-center justify-center shrink-0"
                  >
                    <Icon size={14} className="text-brand" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPreview(a)}
                  className="min-w-0 text-left"
                  title={a.originalName}
                >
                  <span className="block text-[11px] font-medium text-ink truncate max-w-[9rem]">
                    {a.originalName}
                  </span>
                  <span className="block text-[10px] text-ink-subtle">{formatBytes(a.size)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreview(a)}
                  className="p-1 text-ink-subtle hover:text-brand"
                  title="Preview"
                >
                  <Eye size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(a.id)}
                  disabled={deletingId === a.id}
                  className="p-1 text-ink-subtle hover:text-red-600 disabled:opacity-40"
                  title="Hapus"
                >
                  {deletingId === a.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <AttachmentPreviewModal attachment={preview} onClose={() => setPreview(null)} />
    </div>
  )
}
