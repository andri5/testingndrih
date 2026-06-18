import { useEffect, useState } from 'react'
import { siteAPI } from '../services/api'
import { Alert, Spinner } from './ui'

export default function LandingFeedbackAdmin() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await siteAPI.listFeedback({ limit: 50 })
        setItems(res.data.items || [])
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load feedback')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <div className="rounded-xl border border-[#2D2D2F] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2D2D2F] bg-[#0F0E11]">
          <h4 className="text-sm font-semibold text-[#E0E0E2]">Landing page suggestions</h4>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[#666]">No feedback yet</p>
          ) : (
            <ul className="divide-y divide-[#2D2D2F]">
              {items.map((item) => (
                <li key={item.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#666] mb-1">
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                    {item.lang && (
                      <span className="px-1.5 py-0.5 rounded bg-[#2D2D2F] uppercase">{item.lang}</span>
                    )}
                    {item.page && (
                      <span className="font-mono break-all">{item.page}</span>
                    )}
                  </div>
                  {(item.name || item.email) && (
                    <p className="text-xs text-[#8A8A8F] mb-1 break-words">
                      {[item.name, item.email].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <p className="text-sm text-[#E0E0E2] whitespace-pre-wrap break-words">{item.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
