import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Bug,
  Folder,
  FileText,
  ChevronDown,
  Search,
} from 'lucide-react'
import { executionAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'

const RESULT_OPTIONS = [
  { value: '', label: 'Not Run', color: 'text-slate-600 border-slate-300 bg-white' },
  { value: 'PASSED', label: 'Passed', color: 'text-emerald-800 border-emerald-300 bg-emerald-50' },
  { value: 'FAILED', label: 'Failed', color: 'text-red-800 border-red-300 bg-red-50' },
  { value: 'BLOCKED', label: 'Blocked', color: 'text-amber-900 border-amber-300 bg-amber-50' },
  { value: 'SKIPPED', label: 'Skipped', color: 'text-slate-700 border-slate-300 bg-slate-100' },
]

const NOTES_REQUIRED = new Set(['FAILED', 'BLOCKED'])

function resultMeta(status) {
  return RESULT_OPTIONS.find((o) => o.value === (status || '')) || RESULT_OPTIONS[0]
}

/**
 * Manual QA checklist — TestRail-style table:
 * ID | Title | Assigned To | Result dropdown (Not Run / Passed / Failed)
 * Failed → notes (+ optional bug → Issues)
 */
export default function ManualRunPanel({
  steps = [],
  executionId,
  recordedByStepId = {},
  onRecorded,
  onFinished,
  onCancel,
  busy = false,
  stepTypes = [],
  scenarioName = 'Manual run',
  scenarioCode = '',
  precondition = '',
  expectedResult = '',
  expectedResultImages = [],
  assigneeOverride = null,
}) {
  const user = useAuthStore((s) => s.user)
  const assigneeName =
    assigneeOverride?.name ||
    assigneeOverride?.email ||
    user?.name ||
    user?.email ||
    'QA'

  const getStepTypeConfig = (type) =>
    stepTypes.find((t) => t.value === type) || { icon: '•', label: type || 'STEP' }

  const [activeNotesId, setActiveNotesId] = useState(null)
  const [pendingStatus, setPendingStatus] = useState('FAILED')
  const [notes, setNotes] = useState('')
  const [createBug, setCreateBug] = useState(true)
  const [bugTitle, setBugTitle] = useState('')
  const [severity, setSeverity] = useState('MEDIUM')
  const [savingId, setSavingId] = useState(null)
  const [error, setError] = useState(null)
  const [finishing, setFinishing] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(() => new Set())

  const progress = useMemo(() => {
    const values = Object.values(recordedByStepId)
    return {
      recorded: values.length,
      total: steps.length,
      passed: values.filter((v) => v.status === 'PASSED').length,
      failed: values.filter((v) => v.status === 'FAILED').length,
      blocked: values.filter((v) => v.status === 'BLOCKED').length,
      skipped: values.filter((v) => v.status === 'SKIPPED').length,
    }
  }, [recordedByStepId, steps.length])

  const filteredSteps = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return steps
    return steps.filter((s) => {
      const hay = `${s.stepNumber} ${s.description || ''} ${s.selector || ''} ${s.type || ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [steps, query])

  const allDone = steps.length > 0 && progress.recorded >= steps.length
  const allSelected = filteredSteps.length > 0 && filteredSteps.every((s) => selected.has(s.id))

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        filteredSteps.forEach((s) => next.delete(s.id))
      } else {
        filteredSteps.forEach((s) => next.add(s.id))
      }
      return next
    })
  }

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const markDirect = async (step, status) => {
    if (!executionId || savingId) return
    setError(null)
    setSavingId(step.id)
    setActiveNotesId(null)
    try {
      const res = await executionAPI.recordManualStep(executionId, step.id, { status })
      onRecorded?.(step.id, { status, stepResult: res.data.stepResult, issue: null })
    } catch (err) {
      setError(err.response?.data?.message || `Gagal menandai ${status}`)
    } finally {
      setSavingId(null)
    }
  }

  const openNotesForm = (step, status) => {
    setActiveNotesId(step.id)
    setPendingStatus(status)
    setNotes(recordedByStepId[step.id]?.notes || '')
    setBugTitle('')
    setCreateBug(status === 'FAILED' || status === 'BLOCKED')
    setSeverity(status === 'BLOCKED' ? 'MEDIUM' : 'HIGH')
    setError(null)
  }

  const onResultChange = async (step, value) => {
    if (!value) {
      setError('Pilih hasil run. Not Run hanya status awal.')
      return
    }
    if (value === 'PASSED' || value === 'SKIPPED') {
      await markDirect(step, value)
      return
    }
    if (NOTES_REQUIRED.has(value)) {
      openNotesForm(step, value)
    }
  }

  const submitNotesStatus = async (step) => {
    if (!executionId || savingId) return
    const trimmed = notes.trim()
    if (!trimmed) {
      setError(`Notes wajib diisi untuk ${pendingStatus}`)
      return
    }
    setSavingId(step.id)
    setError(null)
    try {
      const res = await executionAPI.recordManualStep(executionId, step.id, {
        status: pendingStatus,
        notes: trimmed,
        createBug,
        bugTitle: bugTitle.trim() || undefined,
        severity,
      })
      onRecorded?.(step.id, {
        status: pendingStatus,
        notes: trimmed,
        stepResult: res.data.stepResult,
        issue: res.data.issue || null,
      })
      setActiveNotesId(null)
      setNotes('')
    } catch (err) {
      setError(err.response?.data?.message || `Gagal menandai ${pendingStatus}`)
    } finally {
      setSavingId(null)
    }
  }

  const handleFinish = async () => {
    if (!executionId || finishing) return
    setFinishing(true)
    setError(null)
    try {
      const res = await executionAPI.finishManualRun(executionId)
      onFinished?.(res.data.execution)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyelesaikan manual run')
    } finally {
      setFinishing(false)
    }
  }

  return (
    <div className="space-y-3 relative z-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">Manual Run</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Set Result per step. Failed/Blocked wajib notes; bisa buat bug ke Bug Management.
          </p>
          {precondition ? (
            <p className="text-xs text-slate-600 mt-1 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5 max-w-2xl">
              <span className="font-semibold">Precondition:</span> {precondition}
            </p>
          ) : null}
          {(expectedResult || (expectedResultImages && expectedResultImages.length > 0)) ? (
            <div className="mt-1.5 max-w-2xl rounded-md border border-sky-200 bg-sky-50 px-2 py-1.5">
              {expectedResult ? (
                <p className="text-xs text-slate-700 whitespace-pre-wrap">
                  <span className="font-semibold">Expected result:</span> {expectedResult}
                </p>
              ) : (
                <p className="text-xs font-semibold text-slate-700">Expected result</p>
              )}
              {expectedResultImages?.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {expectedResultImages.map((img) => (
                    <a
                      key={img.id}
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                      title={img.originalName}
                    >
                      <img
                        src={img.url}
                        alt={img.originalName || 'Expected result'}
                        className="h-16 w-24 object-cover rounded border border-sky-200 bg-white"
                      />
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 px-2.5 py-1">
              {progress.passed} Passed
            </span>
            <span className="rounded-full border border-red-200 bg-red-50 text-red-800 px-2.5 py-1">
              {progress.failed} Failed
            </span>
            <span className="rounded-full border border-amber-200 bg-amber-50 text-amber-900 px-2.5 py-1">
              {progress.blocked} Blocked
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-100 text-slate-700 px-2.5 py-1">
              {progress.skipped} Skipped
            </span>
            <span className="rounded-full border border-slate-200 bg-white text-slate-600 px-2.5 py-1">
              {progress.recorded}/{progress.total} done
            </span>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by keyword"
              className="pl-8 pr-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-800 w-48 focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-3 py-2.5 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300"
                  aria-label="Select all"
                />
              </th>
              <th className="px-3 py-2.5 font-semibold w-24">ID</th>
              <th className="px-3 py-2.5 font-semibold">Title</th>
              <th className="px-3 py-2.5 font-semibold w-40">Assigned To</th>
              <th className="px-3 py-2.5 font-semibold w-44">Result</th>
            </tr>
          </thead>
          <tbody>
            {/* Folder / scenario group row */}
            <tr className="bg-slate-100/80 border-b border-slate-200">
              <td className="px-3 py-2">
                <input type="checkbox" disabled className="opacity-40" />
              </td>
              <td className="px-3 py-2">
                <span className="text-teal-700 font-semibold text-xs">
                  {scenarioCode || 'TSF'}
                </span>
              </td>
              <td className="px-3 py-2" colSpan={3}>
                <div className="flex items-center gap-2 text-slate-800 font-medium">
                  <ChevronDown size={14} className="text-slate-500" />
                  <Folder size={15} className="text-amber-600" />
                  <span>{scenarioName}</span>
                  <span className="text-xs font-normal text-slate-500">| {steps.length}</span>
                </div>
              </td>
            </tr>

            {filteredSteps.map((step) => {
              const recorded = recordedByStepId[step.id]
              const status = recorded?.status || ''
              const meta = resultMeta(status)
              const config = getStepTypeConfig(step.type)
              const isNotesForm = activeNotesId === step.id
              const saving = savingId === step.id
              const caseId = `TS-${step.stepNumber}`

              return (
                <tr key={step.id} className="border-b border-slate-100 align-top hover:bg-slate-50/70">
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(step.id)}
                      onChange={() => toggleSelect(step.id)}
                      className="rounded border-slate-300"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-teal-700 font-semibold text-xs hover:underline cursor-default">
                      {caseId}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-start gap-2 min-w-[14rem]">
                      <FileText size={15} className="text-slate-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-slate-800 font-medium leading-snug">
                          {step.description || `${config.label} step ${step.stepNumber}`}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {config.icon} {config.label}
                          {step.selector ? ` · ${step.selector}` : ''}
                        </p>
                        {step.expectedResult && (
                          <p className="text-[11px] text-teal-800 mt-0.5">
                            Expected: {step.expectedResult}
                          </p>
                        )}
                        {recorded?.notes && !isNotesForm && (
                          <p className="text-[11px] text-red-700 mt-1 whitespace-pre-wrap">
                            Notes: {recorded.notes}
                          </p>
                        )}
                        {recorded?.issue?.id && (
                          <p className="inline-flex items-center gap-1 text-[11px] text-amber-800 mt-1">
                            <Bug size={11} /> Bug dibuat
                          </p>
                        )}

                        {isNotesForm && (
                          <div className="mt-2 space-y-2 rounded-md border border-red-200 bg-red-50/40 p-3 max-w-xl">
                            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                              Notes for {pendingStatus} (wajib)
                            </label>
                            <textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              rows={3}
                              autoFocus
                              className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 text-slate-800 bg-white"
                              placeholder="Expected vs actual / blocker reason…"
                            />
                            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={createBug}
                                onChange={(e) => setCreateBug(e.target.checked)}
                              />
                              Buat bug di Bug Management
                            </label>
                            {createBug && (
                              <div className="grid gap-2 sm:grid-cols-2">
                                <input
                                  type="text"
                                  value={bugTitle}
                                  onChange={(e) => setBugTitle(e.target.value)}
                                  placeholder="Judul bug (opsional)"
                                  className="text-sm rounded-md border border-slate-300 px-3 py-2 bg-white"
                                />
                                <select
                                  value={severity}
                                  onChange={(e) => setSeverity(e.target.value)}
                                  className="text-sm rounded-md border border-slate-300 px-3 py-2 bg-white"
                                >
                                  <option value="LOW">LOW</option>
                                  <option value="MEDIUM">MEDIUM</option>
                                  <option value="HIGH">HIGH</option>
                                  <option value="CRITICAL">CRITICAL</option>
                                </select>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={saving || busy || !notes.trim()}
                                onClick={() => submitNotesStatus(step)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                {saving ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                                Save {pendingStatus}
                              </button>
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => setActiveNotesId(null)}
                                className="px-3 py-1.5 rounded-md text-xs font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900"
                      title="Assignee / PIC"
                    >
                      <span className="truncate max-w-[8rem]">{assigneeName}</span>
                      <ChevronDown size={12} className="text-slate-400" />
                    </button>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="relative inline-block min-w-[9.5rem]">
                      <select
                        value={status}
                        disabled={saving || busy || isNotesForm}
                        onChange={(e) => onResultChange(step, e.target.value)}
                        className={`w-full appearance-none cursor-pointer rounded-md border pl-7 pr-7 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:opacity-60 ${meta.color}`}
                        aria-label={`Result for ${caseId}`}
                      >
                        {RESULT_OPTIONS.map((opt) => (
                          <option key={opt.value || 'not-run'} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-slate-400" />
                      <ChevronDown
                        size={12}
                        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"
                      />
                      {saving && (
                        <Loader2
                          size={12}
                          className="absolute -right-5 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
                        />
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}

            {filteredSteps.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-500">
                  Tidak ada step yang cocok dengan pencarian.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          disabled={!allDone || finishing || busy}
          onClick={handleFinish}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold bg-teal-700 text-white hover:bg-teal-800 disabled:bg-slate-300 disabled:text-slate-600"
        >
          {finishing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          {finishing ? 'Menyimpan…' : 'Selesai Manual Run'}
        </button>
        <button
          type="button"
          disabled={finishing || busy}
          onClick={onCancel}
          className="inline-flex items-center px-4 py-2 rounded-md text-xs font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
        >
          Batalkan
        </button>
      </div>
    </div>
  )
}
