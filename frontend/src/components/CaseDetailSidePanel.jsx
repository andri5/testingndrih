import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Save,
  ListTree,
  Plus,
  Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { scenarioAPI } from '../services/api'
import CaseAttachmentsPanel from './CaseAttachmentsPanel'
import CaseRunsPanel from './CaseRunsPanel'
import CaseHistoryPanel from './CaseHistoryPanel'
import StepAttachmentsBlock from './StepAttachmentsBlock'
import ExportFormatButton from './ExportFormatButton'
import { Spinner } from './ui'

const PRIORITY_COLORS = {
  LOW: 'border-sky-300 bg-sky-50 text-sky-800',
  MEDIUM: 'border-amber-300 bg-amber-50 text-amber-900',
  HIGH: 'border-orange-400 bg-orange-50 text-orange-900',
  CRITICAL: 'border-red-400 bg-red-50 text-red-800',
}

const TABS = [
  { id: 'details', label: 'Details' },
  { id: 'attachments', label: 'Attachments' },
  { id: 'runs', label: 'Runs' },
  { id: 'history', label: 'History' },
]

const PANEL_STEP_TYPES = [
  { value: 'NAVIGATE', label: 'Navigate' },
  { value: 'CLICK', label: 'Action' },
  { value: 'ASSERTION', label: 'Verify' },
  { value: 'WAIT', label: 'Setup' },
  { value: 'FILL', label: 'Fill' },
  { value: 'SCREENSHOT', label: 'Observe' },
]

/**
 * Testiny-style right detail panel for a test case (same page as repository list).
 */
export default function CaseDetailSidePanel({
  scenarioId,
  scenarioIds = [],
  onClose,
  onSelectId,
  onSaved,
  folderOptions = [],
  onMoveRequest,
}) {
  const navigate = useNavigate()
  const [tab, setTab] = useState('details')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [scenario, setScenario] = useState(null)
  const [steps, setSteps] = useState([])
  const [attachments, setAttachments] = useState([])
  const [meta, setMeta] = useState({
    name: '',
    precondition: '',
    expectedResult: '',
    priority: 'MEDIUM',
    caseType: 'Functional',
  })
  const [savingStepId, setSavingStepId] = useState(null)
  const [addingStep, setAddingStep] = useState(false)
  const [deletingStepId, setDeletingStepId] = useState(null)

  const index = useMemo(
    () => scenarioIds.findIndex((id) => id === scenarioId),
    [scenarioIds, scenarioId]
  )
  const hasPrev = index > 0
  const hasNext = index >= 0 && index < scenarioIds.length - 1

  const load = useCallback(async () => {
    if (!scenarioId) return
    setLoading(true)
    setError(null)
    try {
      const [scRes, stepsRes, attRes] = await Promise.all([
        scenarioAPI.getById(scenarioId),
        scenarioAPI.getSteps(scenarioId, 0, 200),
        scenarioAPI.listAttachments(scenarioId),
      ])
      const sc = scRes.data.scenario || scRes.data
      setScenario(sc)
      setMeta({
        name: sc.name || '',
        precondition: sc.precondition || '',
        expectedResult: sc.expectedResult || '',
        priority: sc.priority || 'MEDIUM',
        caseType: sc.caseType || 'Functional',
      })
      setSteps(stepsRes.data.steps || stepsRes.data || [])
      setAttachments(attRes.data.attachments || [])
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Gagal memuat case')
      setScenario(null)
    } finally {
      setLoading(false)
    }
  }, [scenarioId])

  useEffect(() => {
    setTab('details')
    load()
  }, [load])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const generalAttachments = (attachments || []).filter(
    (a) => (a.kind || 'GENERAL') !== 'EXPECTED_RESULT'
  )

  const handleSave = async () => {
    if (!scenario) return
    const name = (meta.name || '').trim()
    if (!name) {
      toast.error('Judul case wajib diisi')
      return
    }
    setSaving(true)
    try {
      const res = await scenarioAPI.update(
        scenario.id,
        name,
        scenario.description || '',
        scenario.url || '',
        {
          precondition: meta.precondition,
          expectedResult: meta.expectedResult,
          priority: meta.priority,
          caseType: meta.caseType,
          ownerId: scenario.ownerId || undefined,
        }
      )
      const updated = res.data.scenario || res.data
      setScenario((prev) => ({ ...prev, ...updated }))
      setMeta((m) => ({ ...m, name: updated.name || name }))
      toast.success('Detail case disimpan')
      onSaved?.(updated)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const reloadSteps = useCallback(async () => {
    if (!scenarioId) return
    const stepsRes = await scenarioAPI.getSteps(scenarioId, 0, 200)
    setSteps(stepsRes.data.steps || stepsRes.data || [])
  }, [scenarioId])

  const patchStepLocal = (stepId, patch) => {
    setSteps((prev) => prev.map((s) => (s.id === stepId ? { ...s, ...patch } : s)))
  }

  const handleSaveStep = async (step) => {
    if (!scenarioId || !step?.id) return
    setSavingStepId(step.id)
    try {
      await scenarioAPI.updateStep(scenarioId, step.id, {
        type: step.type || 'CLICK',
        description: step.description || '',
        expectedResult: step.expectedResult || null,
        selector: step.selector || null,
        value: step.value || null,
        metadata: step.metadata || null,
      })
      toast.success('Step disimpan')
      await reloadSteps()
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Gagal simpan step')
    } finally {
      setSavingStepId(null)
    }
  }

  const handleAddStep = async () => {
    if (!scenarioId) return
    setAddingStep(true)
    try {
      await scenarioAPI.createStep(
        scenarioId,
        null,
        'CLICK',
        '',
        null,
        null,
        null,
        null
      )
      toast.success('Step ditambah')
      await reloadSteps()
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Gagal tambah step')
    } finally {
      setAddingStep(false)
    }
  }

  const handleDeleteStep = async (stepId) => {
    if (!scenarioId || !stepId) return
    if (!window.confirm('Hapus step ini?')) return
    setDeletingStepId(stepId)
    try {
      await scenarioAPI.deleteStep(scenarioId, stepId)
      toast.success('Step dihapus')
      await reloadSteps()
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Gagal hapus step')
    } finally {
      setDeletingStepId(null)
    }
  }

  const goPrev = () => {
    if (!hasPrev) return
    onSelectId?.(scenarioIds[index - 1])
  }
  const goNext = () => {
    if (!hasNext) return
    onSelectId?.(scenarioIds[index + 1])
  }

  return (
    <aside className="h-full min-h-[100dvh] lg:min-h-[min(70vh,calc(100vh-5.5rem))] max-h-[100dvh] lg:max-h-[calc(100vh-5.5rem)] flex flex-col bg-white border border-surface-border rounded-none lg:rounded-xl shadow-xl lg:shadow-sm overflow-hidden w-full">
      {/* Header */}
      <div className="shrink-0 px-3 sm:px-4 py-3 border-b border-surface-border bg-surface-muted/30">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            {scenario?.scenarioCode ? (
              <p className="text-[10px] font-mono text-brand truncate">{scenario.scenarioCode}</p>
            ) : null}
            {loading ? (
              <h2 className="text-sm sm:text-base font-semibold text-ink leading-snug">Memuat…</h2>
            ) : (
              <input
                type="text"
                value={meta.name}
                onChange={(e) => setMeta((m) => ({ ...m, name: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSave()
                  }
                }}
                placeholder="Judul case"
                aria-label="Judul case"
                className="w-full text-sm sm:text-base font-semibold text-ink leading-snug bg-transparent border border-transparent hover:border-surface-border focus:border-brand focus:bg-white rounded-md px-1.5 py-0.5 -mx-1.5 outline-none transition-colors"
              />
            )}
            {scenario?.folder?.name ? (
              <p className="text-[11px] text-ink-muted mt-0.5 truncate">
                {scenario.folder.name}
                {meta.priority ? ` · ${meta.priority}` : ''}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              title="Buka halaman penuh"
              onClick={() => scenarioId && navigate(`/scenarios/${scenarioId}`)}
              className="p-2 rounded-lg text-ink-muted hover:bg-white hover:text-brand border border-transparent hover:border-surface-border"
            >
              <ExternalLink size={15} />
            </button>
            <button
              type="button"
              title="Tutup"
              onClick={onClose}
              className="p-2 rounded-lg text-ink-muted hover:bg-white hover:text-ink border border-transparent hover:border-surface-border"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex gap-1 mt-3 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                tab === t.id
                  ? 'bg-brand text-white'
                  : 'text-ink-muted hover:bg-white hover:text-ink'
              }`}
            >
              {t.label}
              {t.id === 'attachments' && generalAttachments.length
                ? ` (${generalAttachments.length})`
                : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-3">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-ink-muted gap-2 text-sm">
            <Spinner size="sm" /> Memuat detail…
          </div>
        ) : error ? (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        ) : (
          <>
            {tab === 'details' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-subtle mb-1">
                      Severity
                    </label>
                    <select
                      value={meta.priority}
                      onChange={(e) => setMeta((m) => ({ ...m, priority: e.target.value }))}
                      className={`w-full text-xs rounded-lg border px-2 py-2 font-semibold ${
                        PRIORITY_COLORS[meta.priority] || PRIORITY_COLORS.MEDIUM
                      }`}
                    >
                      {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-subtle mb-1">
                      Type
                    </label>
                    <select
                      value={meta.caseType}
                      onChange={(e) => setMeta((m) => ({ ...m, caseType: e.target.value }))}
                      className="w-full text-xs rounded-lg border border-surface-border bg-white px-2 py-2 text-ink"
                    >
                      {['Functional', 'Regression', 'Smoke', 'Sanity', 'Other'].map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-subtle mb-1">
                    Feature folder
                  </label>
                  <select
                    value={scenario?.folderId || scenario?.folder?.id || ''}
                    onChange={async (e) => {
                      const raw = e.target.value
                      const folderId = raw === '' ? null : raw
                      if (!scenarioId || !onMoveRequest) return
                      const current = scenario?.folderId || scenario?.folder?.id || null
                      if ((folderId || null) === (current || null)) return
                      try {
                        await onMoveRequest(scenarioId, folderId)
                        setScenario((prev) => {
                          if (!prev) return prev
                          if (!folderId) return { ...prev, folderId: null, folder: null }
                          const opt = folderOptions.find((f) => f.id === folderId)
                          const leaf = (opt?.label || 'Folder').split(' / ').pop()
                          return {
                            ...prev,
                            folderId,
                            folder: { id: folderId, name: leaf },
                          }
                        })
                      } catch {
                        /* parent toasts */
                      }
                    }}
                    className="w-full text-xs rounded-lg border border-surface-border bg-white px-2.5 py-2 text-ink"
                  >
                    <option value="">No folder</option>
                    {folderOptions.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-subtle mb-1">
                    PIC / Owner
                  </label>
                  <div className="text-xs rounded-lg border border-surface-border px-2.5 py-2 bg-surface-muted text-ink">
                    {scenario?.owner?.name || scenario?.owner?.email || '—'}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-subtle mb-1">
                    Precondition
                  </label>
                  <textarea
                    value={meta.precondition}
                    onChange={(e) => setMeta((m) => ({ ...m, precondition: e.target.value }))}
                    rows={3}
                    placeholder="Kondisi awal…"
                    className="w-full text-xs rounded-lg border border-surface-border px-2.5 py-2 bg-white text-ink"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-subtle mb-1">
                    Expected result
                  </label>
                  <textarea
                    value={meta.expectedResult}
                    onChange={(e) => setMeta((m) => ({ ...m, expectedResult: e.target.value }))}
                    rows={3}
                    placeholder="Hasil yang diharapkan…"
                    className="w-full text-xs rounded-lg border border-surface-border px-2.5 py-2 bg-white text-ink"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle flex items-center gap-1">
                      <ListTree size={12} /> Steps ({steps.length})
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAddStep}
                        disabled={addingStep || !scenarioId}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:text-brand-hover disabled:opacity-40"
                      >
                        {addingStep ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                        Tambah
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/scenarios/${scenarioId}`)}
                        className="text-[11px] font-medium text-ink-muted hover:text-brand"
                        title="Advanced edit di halaman penuh"
                      >
                        Full →
                      </button>
                    </div>
                  </div>
                  {steps.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-surface-border px-3 py-6 text-center space-y-2">
                      <p className="text-xs text-ink-muted">Belum ada step.</p>
                      <button
                        type="button"
                        onClick={handleAddStep}
                        disabled={addingStep}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand"
                      >
                        <Plus size={12} /> Tambah step pertama
                      </button>
                    </div>
                  ) : (
                    <ol className="space-y-2">
                      {steps.map((step, i) => (
                        <li
                          key={step.id || i}
                          className="rounded-lg border border-surface-border bg-white px-2.5 py-2.5 space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-ink-subtle shrink-0 w-4">
                              {step.stepNumber ?? i + 1}
                            </span>
                            <select
                              value={step.type || 'CLICK'}
                              onChange={(e) => patchStepLocal(step.id, { type: e.target.value })}
                              className="text-[11px] font-bold rounded-md border border-teal-200 bg-teal-50 text-teal-800 px-1.5 py-1"
                            >
                              {PANEL_STEP_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>
                                  {t.label}
                                </option>
                              ))}
                              {!PANEL_STEP_TYPES.some((t) => t.value === step.type) && step.type ? (
                                <option value={step.type}>{step.type}</option>
                              ) : null}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleSaveStep(step)}
                              disabled={savingStepId === step.id}
                              className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-brand disabled:opacity-40"
                              title="Simpan step"
                            >
                              {savingStepId === step.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Save size={12} />
                              )}
                              Simpan
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteStep(step.id)}
                              disabled={deletingStepId === step.id}
                              className="p-1 text-ink-subtle hover:text-red-600 disabled:opacity-40"
                              title="Hapus step"
                            >
                              {deletingStepId === step.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Trash2 size={12} />
                              )}
                            </button>
                          </div>
                          <textarea
                            value={step.description || ''}
                            onChange={(e) => patchStepLocal(step.id, { description: e.target.value })}
                            rows={2}
                            placeholder="Deskripsi step (opsional)…"
                            className="w-full text-xs rounded-lg border border-surface-border px-2.5 py-2 bg-white text-ink"
                          />
                          <input
                            type="text"
                            value={step.expectedResult || ''}
                            onChange={(e) =>
                              patchStepLocal(step.id, { expectedResult: e.target.value })
                            }
                            placeholder="Expected result (opsional)…"
                            className="w-full text-xs rounded-lg border border-surface-border px-2.5 py-1.5 bg-white text-ink"
                          />
                          <StepAttachmentsBlock
                            scenarioId={scenarioId}
                            stepId={step.id}
                            attachments={step.attachments || []}
                            onChanged={reloadSteps}
                            compact
                          />
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            )}

            {tab === 'attachments' && (
              <CaseAttachmentsPanel
                scenarioId={scenarioId}
                attachments={generalAttachments}
                onRefresh={async () => {
                  const attRes = await scenarioAPI.listAttachments(scenarioId)
                  setAttachments(attRes.data.attachments || [])
                }}
              />
            )}

            {tab === 'runs' && <CaseRunsPanel scenarioId={scenarioId} />}
            {tab === 'history' && <CaseHistoryPanel scenarioId={scenarioId} />}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-surface-border px-3 sm:px-4 py-2.5 bg-white flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-1 text-xs text-ink-muted">
          <button
            type="button"
            disabled={!hasPrev}
            onClick={goPrev}
            className="p-1.5 rounded-md border border-surface-border disabled:opacity-40 hover:bg-surface-muted"
            title="Previous case"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="tabular-nums px-1">
            {index >= 0 ? `${index + 1} of ${scenarioIds.length}` : '—'}
          </span>
          <button
            type="button"
            disabled={!hasNext}
            onClick={goNext}
            className="p-1.5 rounded-md border border-surface-border disabled:opacity-40 hover:bg-surface-muted"
            title="Next case"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-surface-border text-ink-muted hover:bg-surface-muted"
          >
            Close
          </button>
          {tab === 'details' && (
            <ExportFormatButton
              format="primary"
              icon={saving ? Loader2 : Save}
              onClick={handleSave}
              disabled={saving || loading || !scenario}
              className={`text-xs !px-3 !py-1.5 ${saving ? '[&_svg]:animate-spin' : ''}`}
            >
              {saving ? 'Saving…' : 'Save'}
            </ExportFormatButton>
          )}
        </div>
      </div>
    </aside>
  )
}
