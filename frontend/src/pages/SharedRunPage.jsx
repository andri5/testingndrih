import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, Badge, Spinner, Alert } from '../components/ui'
import StepResultCard, { StepResultsSummary } from '../components/StepResultCard'
import { CheckCircle2, Clock } from 'lucide-react'

const API_BASE = '/api'

export default function SharedRunPage() {
  const { token } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [execution, setExecution] = useState(null)
  const [shareMeta, setShareMeta] = useState(null)
  const [screenshotModal, setScreenshotModal] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_BASE}/public/shared-runs/${encodeURIComponent(token)}`)
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(data.message || (res.status === 410 ? 'This share link has expired' : 'Share link not found'))
        }
        if (!cancelled) {
          setExecution(data.execution)
          setShareMeta(data.share)
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load shared run')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold text-[#5E6AD2] hover:underline">
            Test Sambil Ngopi
          </Link>
          <span className="text-xs text-slate-500">Shared run (read-only)</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {loading && (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        )}

        {!loading && error && (
          <Card>
            <Alert type="error" message={error} />
            <p className="text-sm text-slate-600 mt-3">
              Ask the owner for a new share link, or{' '}
              <Link to="/login" className="text-[#5E6AD2] hover:underline">
                sign in
              </Link>{' '}
              to view your own runs.
            </p>
          </Card>
        )}

        {!loading && execution && (
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {execution.scenario?.name || 'Shared run'}
                </h1>
                {shareMeta?.expiresAt && (
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Clock size={12} />
                    Link expires {new Date(shareMeta.expiresAt).toLocaleString()}
                  </p>
                )}
              </div>
              <Badge variant={execution.status === 'PASSED' ? 'success' : 'danger'}>
                {execution.status === 'PASSED' ? '✓' : '✗'} {execution.status}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-3 mb-5">
              <div className="flex-1 min-w-[140px] p-3 rounded-lg border bg-green-50 border-green-200">
                <p className="text-xs font-medium text-green-600">Passed</p>
                <p className="text-xl font-bold text-green-700 mt-0.5">{execution.passedSteps || 0}</p>
              </div>
              <div className="flex-1 min-w-[140px] p-3 rounded-lg border bg-red-50 border-red-200">
                <p className="text-xs font-medium text-red-600">Failed</p>
                <p className="text-xl font-bold text-red-700 mt-0.5">{execution.failedSteps || 0}</p>
              </div>
              <div className="flex-1 min-w-[140px] p-3 rounded-lg border bg-slate-50 border-slate-200">
                <p className="text-xs font-medium text-slate-600">Duration</p>
                <p className="text-xl font-bold text-slate-800 mt-0.5">
                  {execution.duration != null ? `${(execution.duration / 1000).toFixed(2)}s` : '−'}
                </p>
              </div>
            </div>

            {execution.errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800 break-words">
                {execution.errorMessage}
              </div>
            )}

            {execution.stepResults?.length > 0 && (
              <>
                <StepResultsSummary stepResults={execution.stepResults} />
                <div className="mt-4 space-y-3">
                  {execution.stepResults.map((result, idx) => (
                    <StepResultCard
                      key={result.id || idx}
                      result={result}
                      index={idx}
                      onScreenshotClick={
                        result.screenshot?.url
                          ? () => setScreenshotModal(result.screenshot.url)
                          : undefined
                      }
                    />
                  ))}
                </div>
              </>
            )}

            <p className="text-xs text-slate-400 mt-6 flex items-center gap-1">
              <CheckCircle2 size={12} /> Step values and target URLs are hidden on shared links.
            </p>
          </Card>
        )}
      </main>

      {screenshotModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setScreenshotModal(null)}
        >
          <img
            src={screenshotModal}
            alt="Step screenshot"
            className="max-w-full max-h-[90vh] rounded shadow-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
