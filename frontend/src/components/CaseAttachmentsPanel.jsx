import { useCallback, useRef, useState } from 'react'
import {
  Paperclip,
  Trash2,
  FileText,
  FileSpreadsheet,
  FileType,
  Loader2,
  Upload,
  Eye,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { scenarioAPI } from '../services/api'
import ExportFormatButton from './ExportFormatButton'
import AttachmentPreviewModal from './AttachmentPreviewModal'
import { filesFromClipboardOrDrop } from '../utils/clipboardFiles'

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
 * Testiny-style Attachments tab for a test case.
 */
export default function CaseAttachmentsPanel({
  scenarioId,
  attachments = [],
  onRefresh,
}) {
  const inputRef = useRef(null)
  const zoneRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(null)
  const [pasteActive, setPasteActive] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleUpload = useCallback(
    async (fileList) => {
      const files = [...(fileList || [])]
      if (!files.length || !scenarioId) return
      setUploading(true)
      setError(null)
      try {
        await scenarioAPI.uploadAttachments(scenarioId, files, { kind: 'GENERAL' })
        await onRefresh?.()
        toast.success(
          files.length > 1 ? `${files.length} file diunggah` : 'Screenshot / file diunggah'
        )
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Upload gagal'
        setError(msg)
        toast.error(msg)
      } finally {
        setUploading(false)
        if (inputRef.current) inputRef.current.value = ''
      }
    },
    [scenarioId, onRefresh]
  )

  const handlePasteOrDrop = useCallback(
    (e) => {
      const files = filesFromClipboardOrDrop(e)
      if (!files.length) return
      e.preventDefault()
      e.stopPropagation()
      handleUpload(files)
    },
    [handleUpload]
  )

  const handleDelete = async (attachmentId) => {
    if (!scenarioId || !attachmentId) return
    setDeletingId(attachmentId)
    setError(null)
    try {
      await scenarioAPI.deleteAttachment(scenarioId, attachmentId)
      await onRefresh?.()
      toast.success('Attachment dihapus')
      if (preview?.id === attachmentId) setPreview(null)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Gagal hapus'
      setError(msg)
      toast.error(msg)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start sm:justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Attachments</h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Gambar, PDF, Excel, atau Word (maks. 16 · 8MB). Screenshot: klik area paste lalu Ctrl+V.
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <ExportFormatButton
            format="primary"
            icon={uploading ? Loader2 : Upload}
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={`w-full sm:w-auto justify-center ${uploading ? '[&_svg]:animate-spin' : ''}`}
          >
            {uploading ? 'Uploading…' : 'Upload file'}
          </ExportFormatButton>
        </div>
      </div>

      <div
        ref={zoneRef}
        tabIndex={0}
        role="button"
        aria-label="Paste screenshot di sini"
        onClick={() => zoneRef.current?.focus()}
        onFocus={() => setPasteActive(true)}
        onBlur={() => setPasteActive(false)}
        onPaste={handlePasteOrDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          setDragOver(false)
          handlePasteOrDrop(e)
        }}
        className={`mb-4 rounded-xl border border-dashed px-4 py-6 text-center text-sm outline-none transition-colors cursor-text ${
          dragOver || pasteActive
            ? 'border-brand bg-brand-soft/40 text-brand-ink'
            : 'border-surface-border bg-surface-muted/40 text-ink-muted'
        }`}
      >
        {uploading
          ? 'Mengunggah…'
          : 'Klik di sini → Ctrl+V untuk paste screenshot, atau drag gambar ke sini'}
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
          <p className="text-xs text-ink-subtle mt-1">
            Upload gambar, PDF, Excel (.xls/.xlsx), atau Word (.doc/.docx).
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {attachments.map((a) => {
            const Icon = fileIcon(a.mimeType, a.originalName)
            return (
              <li
                key={a.id}
                className="flex gap-3 rounded-xl border border-surface-border bg-white p-3"
              >
                {isImageMime(a.mimeType) ? (
                  <button
                    type="button"
                    onClick={() => setPreview(a)}
                    className="shrink-0 relative group"
                    title="Preview"
                  >
                    <img
                      src={a.url}
                      alt={a.originalName}
                      className="w-16 h-16 object-cover rounded-lg border border-surface-border"
                    />
                    <span className="absolute inset-0 rounded-lg bg-slate-900/0 group-hover:bg-slate-900/35 flex items-center justify-center transition-colors">
                      <Eye size={16} className="text-white opacity-0 group-hover:opacity-100" />
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPreview(a)}
                    className="w-16 h-16 rounded-lg bg-surface-muted flex items-center justify-center shrink-0 hover:ring-2 hover:ring-brand/40"
                    title="Preview / buka"
                  >
                    <Icon size={22} className="text-brand" />
                  </button>
                )}
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setPreview(a)}
                    className="text-sm font-medium text-ink hover:text-brand truncate block text-left w-full"
                    title={a.originalName}
                  >
                    {a.originalName}
                  </button>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {formatBytes(a.size)} · {new Date(a.createdAt).toLocaleString()}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPreview(a)}
                      className="inline-flex items-center gap-1 text-xs text-brand hover:text-brand-hover"
                    >
                      <Eye size={12} />
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(a.id)}
                      disabled={deletingId === a.id}
                      className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      {deletingId === a.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      Hapus
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <AttachmentPreviewModal attachment={preview} onClose={() => setPreview(null)} />
    </div>
  )
}
