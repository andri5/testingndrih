import { Fragment, useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Clock, Folder, ClipboardList } from 'lucide-react'

const API_BASE = '/api'

function groupItemsByFeature(items = []) {
  const map = new Map()
  for (const item of items) {
    const folder = item.scenario?.folder
    const key = folder?.id || '__unfiled__'
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

function resultClass(status) {
  switch (status) {
    case 'PASSED':
      return 'text-emerald-700'
    case 'FAILED':
      return 'text-red-700'
    case 'BLOCKED':
      return 'text-amber-800'
    case 'SKIPPED':
      return 'text-ink-muted'
    default:
      return 'text-ink-subtle'
  }
}

export default function SharedTestRunPage() {
  const { token } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [run, setRun] = useState(null)
  const [shareMeta, setShareMeta] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_BASE}/public/shared-test-runs/${encodeURIComponent(token)}`)
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(
            data.message || (res.status === 410 ? 'This share link has expired' : 'Share link not found')
          )
        }
        if (!cancelled) {
          setRun(data.run)
          setShareMeta(data.share)
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load shared test run')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  const groups = useMemo(() => groupItemsByFeature(run?.items || []), [run])
  const p = run?.progress || {}

  return (
    <div className="min-h-screen bg-surface-muted text-ink">
      <header className="border-b border-surface-border bg-surface/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-2 min-w-0">
          <Link to="/" className="font-semibold text-brand hover:text-brand-hover hover:underline">
            Test Sambil Ngopi
          </Link>
          <span className="text-xs text-ink-muted">Shared test run (read-only)</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-2 border-surface-border border-t-brand animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="linear-card p-5">
            <p className="text-red-700 font-medium">{error}</p>
            <p className="text-sm text-ink-muted mt-2">
              Minta link baru ke QA, atau{' '}
              <Link to="/login" className="text-brand hover:underline">
                login
              </Link>{' '}
              untuk melihat test runs Anda.
            </p>
          </div>
        )}

        {!loading && run && (
          <div className="space-y-4">
            <div className="linear-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand flex items-center gap-1.5 mb-1">
                <ClipboardList size={14} /> Test run report
              </p>
              <h1 className="text-xl font-bold text-ink">{run.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-ink-muted">
                <span className="font-semibold text-ink">{run.status}</span>
                <span>
                  {p.passed || 0}P · {p.failed || 0}F · {p.blocked || 0}B · {p.skipped || 0}S ·{' '}
                  {p.notRun || 0} not run · {p.percentComplete || 0}%
                </span>
                {shareMeta?.expiresAt && (
                  <span className="inline-flex items-center gap-1 text-ink-subtle">
                    <Clock size={12} />
                    Link expires {new Date(shareMeta.expiresAt).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="h-2 rounded-full bg-surface-muted overflow-hidden mt-3">
                <div
                  className="h-full bg-brand rounded-full transition-all"
                  style={{ width: `${p.percentComplete || 0}%` }}
                />
              </div>
            </div>

            <div className="linear-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border text-left text-xs uppercase tracking-wider text-ink-subtle">
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Test case</th>
                      <th className="py-2 px-3 hidden sm:table-cell">PIC</th>
                      <th className="py-2 px-3">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((group) => (
                      <Fragment key={group.key}>
                        <tr className="bg-surface-muted/70">
                          <td colSpan={4} className="py-2 px-3">
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
                          <tr key={item.id} className="border-b border-surface-border/70 align-top">
                            <td className="py-3 px-3 text-ink-subtle">{idx + 1}</td>
                            <td className="py-3 px-3">
                              <p className="font-medium text-ink">{item.scenario?.name}</p>
                              <p className="text-xs text-ink-subtle mt-0.5">
                                {[item.scenario?.priority, item.scenario?.caseType]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </p>
                              {item.notes && (
                                <p className="text-xs text-ink-muted mt-1">{item.notes}</p>
                              )}
                            </td>
                            <td className="py-3 px-3 hidden sm:table-cell text-ink-muted text-xs">
                              {item.assignee?.name || item.assignee?.email || '—'}
                            </td>
                            <td className={`py-3 px-3 text-xs font-semibold ${resultClass(item.status)}`}>
                              · {item.status}
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
