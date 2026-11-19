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
} from 'lucide-react'
import toast from 'react-hot-toast'
import { scenarioAPI } from '../services/api'
import CaseAttachmentsPanel from './CaseAttachmentsPanel'
import CaseRunsPanel from './CaseRunsPanel'
import CaseHistoryPanel from './CaseHistoryPanel'
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
    precondition: '',
    expectedResult: '',
    priority: 'MEDIUM',
    caseType: 'Functional',
  })

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
    setSaving(true)
    try {
      const res = await scenarioAPI.update(
        scenario.id,
        scenario.name,
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
      toast.success('Detail case disimpan')
      onSaved?.(updated)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
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
            <h2 className="text-sm sm:text-base font-semibold text-ink leading-snug line-clamp-2">
              {loading ? 'Memuat…' : scenario?.name || 'Case'}
            </h2>
            {scenario?.folder?.name ? (
              <p className="text-[11px] text-ink-muted mt-0.5 truncate">
                {scenario.folder.name}
                {scenario.priority ? ` · ${scenario.priority}` : ''}
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
                    <button
                      type="button"
                      onClick={() => navigate(`/scenarios/${scenarioId}`)}
                      className="text-[11px] font-medium text-brand hover:underline"
                    >
                      Edit steps →
                    </button>
                  </div>
                  {steps.length === 0 ? (
                    <p className="text-xs text-ink-muted rounded-lg border border-dashed border-surface-border px-3 py-6 text-center">
                      Belum ada step. Buka halaman penuh untuk menambah.
                    </p>
                  ) : (
                    <ol className="space-y-1.5">
                      {steps.map((step, i) => (
                        <li
                          key={step.id || i}
                          className="rounded-lg border border-surface-border bg-surface-muted/40 px-2.5 py-2"
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] font-mono text-ink-subtle shrink-0 mt-0.5">
                              {step.stepNumber ?? i + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <span className="inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 mr-1.5">
                                {step.type}
                              </span>
                              <span className="text-xs text-ink">{step.description}</span>
                              {step.expectedResult ? (
                                <p className="text-[10px] text-ink-muted mt-0.5 truncate">
                                  Expected: {step.expectedResult}
                                </p>
                              ) : null}
                            </div>
                          </div>
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
