import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { issueAPI } from '../services/api'
import toast from 'react-hot-toast'

const OPEN_STATUSES = new Set(['OPEN', 'IN_PROGRESS'])
const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'CLOSED']
const MAX_VISIBLE = 5

export default function OpenIssuesWidget() {
  const navigate = useNavigate()
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const res = await issueAPI.list({ limit: 50 })
      const all = res.data.issues || []
      const open = all.filter((i) => OPEN_STATUSES.has(i.status))
      setIssues(open)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleStatusChange = async (issueId, status) => {
    try {
      setUpdatingId(issueId)
      await issueAPI.update(issueId, { status })
      await load()
      toast.success(status === 'CLOSED' ? 'Issue closed' : 'Issue updated')
    } catch {
      toast.error('Failed to update issue')
    } finally {
      setUpdatingId(null)
    }
  }

  const visible = issues.slice(0, MAX_VISIBLE)
  const hiddenCount = Math.max(0, issues.length - MAX_VISIBLE)

  return (
    <div className="linear-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
          <AlertTriangle size={16} className="text-brand" />
          Open Issues
        </h2>
        <div className="flex items-center gap-2">
          {!loading && issues.length > 0 && (
            <span className="text-xs font-semibold text-brand-ink bg-brand-soft border border-brand/20 px-2 py-0.5 rounded-full">
              {issues.length} open
            </span>
          )}
          <button
            type="button"
            onClick={() => navigate('/issues')}
            className="text-xs font-medium text-brand hover:text-brand-hover hover:underline"
          >
            Kelola bugs →
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-ink-muted py-4 text-center">Loading…</p>
      ) : issues.length === 0 ? (
        <div className="flex items-center gap-3 py-4 px-3 rounded-lg bg-brand-soft border border-brand/20">
          <CheckCircle2 size={20} className="text-brand shrink-0" />
          <p className="text-sm text-brand-ink">No open issues — all tests passing!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((issue) => (
            <div
              key={issue.id}
              className="p-3 rounded-md bg-surface-muted border border-surface-border"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink text-sm truncate">{issue.title}</p>
                  <p className="text-xs text-ink-subtle mt-0.5">
                    {issue.execution?.scenario?.name || 'Unknown scenario'}
                    {issue.stepNumber != null && ` · Step ${issue.stepNumber}`}
                  </p>
                  {issue.execution?.scenario?.id && (
                    <button
                      type="button"
                      onClick={() => navigate(`/scenarios/${issue.execution.scenario.id}`)}
                      className="text-xs text-brand hover:text-brand-hover hover:underline mt-1.5 font-medium"
                    >
                      View scenario →
                    </button>
                  )}
                </div>
                <select
                  value={issue.status}
                  disabled={updatingId === issue.id}
                  onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                  className="text-xs px-2 py-1 rounded border border-surface-border bg-surface text-ink focus:outline-none focus:border-brand disabled:opacity-50 shrink-0"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
          {hiddenCount > 0 && (
            <p className="text-xs text-ink-subtle text-center pt-1">
              + {hiddenCount} more open issue{hiddenCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
