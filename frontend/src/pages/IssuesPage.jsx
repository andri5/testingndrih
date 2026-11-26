import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { issueAPI, scenarioAPI } from '../services/api'
import toast from 'react-hot-toast'
import { Bug, Plus, RefreshCw, Link2, Paperclip, Trash2, FileText } from 'lucide-react'
import ShareBugModal from '../components/ShareBugModal'
import { filesFromClipboardOrDrop } from '../utils/clipboardFiles'
import { findSqlInjectionInForm, SQLI_REJECT_MESSAGE } from '../utils/sqlInjectionGuard'

const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'CLOSED']
const SEVERITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

function isImageMime(mime) {
  return String(mime || '').startsWith('image/')
}

function AttachmentThumbs({ attachments = [], onDelete, onPreview }) {
  if (!attachments.length) return null
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {attachments.map((a) => (
        <div
          key={a.id}
          className="relative group rounded-lg border border-surface-border overflow-hidden bg-surface-muted"
        >
          {isImageMime(a.mimeType) ? (
            <button type="button" onClick={() => onPreview?.(a.url)} title={a.originalName}>
              <img
                src={a.url}
                alt={a.originalName}
                className="w-16 h-16 object-cover"
              />
            </button>
          ) : (
            <a
              href={a.url}
              target="_blank"
              rel="noreferrer"
              className="w-16 h-16 flex flex-col items-center justify-center text-[10px] text-ink-muted px-1"
              title={a.originalName}
            >
              <FileText size={16} />
              <span className="truncate w-full text-center mt-0.5">PDF</span>
            </a>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(a.id)}
              className="absolute top-0.5 right-0.5 p-0.5 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100"
              title="Hapus"
            >
              <Trash2 size={10} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

export default function IssuesPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const extraFileRef = useRef(null)
  const createPasteZoneRef = useRef(null)
  const [issues, setIssues] = useState([])
  const [scenarios, setScenarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filterSource, setFilterSource] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('OPEN')
  const [form, setForm] = useState({
    title: '',
    description: '',
    severity: 'MEDIUM',
    scenarioId: '',
    stepNumber: '',
  })
  const [pendingFiles, setPendingFiles] = useState([])
  const [shareIssueId, setShareIssueId] = useState(null)
  const [uploadForIssueId, setUploadForIssueId] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [createPasteActive, setCreatePasteActive] = useState(false)
  const [createDragOver, setCreateDragOver] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const params = { limit: 100 }
      if (filterStatus !== 'ALL') params.status = filterStatus
      if (filterSource !== 'ALL') params.source = filterSource
      const res = await issueAPI.list(params)
      setIssues(res.data.issues || [])
    } catch {
      toast.error('Gagal memuat issues')
    } finally {
      setLoading(false)
    }
  }, [filterSource, filterStatus])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    scenarioAPI
      .getAll(0, 100)
      .then((res) => setScenarios(res.data?.scenarios || []))
      .catch(() => {})
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('Judul bug wajib diisi')
      return
    }
    if (findSqlInjectionInForm({ title: form.title, description: form.description })) {
      toast.error(SQLI_REJECT_MESSAGE)
      return
    }
    try {
      setSaving(true)
      const res = await issueAPI.create({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        severity: form.severity,
        scenarioId: form.scenarioId || undefined,
        stepNumber: form.stepNumber ? Number(form.stepNumber) : undefined,
      })
      const issueId = res.data?.issue?.id
      if (issueId && pendingFiles.length > 0) {
        await issueAPI.uploadAttachments(issueId, pendingFiles)
      }
      toast.success('Bug manual tersimpan')
      setForm({ title: '', description: '', severity: 'MEDIUM', scenarioId: '', stepNumber: '' })
      setPendingFiles([])
      if (fileInputRef.current) fileInputRef.current.value = ''
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan bug')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (issueId, status) => {
    try {
      await issueAPI.update(issueId, { status })
      toast.success('Status diperbarui')
      await load()
    } catch {
      toast.error('Gagal update status')
    }
  }

  const handleDeleteAttachment = async (issueId, attachmentId) => {
    try {
      await issueAPI.deleteAttachment(issueId, attachmentId)
      toast.success('Attachment dihapus')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal hapus attachment')
    }
  }

  const handleExtraUpload = async (e) => {
    const files = [...(e.target.files || [])]
    if (!uploadForIssueId || files.length === 0) return
    try {
      await issueAPI.uploadAttachments(uploadForIssueId, files)
      toast.success('Attachment ditambahkan')
      setUploadForIssueId(null)
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal upload')
    } finally {
      e.target.value = ''
    }
  }

  const handleCreatePasteOrDrop = (e) => {
    const files = filesFromClipboardOrDrop(e)
    if (!files.length) return
    e.preventDefault()
    e.stopPropagation()
    setPendingFiles((prev) => [...prev, ...files])
    toast.success(files.length > 1 ? `${files.length} gambar ditambahkan` : 'Screenshot ditambahkan')
  }

  const handleIssueListPaste = async (e) => {
    if (!uploadForIssueId) return
    const files = filesFromClipboardOrDrop(e)
    if (!files.length) return
    e.preventDefault()
    e.stopPropagation()
    try {
      await issueAPI.uploadAttachments(uploadForIssueId, files)
      toast.success(files.length > 1 ? `${files.length} gambar diunggah` : 'Screenshot diunggah')
      setUploadForIssueId(null)
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal upload')
    }
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
              <Bug size={22} className="text-brand" />
              Bug Management
            </h1>
            <p className="text-sm text-ink-muted mt-1">
              Catat bug manual (bisa lampirkan gambar/PDF), atau otomatis saat skenario gagal.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-surface-border bg-surface hover:bg-surface-muted text-ink"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <div className="grid lg:grid-cols-5 gap-4">
          <form
            onSubmit={handleCreate}
            className="lg:col-span-2 linear-card p-4 space-y-3"
          >
            <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
              <Plus size={16} className="text-brand" /> Catat bug manual
            </h2>
            <div>
              <label className="text-xs font-medium text-ink-muted">Judul *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-ink focus:ring-1 focus:ring-brand focus:border-brand outline-none"
                placeholder="Contoh: Tombol Bayar tidak responsif di mobile"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted">Deskripsi</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="mt-1 w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-ink focus:ring-1 focus:ring-brand focus:border-brand outline-none"
                placeholder="Langkah reproduce, expected vs actual…"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-ink-muted">Severity</label>
                <select
                  value={form.severity}
                  onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-surface-border bg-surface px-2 py-2 text-sm text-ink focus:ring-1 focus:ring-brand focus:border-brand outline-none"
                >
                  {SEVERITY_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Step #</label>
                <input
                  type="number"
                  min="1"
                  value={form.stepNumber}
                  onChange={(e) => setForm((f) => ({ ...f, stepNumber: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-ink focus:ring-1 focus:ring-brand focus:border-brand outline-none"
                  placeholder="Opsional"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted">Case (opsional)</label>
              <select
                value={form.scenarioId}
                onChange={(e) => setForm((f) => ({ ...f, scenarioId: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-surface-border bg-surface px-2 py-2 text-sm text-ink focus:ring-1 focus:ring-brand focus:border-brand outline-none"
              >
                <option value="">— Tidak dilink —</option>
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted flex items-center gap-1">
                <Paperclip size={12} /> Attachment (PNG/JPG/WEBP/GIF/PDF, max 8MB)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
                multiple
                onChange={(e) => setPendingFiles((prev) => [...prev, ...(e.target.files || [])])}
                className="mt-1 block w-full text-xs text-ink-muted"
              />
              <div
                ref={createPasteZoneRef}
                tabIndex={0}
                role="button"
                aria-label="Paste screenshot bug"
                onClick={() => createPasteZoneRef.current?.focus()}
                onFocus={() => setCreatePasteActive(true)}
                onBlur={() => setCreatePasteActive(false)}
                onPaste={handleCreatePasteOrDrop}
                onDragOver={(e) => {
                  e.preventDefault()
                  setCreateDragOver(true)
                }}
                onDragLeave={() => setCreateDragOver(false)}
                onDrop={(e) => {
                  setCreateDragOver(false)
                  handleCreatePasteOrDrop(e)
                }}
                className={`mt-2 rounded-lg border border-dashed px-3 py-3 text-center text-[11px] outline-none transition-colors cursor-text ${
                  createDragOver || createPasteActive
                    ? 'border-brand bg-brand-soft text-brand-ink'
                    : 'border-surface-border bg-surface-muted text-ink-subtle'
                }`}
              >
                Klik di sini → Ctrl+V paste screenshot, atau drag gambar
              </div>
              {pendingFiles.length > 0 && (
                <p className="text-[11px] text-ink-subtle mt-1">
                  {pendingFiles.length} file dipilih: {pendingFiles.map((f) => f.name).join(', ')}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-semibold py-2.5 disabled:opacity-50 shadow-sm shadow-brand/20"
            >
              {saving ? 'Menyimpan…' : 'Simpan bug'}
            </button>
            <p className="text-[11px] text-ink-subtle leading-relaxed">
              Otomatis: Run FAILED → issue AUTO. Manual: form ini + lampiran (ikut di Share bug).
            </p>
          </form>

          <div className="lg:col-span-3 linear-card p-4">
            <div className="flex flex-wrap gap-2 mb-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-lg border border-surface-border bg-surface px-2 py-1.5 text-xs text-ink"
              >
                <option value="ALL">Semua status</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="rounded-lg border border-surface-border bg-surface px-2 py-1.5 text-xs text-ink"
              >
                <option value="ALL">Semua sumber</option>
                <option value="MANUAL">Manual</option>
                <option value="AUTO">Otomatis (dari Run)</option>
              </select>
            </div>

            {loading ? (
              <p className="text-sm text-ink-muted py-8 text-center">Memuat…</p>
            ) : issues.length === 0 ? (
              <p className="text-sm text-ink-muted py-8 text-center">Belum ada issue.</p>
            ) : (
              <div
                className="space-y-2 max-h-[70vh] overflow-y-auto"
                onPaste={handleIssueListPaste}
              >
                {issues.map((issue) => {
                  const scenarioName =
                    issue.scenario?.name || issue.execution?.scenario?.name || null
                  const scenarioId =
                    issue.scenario?.id || issue.execution?.scenario?.id || null
                  return (
                    <div
                      key={issue.id}
                      className="rounded-lg border border-surface-border bg-surface p-3 hover:border-brand/40 hover:bg-brand-soft/30 transition-colors"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="font-semibold text-sm text-ink">{issue.title}</p>
                            <span
                              className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                issue.source === 'MANUAL'
                                  ? 'bg-brand-soft text-brand-ink'
                                  : 'bg-accent-soft text-accent-ink'
                              }`}
                            >
                              {issue.source === 'MANUAL' ? 'Manual' : 'Auto'}
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-surface-muted text-ink-muted border border-surface-border">
                              {issue.severity}
                            </span>
                          </div>
                          {issue.description && (
                            <p className="text-xs text-ink-muted line-clamp-2">{issue.description}</p>
                          )}
                          <p className="text-xs text-ink-subtle mt-1">
                            {scenarioName || 'Tanpa skenario'}
                            {issue.stepNumber != null ? ` · Step ${issue.stepNumber}` : ''}
                            {' · '}
                            {new Date(issue.createdAt).toLocaleString()}
                          </p>
                          {scenarioId && (
                            <button
                              type="button"
                              onClick={() => navigate(`/scenarios/${scenarioId}`)}
                              className="text-xs text-brand hover:text-brand-hover hover:underline mt-1 font-medium"
                            >
                              Buka skenario →
                            </button>
                          )}
                          <AttachmentThumbs
                            attachments={issue.attachments || []}
                            onPreview={setPreviewUrl}
                            onDelete={(attachmentId) => handleDeleteAttachment(issue.id, attachmentId)}
                          />
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setUploadForIssueId(issue.id)
                              extraFileRef.current?.click()
                            }}
                            onFocus={() => setUploadForIssueId(issue.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded border border-surface-border bg-surface text-ink-muted hover:bg-surface-muted hover:text-ink"
                            title="Tambah attachment (klik lalu Ctrl+V untuk paste)"
                          >
                            <Paperclip size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setShareIssueId(issue.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded border border-brand/25 bg-brand-soft text-brand-ink hover:bg-brand/15"
                            title="Share ke developer"
                          >
                            <Link2 size={12} /> Share
                          </button>
                          <select
                            value={issue.status}
                            onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                            className="text-xs px-2 py-1 rounded border border-surface-border bg-surface text-ink"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{s.replace('_', ' ')}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <input
        ref={extraFileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
        multiple
        className="hidden"
        onChange={handleExtraUpload}
      />

      <ShareBugModal
        issueId={shareIssueId}
        open={!!shareIssueId}
        onClose={() => setShareIssueId(null)}
      />

      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <img
            src={previewUrl}
            alt="Attachment"
            className="max-w-full max-h-[92vh] rounded shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </Layout>
  )
}
