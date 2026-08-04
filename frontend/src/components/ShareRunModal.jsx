import { useEffect, useState } from 'react'
import { Link2, Copy, Check, Trash2, X } from 'lucide-react'
import { executionAPI } from '../services/api'
import { Alert, Badge, Spinner } from './ui'

/**
 * Modal to create / list / revoke shareable run links.
 */
export default function ShareRunModal({ executionId, open, onClose }) {
  const [shares, setShares] = useState([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)
  const [freshUrl, setFreshUrl] = useState(null)
  const [copied, setCopied] = useState(false)
  const [expiresInDays, setExpiresInDays] = useState(30)

  useEffect(() => {
    if (!open || !executionId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      setFreshUrl(null)
      try {
        const res = await executionAPI.listShares(executionId)
        if (!cancelled) setShares(res.data.shares || [])
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load share links')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, executionId])

  if (!open) return null

  const handleCreate = async () => {
    setCreating(true)
    setError(null)
    setCopied(false)
    try {
      const res = await executionAPI.createShare(executionId, { expiresInDays })
      const url = res.data.shareUrl || `${window.location.origin}${res.data.sharePath}`
      setFreshUrl(url.startsWith('http') ? url : `${window.location.origin}${url}`)
      setShares((prev) => [res.data.share, ...prev.filter((s) => s.id !== res.data.share?.id)])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create share link')
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = async () => {
    if (!freshUrl) return
    try {
      await navigator.clipboard.writeText(freshUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy — select the URL and copy manually')
    }
  }

  const handleRevoke = async (shareId) => {
    try {
      await executionAPI.revokeShare(executionId, shareId)
      setShares((prev) =>
        prev.map((s) => (s.id === shareId ? { ...s, revokedAt: new Date().toISOString() } : s))
      )
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to revoke link')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-xl border border-slate-200 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Link2 size={18} className="text-[#5E6AD2]" />
              Share run
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Anyone with the link can view a redacted read-only summary (no login).
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        <div className="flex flex-wrap items-end gap-3 mb-4">
          <label className="text-sm text-slate-600">
            Expires in (days)
            <input
              type="number"
              min={1}
              max={90}
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value) || 30)}
              className="mt-1 block w-24 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="px-3 py-2 rounded-md bg-[#5E6AD2] text-white text-sm font-medium hover:bg-[#4f5bc0] disabled:opacity-60"
          >
            {creating ? 'Creating…' : 'Create link'}
          </button>
        </div>

        {freshUrl && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <p className="text-xs font-medium text-emerald-800 mb-1">Copy now — full URL shown once</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={freshUrl}
                className="flex-1 text-xs font-mono px-2 py-1.5 rounded border border-emerald-200 bg-white text-slate-800"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 px-2.5 py-1.5 rounded border border-emerald-300 bg-white text-emerald-800 text-sm flex items-center gap-1"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        <div className="border-t border-slate-100 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Existing links</p>
          {loading ? (
            <div className="flex justify-center py-6">
              <Spinner size="md" />
            </div>
          ) : shares.length === 0 ? (
            <p className="text-sm text-slate-500 py-2">No share links yet.</p>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {shares.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-2 text-sm py-2 px-2 rounded-md bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-slate-700 truncate">{s.prefix}</p>
                    <p className="text-xs text-slate-500">
                      {s.revokedAt
                        ? 'Revoked'
                        : s.expiresAt
                          ? `Expires ${new Date(s.expiresAt).toLocaleDateString()}`
                          : 'No expiry'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={s.revokedAt ? 'danger' : 'success'}>
                      {s.revokedAt ? 'REVOKED' : 'ACTIVE'}
                    </Badge>
                    {!s.revokedAt && (
                      <button
                        type="button"
                        onClick={() => handleRevoke(s.id)}
                        className="p-1.5 rounded text-red-600 hover:bg-red-50"
                        title="Revoke"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
