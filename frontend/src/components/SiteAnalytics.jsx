import { useEffect, useState } from 'react'
import { Eye, Users, BarChart2, RefreshCw } from 'lucide-react'
import { siteAPI } from '../services/api'
import { Alert, Spinner } from './ui'

export default function SiteAnalytics() {
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [analytics, setAnalytics] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await siteAPI.getAnalytics(days)
      setAnalytics(res.data.analytics)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load site analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [days])

  if (loading && !analytics) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  const stats = [
    {
      label: 'Total page views',
      value: analytics?.totalViews ?? 0,
      icon: Eye,
      color: 'text-[#5E6AD2]',
    },
    {
      label: 'Unique visitors',
      value: analytics?.uniqueVisitors ?? 0,
      icon: Users,
      color: 'text-[#34D399]',
    },
    {
      label: 'Period',
      value: `${analytics?.periodDays ?? days} days`,
      icon: BarChart2,
      color: 'text-[#F59E0B]',
    },
  ]

  return (
    <div className="space-y-4">
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[#666]">
          Public pages tracked: landing, about, login, register
        </p>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-2 py-1.5 bg-[#0F0E11] border border-[#2D2D2F] rounded text-[#E0E0E2] text-xs focus:outline-none focus:border-[#5E6AD2]"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="p-1.5 rounded text-[#8A8A8F] hover:text-[#5E6AD2] hover:bg-[#5E6AD2]/15 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-[#2D2D2F] bg-[#0F0E11] p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={16} className={s.color} />
              <span className="text-xs text-[#666] uppercase tracking-wider">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-[#E0E0E2]">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[#2D2D2F] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2D2D2F] bg-[#0F0E11]">
            <h4 className="text-sm font-semibold text-[#E0E0E2]">Top pages</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#666] text-xs border-b border-[#2D2D2F]">
                  <th className="px-4 py-2 font-medium">Path</th>
                  <th className="px-4 py-2 font-medium text-right">Views</th>
                </tr>
              </thead>
              <tbody>
                {(analytics?.topPaths || []).length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-[#666]">
                      No data yet
                    </td>
                  </tr>
                ) : (
                  analytics.topPaths.map((row) => (
                    <tr key={row.path} className="border-b border-[#2D2D2F] last:border-0">
                      <td className="px-4 py-2 text-[#A0A0A4] font-mono text-xs break-all">{row.path}</td>
                      <td className="px-4 py-2 text-[#E0E0E2] text-right font-semibold">{row.views}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-[#2D2D2F] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2D2D2F] bg-[#0F0E11]">
            <h4 className="text-sm font-semibold text-[#E0E0E2]">Daily traffic</h4>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#1A1A1C]">
                <tr className="text-left text-[#666] text-xs border-b border-[#2D2D2F]">
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium text-right">Views</th>
                  <th className="px-4 py-2 font-medium text-right">Visitors</th>
                </tr>
              </thead>
              <tbody>
                {(analytics?.daily || []).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-[#666]">
                      No data yet
                    </td>
                  </tr>
                ) : (
                  [...(analytics.daily || [])].reverse().map((row) => (
                    <tr key={row.date} className="border-b border-[#2D2D2F] last:border-0">
                      <td className="px-4 py-2 text-[#A0A0A4] text-xs">{row.date}</td>
                      <td className="px-4 py-2 text-[#E0E0E2] text-right">{row.views}</td>
                      <td className="px-4 py-2 text-[#E0E0E2] text-right">{row.uniqueVisitors}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
