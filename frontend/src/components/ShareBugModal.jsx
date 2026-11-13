import { useEffect, useState } from 'react'
import { Link2, Copy, Check, Trash2, X } from 'lucide-react'
import { issueAPI } from '../services/api'
import { Alert, Spinner } from './ui'

/**
 * Create / list / revoke shareable bug links for developers.
 */
export default function ShareBugModal({ issueId, open, onClose }) {
  const [shares, setShares] = useState([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)
  const [freshUrl, setFreshUrl] = useState(null)
  const [copied, setCopied] = useState(false)
  const [expiresInDays, setExpiresInDays] = useState(30)

  useEffect(() => {
    if (!open || !issueId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      setFreshUrl(null)
      try {
        const res = await issueAPI.listShares(issueId)
        if (!cancelled) setShares(res.data.shares || [])
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Gagal memuat share links')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, issueId])

  if (!open) return null

  const handleCreate = async () => {
    setCreating(true)
    setError(null)
    setCopied(false)
    try {
      const res = await issueAPI.createShare(issueId, { expiresInDays })
      const url = res.data.shareUrl || `${window.location.origin}${res.data.sharePath}`
      setFreshUrl(url.startsWith('http') ? url : `${window.location.origin}${url}`)
      setShares((prev) => [res.data.share, ...prev.filter((s) => s.id !== res.data.share?.id)])
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat share link')
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
      setError('Tidak bisa copy — seleksi URL lalu copy manual')
    }
  }

  const handleRevoke = async (shareId) => {
    try {
      await issueAPI.revokeShare(issueId, shareId)
      setShares((prev) =>
        prev.map((s) => (s.id === shareId ? { ...s, revokedAt: new Date().toISOString() } : s))
      )
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal revoke link')
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
              <Link2 size={18} className="text-amber-600" />
              Share bug ke developer
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Link publik (tanpa login) berisi detail bug + screenshot step gagal.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        <div className="flex flex-wrap items-end gap-2 mb-4">
          <div>
            <label className="text-xs font-medium text-slate-600">Berlaku (hari)</label>
            <select
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
              className="mt-1 block rounded-lg border border-slate-200 px-2 py-2 text-sm"
            >
              {[7, 14, 30, 60, 90].map((d) => (
                <option key={d} value={d}>{d} hari</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 disabled:opacity-50"
          >
            {creating ? 'Membuat…' : 'Buat link share'}
          </button>
        </div>

        {freshUrl && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs font-semibold text-emerald-800 mb-1">
              Salin sekarang — token penuh hanya ditampilkan sekali
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={freshUrl}
                className="flex-1 text-xs font-mono rounded border border-emerald-200 px-2 py-1.5 bg-white"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-slate-600 mb-2">Link aktif / riwayat</p>
          {loading ? (
            <div className="flex justify-center py-6"><Spinner size="sm" /></div>
          ) : shares.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">Belum ada share link.</p>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {shares.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-2 text-xs border border-slate-200 rounded-lg px-3 py-2"
                >
                  <div>
                    <p className="font-mono text-slate-700">{s.prefix}</p>
                    <p className="text-slate-500">
                      {s.revokedAt
                        ? 'Revoked'
                        : s.expiresAt
                          ? `Expires ${new Date(s.expiresAt).toLocaleDateString()}`
                          : 'No expiry'}
                    </p>
                  </div>
                  {!s.revokedAt && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(s.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Revoke"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
