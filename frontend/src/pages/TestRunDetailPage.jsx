import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { Card, Badge, Spinner, Alert, Button } from '../components/ui'
import ExportFormatButton from '../components/ExportFormatButton'
import { scenarioAPI, testRunAPI } from '../services/api'
import StepAttachmentsBlock from '../components/StepAttachmentsBlock'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Loader2,
  Lock,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Ban,
  SkipForward,
  Folder,
  X,
} from 'lucide-react'

function groupItemsByFeature(items = []) {
  const map = new Map()
  for (const item of items) {
    const folder = item.scenario?.folder
    const key = item.scenario?.folderId || folder?.id || '__unfiled__'
    const label = folder?.name || 'No folder'
    if (!map.has(key)) map.set(key, { key, label, items: [] })
    map.get(key).items.push(item)
  }
  const groups = [...map.values()]
  groups.sort((a, b) => {
    if (a.key === '__unfiled__') return 1
    if (b.key === '__unfiled__') return -1
    return a.label.localeCompare(b.label, 'id')
  })
  return groups
}

const RESULTS = [
  { value: 'PASSED', label: 'Pass', icon: CheckCircle2, className: 'text-emerald-700 border-emerald-200 bg-emerald-50' },
  { value: 'FAILED', label: 'Fail', icon: XCircle, className: 'text-red-700 border-red-200 bg-red-50' },
  { value: 'BLOCKED', label: 'Blocked', icon: Ban, className: 'text-amber-800 border-amber-200 bg-amber-50' },
  { value: 'SKIPPED', label: 'Skip', icon: SkipForward, className: 'text-ink-muted border-surface-border bg-surface-muted' },
  { value: 'NOT_RUN', label: 'Reset', icon: null, className: 'text-ink-muted border-surface-border' },
]

export default function TestRunDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [run, setRun] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [closing, setClosing] = useState(false)
  const [error, setError] = useState(null)
  const [notesFor, setNotesFor] = useState(null) // itemId
  const [notes, setNotes] = useState('')
  const [pendingStatus, setPendingStatus] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [steps, setSteps] = useState([])
  const [stepsLoading, setStepsLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await testRunAPI.getById(id)
      setRun(res.data.run)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat test run')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const sealed = run?.status === 'CLOSED'

  const applyStatus = async (itemId, status, notesValue = '') => {
    setBusyId(itemId)
    setError(null)
    try {
      const res = await testRunAPI.updateItem(id, itemId, {
        status,
        ...(notesValue ? { notes: notesValue } : {}),
      })
      setRun(res.data.run)
      setNotesFor(null)
      setNotes('')
      setPendingStatus(null)
      toast.success(`Status diubah: ${status}`)
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal update result'
      setError(msg)
      toast.error(msg)
    } finally {
      setBusyId(null)
    }
  }

  const requestStatus = (item, status) => {
    if (sealed) return
    if (status === 'FAILED' || status === 'BLOCKED') {
      setNotesFor(item.id)
      setPendingStatus(status)
      setNotes(item.notes || '')
      return
    }
    applyStatus(item.id, status)
  }

  const handleClose = async () => {
    if (!window.confirm('Tutup (seal) test run ini? Result tidak bisa diubah lagi.')) return
    setClosing(true)
    try {
      const res = await testRunAPI.close(id)
      setRun(res.data.run)
      toast.success('Test Run ditutup (sealed)')
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menutup run'
      setError(msg)
      toast.error(msg)
    } finally {
      setClosing(false)
    }
  }

  const startChecklist = async (item) => {
    setBusyId(item.id)
    setError(null)
    try {
      const res = await testRunAPI.startManual(id, item.id)
      if (res.data.run) setRun(res.data.run)
      navigate(`/scenarios/${item.scenarioId}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mulai checklist')
    } finally {
      setBusyId(null)
    }
  }

  const featureGroups = useMemo(
    () => groupItemsByFeature(run?.items || []),
    [run?.items]
  )

  const activeItem = useMemo(
    () => (run?.items || []).find((item) => item.id === activeId) || null,
    [run, activeId]
  )

  useEffect(() => {
    const items = run?.items || []
    if (!items.length) {
      setActiveId(null)
      return
    }
    setActiveId((prev) => (prev && items.some((item) => item.id === prev) ? prev : items[0].id))
  }, [run])

  useEffect(() => {
    const scenarioId = activeItem?.scenarioId
    if (!scenarioId) {
      setSteps([])
      return undefined
    }
    let cancelled = false
    setStepsLoading(true)
    scenarioAPI
      .getSteps(scenarioId, 0, 200)
      .then((res) => {
        if (!cancelled) setSteps(res.data.steps || res.data || [])
      })
      .catch(() => {
        if (!cancelled) setSteps([])
      })
      .finally(() => {
        if (!cancelled) setStepsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeItem?.scenarioId])

  if (loading && !run) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (!run) {
    return (
      <Layout>
        <Alert type="error" message={error || 'Run not found'} />
        <Button className="mt-4" onClick={() => navigate('/test-runs')}>
          Back
        </Button>
      </Layout>
    )
  }

  const p = run.progress || {}

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={() => navigate('/test-runs')}
              className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-brand mb-2"
            >
              <ArrowLeft size={14} /> Test Runs
            </button>
            <h1 className="text-2xl font-bold text-ink">{run.title}</h1>
            <p className="text-xs text-ink-muted mt-1">
              Case dikelompokkan per feature folder (1 folder = 1 fitur).
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant={sealed ? 'default' : 'primary'}>{run.status}</Badge>
              <span className="text-xs text-ink-muted">
                {p.passed || 0}P · {p.failed || 0}F · {p.blocked || 0}B · {p.skipped || 0}S ·{' '}
                {p.notRun || 0} not run · {p.percentComplete || 0}%
              </span>
            </div>
          </div>
          {!sealed && (
            <ExportFormatButton
              format="pdf"
              icon={closing ? Loader2 : Lock}
              onClick={handleClose}
              disabled={closing}
              className={closing ? '[&_svg]:animate-spin' : ''}
            >
              Close / Seal
            </ExportFormatButton>
          )}
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        <div className="mb-1">
          <div className="h-2 rounded-full bg-surface-muted overflow-hidden">
            <div
              className="h-full bg-brand rounded-full transition-all"
              style={{ width: `${p.percentComplete || 0}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] gap-3 items-start">
        <Card>
          <p className="text-xs text-ink-muted mb-3">Klik case untuk hasil dan steps di panel kanan.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left text-xs uppercase tracking-wider text-ink-subtle">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Test case</th>
                  <th className="py-2 pr-3 hidden md:table-cell">PIC</th>
                  <th className="py-2 pr-3">Result</th>
                  <th className="py-2 text-right" />
                </tr>
              </thead>
              <tbody>
                {featureGroups.map((group) => (
                  <Fragment key={group.key}>
                    <tr className="bg-surface-muted/70">
                      <td colSpan={5} className="py-2 px-1">
                        <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                          <Folder size={14} className="text-brand" />
                          <span>{group.label}</span>
                          <span className="text-ink-subtle font-normal tabular-nums">
                            ({group.items.length} case)
                          </span>
                        </div>
                      </td>
                    </tr>
                    {group.items.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`border-b border-surface-border/70 align-top cursor-pointer ${
                      activeId === item.id ? 'bg-sky-50/90' : 'hover:bg-surface-muted/40'
                    }`}
                    onClick={() => {
                      setActiveId(item.id)
                      setPanelOpen(true)
                    }}
                  >
                    <td className="py-3 pr-3 text-ink-subtle">{idx + 1}</td>
                    <td className="py-3 pr-3">
                      <p className="font-medium text-ink text-left">{item.scenario?.name}</p>
                      <p className="text-xs text-ink-subtle mt-0.5">
                        {item.scenario?.folder?.name || 'No folder'} ·{' '}
                        {item.scenario?.priority || 'MEDIUM'} · {item.scenario?.caseType || 'Functional'} ·{' '}
                        {item.scenario?.steps ?? 0} steps
                      </p>
                      {item.notes && (
                        <p className="text-xs text-amber-800 mt-1 bg-amber-50 rounded px-2 py-1">
                          Notes: {item.notes}
                        </p>
                      )}
                    </td>
                    <td className="py-3 pr-3 hidden md:table-cell text-xs text-ink-muted">
                      {item.assignee?.name || item.assignee?.email || '—'}
                    </td>
                    <td className="py-3 pr-3">
                      <Badge
                        variant={
                          item.status === 'PASSED'
                            ? 'success'
                            : item.status === 'FAILED'
                              ? 'danger'
                              : item.status === 'BLOCKED' || item.status === 'SKIPPED'
                                ? 'warning'
                                : 'default'
                        }
                      >
                        {item.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-right text-[11px] text-ink-subtle">Panel →</td>
                  </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {activeItem && (
          <>
            {panelOpen && (
              <button
                type="button"
                className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
                aria-label="Tutup panel"
                onClick={() => setPanelOpen(false)}
              />
            )}
            <aside
              className={`${
                panelOpen
                  ? 'fixed inset-y-0 right-0 z-40 w-[min(100%,24rem)]'
                  : 'hidden'
              } lg:static lg:block lg:z-0 lg:w-auto h-[100dvh] lg:h-auto lg:max-h-[calc(100vh-6rem)] lg:sticky lg:top-3 flex flex-col bg-white border border-surface-border lg:rounded-xl shadow-xl lg:shadow-sm overflow-hidden`}
            >
              <div className="shrink-0 px-4 py-3 border-b border-surface-border">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
                      {activeItem.scenario?.folder?.name || 'No folder'}
                    </p>
                    <h2 className="text-sm font-semibold text-ink leading-snug line-clamp-2">
                      {activeItem.scenario?.name}
                    </h2>
                    <p className="text-[11px] text-ink-muted mt-1">
                      {activeItem.scenario?.priority || 'MEDIUM'} · {activeItem.scenario?.caseType || 'Functional'} ·{' '}
                      {activeItem.assignee?.name || activeItem.assignee?.email || 'Tanpa PIC'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="lg:hidden p-1.5 rounded-md text-ink-muted hover:bg-surface-muted"
                    onClick={() => setPanelOpen(false)}
                    aria-label="Tutup"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle mb-2">Result</p>
                  <div className="flex flex-wrap gap-1.5">
                    {!sealed &&
                      RESULTS.map((r) => {
                        const Icon = r.icon
                        const on = activeItem.status === r.value
                        return (
                          <button
                            key={r.value}
                            type="button"
                            disabled={busyId === activeItem.id}
                            onClick={() => requestStatus(activeItem, r.value)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] font-semibold disabled:opacity-40 ${r.className} ${
                              on ? 'ring-2 ring-brand' : ''
                            }`}
                          >
                            {Icon ? <Icon size={12} /> : null}
                            {r.label}
                          </button>
                        )
                      })}
                    {sealed && <Badge>{activeItem.status}</Badge>}
                  </div>
                  {notesFor === activeItem.id && (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder="Notes wajib untuk Failed/Blocked"
                        className="w-full text-xs rounded-lg border border-surface-border px-2 py-1.5"
                      />
                      <div className="flex gap-2">
                        <ExportFormatButton
                          format="primary"
                          onClick={() => applyStatus(activeItem.id, pendingStatus, notes)}
                          disabled={!notes.trim() || busyId === activeItem.id}
                        >
                          Simpan {pendingStatus}
                        </ExportFormatButton>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setNotesFor(null)
                            setPendingStatus(null)
                          }}
                        >
                          Batal
                        </Button>
                      </div>
                    </div>
                  )}
                  {activeItem.notes && notesFor !== activeItem.id && (
                    <p className="text-xs text-amber-800 mt-2 bg-amber-50 rounded px-2 py-1">
                      Notes: {activeItem.notes}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
                      Steps ({steps.length})
                    </p>
                    <button
                      type="button"
                      disabled={busyId === activeItem.id || sealed}
                      onClick={() => startChecklist(activeItem)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-800 disabled:opacity-40"
                    >
                      {busyId === activeItem.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <ClipboardList size={12} />
                      )}
                      Checklist
                    </button>
                  </div>
                  {stepsLoading ? (
                    <div className="flex justify-center py-6">
                      <Spinner size="sm" />
                    </div>
                  ) : steps.length === 0 ? (
                    <p className="text-xs text-ink-muted">Belum ada step.</p>
                  ) : (
                    <ol className="space-y-2">
                      {steps.map((step, i) => (
                        <li
                          key={step.id || i}
                          className="rounded-lg border border-surface-border bg-surface-muted/40 px-2.5 py-2"
                        >
                          <div>
                            <span className="text-[10px] font-mono text-ink-subtle mr-1.5">
                              {step.stepNumber ?? i + 1}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 mr-1.5">
                              {step.type}
                            </span>
                            <span className="text-xs text-ink">
                              {step.description || '(tanpa deskripsi)'}
                            </span>
                          </div>
                          {activeItem?.scenarioId ? (
                            <StepAttachmentsBlock
                              scenarioId={activeItem.scenarioId}
                              stepId={step.id}
                              attachments={step.attachments || []}
                              onChanged={async () => {
                                const res = await scenarioAPI.getSteps(activeItem.scenarioId, 0, 200)
                                setSteps(res.data.steps || res.data || [])
                              }}
                              compact
                            />
                          ) : null}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            </aside>
          </>
        )}
        </div>
      </div>
    </Layout>
  )
}
