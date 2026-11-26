import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AlertTriangle, Clock, Image as ImageIcon, Bug } from 'lucide-react'
import SeverityBadge from '../components/SeverityBadge'

const API_BASE = '/api'

export default function SharedBugPage() {
  const { token } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [issue, setIssue] = useState(null)
  const [shareMeta, setShareMeta] = useState(null)
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_BASE}/public/shared-bugs/${encodeURIComponent(token)}`)
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(
            data.message || (res.status === 410 ? 'This share link has expired' : 'Share link not found')
          )
        }
        if (!cancelled) {
          setIssue(data.issue)
          setShareMeta(data.share)
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load shared bug')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  const screenshots = (issue?.failedSteps || []).filter((s) => s.screenshot?.url)

  return (
    <div className="min-h-screen bg-surface-muted text-ink">
      <header className="border-b border-surface-border bg-surface/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-2 min-w-0">
          <Link to="/" className="font-semibold text-brand hover:text-brand-hover hover:underline">
            Test Sambil Ngopi
          </Link>
          <span className="text-xs text-ink-muted">Shared bug (read-only)</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
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
              untuk melihat bugs Anda.
            </p>
          </div>
        )}

        {!loading && issue && (
          <div className="space-y-4">
            <div className="linear-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand flex items-center gap-1.5 mb-1">
                    <Bug size={14} /> Bug report
                  </p>
                  <h1 className="text-xl font-bold text-ink">{issue.title}</h1>
                  {shareMeta?.expiresAt && (
                    <p className="text-xs text-ink-subtle mt-1 flex items-center gap-1">
                      <Clock size={12} />
                      Link expires {new Date(shareMeta.expiresAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <SeverityBadge severity={issue.severity} className="text-[11px] px-2 py-0.5" />
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded border bg-surface-muted text-ink-muted border-surface-border">
                    {issue.status?.replace('_', ' ')}
                  </span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                    issue.source === 'MANUAL'
                      ? 'bg-brand-soft text-brand-ink border-brand/20'
                      : 'bg-accent-soft text-accent-ink border-accent/20'
                  }`}>
                    {issue.source === 'MANUAL' ? 'Manual' : 'Auto dari Run'}
                  </span>
                </div>
              </div>

              {issue.description && (
                <div className="rounded-lg bg-surface-muted border border-surface-border p-3 text-sm text-ink whitespace-pre-wrap">
                  {issue.description}
                </div>
              )}

              <dl className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-ink-subtle">Case</dt>
                  <dd className="font-medium text-ink">{issue.scenario?.name || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-subtle">Step</dt>
                  <dd className="font-medium text-ink">
                    {issue.stepNumber != null ? `#${issue.stepNumber}` : '—'}
                  </dd>
                </div>
                {issue.scenario?.url && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-ink-subtle">URL target</dt>
                    <dd className="font-mono text-xs text-ink-muted break-all">{issue.scenario.url}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-ink-subtle">Dibuat</dt>
                  <dd className="text-ink">{issue.createdAt ? new Date(issue.createdAt).toLocaleString() : '—'}</dd>
                </div>
                {issue.execution && (
                  <div>
                    <dt className="text-xs text-ink-subtle">Run terkait</dt>
                    <dd className="text-ink">
                      {issue.execution.status}
                      {issue.execution.browser ? ` · ${issue.execution.browser}` : ''}
                      {issue.execution.duration != null
                        ? ` · ${(issue.execution.duration / 1000).toFixed(1)}s`
                        : ''}
                    </dd>
                  </div>
                )}
              </dl>

              {issue.execution?.errorMessage && (
                <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800 break-words">
                  <p className="text-xs font-bold uppercase text-red-700 mb-1">Error run</p>
                  {issue.execution.errorMessage}
                </div>
              )}
            </div>

            {(issue.attachments || []).length > 0 && (
              <div className="linear-card p-5">
                <h2 className="text-sm font-semibold text-ink flex items-center gap-2 mb-3">
                  <ImageIcon size={16} className="text-brand" />
                  Attachment dari QA
                  <span className="text-xs font-medium text-ink-subtle">({issue.attachments.length})</span>
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {issue.attachments.map((a) =>
                    String(a.mimeType || '').startsWith('image/') ? (
                      <button
                        key={a.id}
                        type="button"
                        className="rounded-lg border border-surface-border overflow-hidden bg-surface-muted text-left"
                        onClick={() => setLightbox(a.url)}
                      >
                        <img
                          src={a.url}
                          alt={a.originalName}
                          className="w-full max-h-56 object-contain object-top bg-surface"
                        />
                        <p className="px-2 py-1.5 text-[11px] text-ink-muted truncate">{a.originalName}</p>
                      </button>
                    ) : (
                      <a
                        key={a.id}
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-surface-border p-4 text-sm text-brand hover:bg-surface-muted"
                      >
                        📄 {a.originalName}
                      </a>
                    )
                  )}
                </div>
              </div>
            )}

            <div className="linear-card p-5">
              <h2 className="text-sm font-semibold text-ink flex items-center gap-2 mb-3">
                <ImageIcon size={16} className="text-brand" />
                Screenshot step gagal
                {screenshots.length > 0 && (
                  <span className="text-xs font-medium text-ink-subtle">({screenshots.length})</span>
                )}
              </h2>

              {screenshots.length === 0 ? (
                <div className="rounded-lg border border-dashed border-surface-border bg-surface-muted p-6 text-center text-sm text-ink-muted">
                  <AlertTriangle size={18} className="inline text-brand mb-1" />
                  <p>Tidak ada screenshot untuk bug ini.</p>
                  <p className="text-xs mt-1">
                    Screenshot muncul jika bug terhubung ke Run yang gagal (source Auto).
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {screenshots.map((step) => (
                    <div key={step.id} className="rounded-lg border border-surface-border overflow-hidden">
                      <div className="px-3 py-2 bg-surface-muted border-b border-surface-border flex flex-wrap gap-2 text-xs">
                        <span className="font-semibold text-ink">
                          Step {step.stepNumber ?? '?'} · {step.type || 'ACTION'}
                        </span>
                        {step.description && (
                          <span className="text-ink-muted">{step.description}</span>
                        )}
                      </div>
                      {step.errorMessage && (
                        <p className="px-3 py-2 text-xs text-red-700 bg-red-50 border-b border-red-100 break-words line-clamp-3">
                          {step.errorMessage}
                        </p>
                      )}
                      <button
                        type="button"
                        className="block w-full bg-surface-muted"
                        onClick={() => setLightbox(step.screenshot.url)}
                        title="Perbesar gambar"
                      >
                        <img
                          src={step.screenshot.url}
                          alt={`Screenshot step ${step.stepNumber}`}
                          className="w-full max-h-[420px] object-contain object-top"
                        />
                      </button>
                      {step.selector && (
                        <p className="px-3 py-2 text-[11px] font-mono text-ink-subtle break-all border-t border-surface-border">
                          selector: {step.selector}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {(issue.failedSteps || []).filter((s) => !s.screenshot?.url).length > 0 && (
              <div className="linear-card p-5">
                <h2 className="text-sm font-semibold text-ink mb-2">Step gagal lain</h2>
                <ul className="space-y-2">
                  {issue.failedSteps
                    .filter((s) => !s.screenshot?.url)
                    .map((step) => (
                      <li key={step.id} className="text-sm border border-surface-border rounded-lg p-3">
                        <p className="font-medium text-ink">
                          Step {step.stepNumber ?? '?'} · {step.type}
                          {step.description ? ` — ${step.description}` : ''}
                        </p>
                        {step.errorMessage && (
                          <p className="text-xs text-red-700 mt-1 break-words">{step.errorMessage}</p>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="Screenshot besar"
            className="max-w-full max-h-[92vh] rounded shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
