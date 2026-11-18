import { useEffect, useState } from 'react'
import { History, Loader2, RefreshCw } from 'lucide-react'
import { scenarioAPI } from '../services/api'
import ExportFormatButton from './ExportFormatButton'

/**
 * Testiny-style History tab — audit of case field changes.
 */
export default function CaseHistoryPanel({ scenarioId }) {
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    if (!scenarioId) return
    setLoading(true)
    setError(null)
    try {
      const res = await scenarioAPI.getHistory(scenarioId, { limit: 50, offset: 0 })
      setLogs(res.data.logs || [])
      setTotal(res.data.total || 0)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [scenarioId])

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-ink uppercase tracking-wider">History</h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Audit perubahan field test case · {total} event
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

      {loading && logs.length === 0 ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-brand" size={22} />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-border bg-surface-muted/50 px-4 py-10 text-center">
          <History size={22} className="mx-auto text-ink-subtle mb-2" />
          <p className="text-sm text-ink-muted">Belum ada perubahan tercatat</p>
          <p className="text-xs text-ink-subtle mt-1">Edit Details lalu Simpan untuk mulai audit trail.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {logs.map((log) => (
            <li
              key={log.id}
              className="rounded-lg border border-surface-border bg-white px-3 py-2.5 text-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold text-ink">
                  {log.field || log.action}
                  {log.field ? (
                    <span className="font-normal text-ink-muted"> · {log.action}</span>
                  ) : null}
                </span>
                <span className="text-xs text-ink-subtle">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-1">
                oleh {log.user?.name || log.user?.email || 'user'}
              </p>
              {(log.oldValue != null || log.newValue != null) && (
                <div className="mt-2 grid gap-1 text-xs font-mono">
                  {log.oldValue != null && (
                    <div className="text-red-700/90 truncate" title={log.oldValue}>
                      − {log.oldValue || '∅'}
                    </div>
                  )}
                  {log.newValue != null && (
                    <div className="text-emerald-700 truncate" title={log.newValue}>
                      + {log.newValue || '∅'}
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
