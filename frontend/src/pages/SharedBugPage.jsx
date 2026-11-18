import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AlertTriangle, Clock, Image as ImageIcon, Bug } from 'lucide-react'

const API_BASE = '/api'

const SEVERITY_CLASS = {
  LOW: 'bg-slate-100 text-slate-700 border-slate-200',
  MEDIUM: 'bg-amber-100 text-amber-900 border-amber-200',
  HIGH: 'bg-orange-100 text-orange-900 border-orange-200',
  CRITICAL: 'bg-red-100 text-red-900 border-red-200',
}

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-2 min-w-0">
          <Link to="/" className="font-semibold text-[#0F766E] hover:underline">
            Test Sambil Ngopi
          </Link>
          <span className="text-xs text-slate-500">Shared bug (read-only)</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-[#0F766E] animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-white p-5 shadow-sm">
            <p className="text-red-700 font-medium">{error}</p>
            <p className="text-sm text-slate-600 mt-2">
              Minta link baru ke QA, atau{' '}
              <Link to="/login" className="text-[#0F766E] hover:underline">
                login
              </Link>{' '}
              untuk melihat bugs Anda.
            </p>
          </div>
        )}

        {!loading && issue && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 flex items-center gap-1.5 mb-1">
                    <Bug size={14} /> Bug report
                  </p>
                  <h1 className="text-xl font-bold text-slate-900">{issue.title}</h1>
                  {shareMeta?.expiresAt && (
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Clock size={12} />
                      Link expires {new Date(shareMeta.expiresAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${SEVERITY_CLASS[issue.severity] || SEVERITY_CLASS.MEDIUM}`}>
                    {issue.severity}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded border bg-slate-100 text-slate-700 border-slate-200">
                    {issue.status?.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded border bg-violet-50 text-violet-800 border-violet-200">
                    {issue.source === 'MANUAL' ? 'Manual' : 'Auto dari Run'}
                  </span>
                </div>
              </div>

              {issue.description && (
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm text-slate-800 whitespace-pre-wrap">
                  {issue.description}
                </div>
              )}

              <dl className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Skenario</dt>
                  <dd className="font-medium text-slate-900">{issue.scenario?.name || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Step</dt>
                  <dd className="font-medium text-slate-900">
                    {issue.stepNumber != null ? `#${issue.stepNumber}` : '—'}
                  </dd>
                </div>
                {issue.scenario?.url && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-slate-500">URL target</dt>
                    <dd className="font-mono text-xs text-slate-700 break-all">{issue.scenario.url}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-slate-500">Dibuat</dt>
                  <dd className="text-slate-800">{issue.createdAt ? new Date(issue.createdAt).toLocaleString() : '—'}</dd>
                </div>
                {issue.execution && (
                  <div>
                    <dt className="text-xs text-slate-500">Run terkait</dt>
                    <dd className="text-slate-800">
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

            {/* QA attachments */}
            {(issue.attachments || []).length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
                  <ImageIcon size={16} className="text-amber-600" />
                  Attachment dari QA
                  <span className="text-xs font-medium text-slate-500">({issue.attachments.length})</span>
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {issue.attachments.map((a) =>
                    String(a.mimeType || '').startsWith('image/') ? (
                      <button
                        key={a.id}
                        type="button"
                        className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50 text-left"
                        onClick={() => setLightbox(a.url)}
                      >
                        <img
                          src={a.url}
                          alt={a.originalName}
                          className="w-full max-h-56 object-contain object-top bg-white"
                        />
                        <p className="px-2 py-1.5 text-[11px] text-slate-600 truncate">{a.originalName}</p>
                      </button>
                    ) : (
                      <a
                        key={a.id}
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-slate-200 p-4 text-sm text-[#0F766E] hover:bg-slate-50"
                      >
                        📄 {a.originalName}
                      </a>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Screenshots gallery */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
                <ImageIcon size={16} className="text-[#0F766E]" />
                Screenshot step gagal
                {screenshots.length > 0 && (
                  <span className="text-xs font-medium text-slate-500">({screenshots.length})</span>
                )}
              </h2>

              {screenshots.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  <AlertTriangle size={18} className="inline text-amber-500 mb-1" />
                  <p>Tidak ada screenshot untuk bug ini.</p>
                  <p className="text-xs mt-1">
                    Screenshot muncul jika bug terhubung ke Run yang gagal (source Auto).
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {screenshots.map((step) => (
                    <div key={step.id} className="rounded-lg border border-slate-200 overflow-hidden">
                      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-2 text-xs">
                        <span className="font-semibold text-slate-800">
                          Step {step.stepNumber ?? '?'} · {step.type || 'ACTION'}
                        </span>
                        {step.description && (
                          <span className="text-slate-600">{step.description}</span>
                        )}
                      </div>
                      {step.errorMessage && (
                        <p className="px-3 py-2 text-xs text-red-700 bg-red-50 border-b border-red-100 break-words line-clamp-3">
                          {step.errorMessage}
                        </p>
                      )}
                      <button
                        type="button"
                        className="block w-full bg-slate-100"
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
                        <p className="px-3 py-2 text-[11px] font-mono text-slate-500 break-all border-t border-slate-200">
                          selector: {step.selector}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Failed steps without screenshots still listed */}
            {(issue.failedSteps || []).filter((s) => !s.screenshot?.url).length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900 mb-2">Step gagal lain</h2>
                <ul className="space-y-2">
                  {issue.failedSteps
                    .filter((s) => !s.screenshot?.url)
                    .map((step) => (
                      <li key={step.id} className="text-sm border border-slate-100 rounded-lg p-3">
                        <p className="font-medium text-slate-800">
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
