import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, PlayCircle, ClipboardList, RefreshCw } from 'lucide-react'
import { scenarioAPI } from '../services/api'
import ExportFormatButton from './ExportFormatButton'
import { Badge } from './ui'

function typeLabel(testType) {
  if (testType === 'MANUAL') return 'Manual'
  if (testType === 'AGENT') return 'Agent'
  return 'Automated'
}

function statusVariant(status) {
  if (status === 'PASSED') return 'success'
  if (status === 'FAILED') return 'danger'
  if (status === 'RUNNING') return 'primary'
  if (status === 'BLOCKED' || status === 'SKIPPED' || status === 'PENDING') return 'warning'
  return 'default'
}

/**
 * Testiny-style Runs tab — history + % complete for this test case.
 */
export default function CaseRunsPanel({ scenarioId }) {
  const navigate = useNavigate()
  const [runs, setRuns] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    if (!scenarioId) return
    setLoading(true)
    setError(null)
    try {
      const res = await scenarioAPI.getRuns(scenarioId, { limit: 30, offset: 0 })
      setRuns(res.data.runs || [])
      setTotal(res.data.total || 0)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat runs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [scenarioId])

  const avgComplete =
    runs.length > 0
      ? Math.round(runs.reduce((s, r) => s + (r.percentComplete || 0), 0) / runs.length)
      : 0

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Runs</h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Riwayat eksekusi test case ini · {total} run
            {runs.length > 0 ? ` · avg complete ${avgComplete}%` : ''}
          </p>
        </div>
        <ExportFormatButton
          format="json"
          icon={loading ? Loader2 : RefreshCw}
          onClick={load}
          disabled={loading}
          className={loading ? '[&_svg]:animate-spin' : ''}
        >
          Refresh
        </ExportFormatButton>
      </div>

      {error && (
        <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {loading && runs.length === 0 ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-brand" size={22} />
        </div>
      ) : runs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-border bg-surface-muted/50 px-4 py-10 text-center">
          <PlayCircle size={22} className="mx-auto text-ink-subtle mb-2" />
          <p className="text-sm text-ink-muted">Belum ada run untuk case ini</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border text-left text-xs uppercase tracking-wider text-ink-subtle">
                <th className="py-2 pr-3 font-semibold">When</th>
                <th className="py-2 pr-3 font-semibold">Type</th>
                <th className="py-2 pr-3 font-semibold">Status</th>
                <th className="py-2 pr-3 font-semibold hidden sm:table-cell">Steps</th>
                <th className="py-2 pr-3 font-semibold">Complete</th>
                <th className="py-2 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} className="border-b border-surface-border/70">
                  <td className="py-2.5 pr-3 text-ink whitespace-nowrap">
                    {new Date(run.createdAt || run.startTime).toLocaleString()}
                  </td>
                  <td className="py-2.5 pr-3">
                    <span
                      className={`inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        run.testType === 'MANUAL'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-teal-50 text-teal-800 border border-teal-200'
                      }`}
                    >
                      {typeLabel(run.testType)}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3">
                    <Badge variant={statusVariant(run.status)}>{run.status}</Badge>
                  </td>
                  <td className="py-2.5 pr-3 hidden sm:table-cell text-ink-muted">
                    <span className="text-emerald-600 font-semibold">{run.passedSteps || 0}</span>
                    {' / '}
                    <span className="text-red-600 font-semibold">{run.failedSteps || 0}</span>
                    <span className="text-ink-subtle"> · {run.totalSteps || 0}</span>
                  </td>
                  <td className="py-2.5 pr-3 min-w-[110px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-surface-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            run.status === 'FAILED'
                              ? 'bg-red-500'
                              : run.status === 'PASSED'
                                ? 'bg-emerald-500'
                                : 'bg-brand'
                          }`}
                          style={{ width: `${run.percentComplete || 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-ink-muted w-8 text-right">
                        {run.percentComplete || 0}%
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right">
                    {run.testType === 'MANUAL' && run.status === 'RUNNING' ? (
                      <ExportFormatButton
                        format="csv"
                        icon={ClipboardList}
                        onClick={() => navigate(`/scenarios/${scenarioId}`)}
                        className="!px-2"
                      >
                        Checklist
                      </ExportFormatButton>
                    ) : (
                      <ExportFormatButton
                        format="json"
                        onClick={() => navigate(`/execution`)}
                        className="!px-2"
                      >
                        History
                      </ExportFormatButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
