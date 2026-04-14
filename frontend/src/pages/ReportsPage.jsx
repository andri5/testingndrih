import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { Card, Button, Badge, Spinner, Alert } from '../components/ui'
import { executionAPI } from '../services/api'
import apiClient from '../services/api'

/** Pure SVG stacked bar chart for pass/fail trend */
function TrendChart({ data }) {
  const chartH = 120
  const barW = 24
  const gap = 8
  const labelH = 30
  const svgW = data.length * (barW + gap)
  const maxVal = Math.max(1, ...data.map(d => d.passed + d.failed))

  return (
    <div className="overflow-x-auto">
      <svg width={svgW} height={chartH + labelH} className="block min-w-full">
        {data.map((d, i) => {
          const total = d.passed + d.failed
          const passH = Math.round((d.passed / maxVal) * chartH)
          const failH = Math.round((d.failed / maxVal) * chartH)
          const x = i * (barW + gap)
          return (
            <g key={d.label}>
              {/* fail bar (bottom) */}
              {failH > 0 && (
                <rect
                  x={x} y={chartH - failH - passH}
                  width={barW} height={failH}
                  fill="#ef4444" rx="2"
                >
                  <title>{d.label}: {d.failed} failed</title>
                </rect>
              )}
              {/* pass bar (top of fail) */}
              {passH > 0 && (
                <rect
                  x={x} y={chartH - passH}
                  width={barW} height={passH}
                  fill="#22c55e" rx="2"
                >
                  <title>{d.label}: {d.passed} passed</title>
                </rect>
              )}
              {/* empty bar placeholder */}
              {total === 0 && (
                <rect x={x} y={chartH - 4} width={barW} height={4} fill="#e5e7eb" rx="2" />
              )}
              {/* date label */}
              <text
                x={x + barW / 2} y={chartH + 18}
                textAnchor="middle"
                fontSize="9"
                fill="#6b7280"
                transform={`rotate(-35,${x + barW / 2},${chartH + 18})`}
              >
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="flex gap-4 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-green-500 rounded" /> Passed</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-red-500 rounded" /> Failed</span>
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  const [executions, setExecutions] = useState([])
  const [mostExecuted, setMostExecuted] = useState([])
  const [dateFilter, setDateFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const LIMIT = 10

  // Compute last-14-day trend from loaded executions (grouped by local date)
  const trendData = useMemo(() => {
    const days = 14
    const buckets = {}
    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      buckets[key] = { label: key, passed: 0, failed: 0 }
    }
    executions.forEach(e => {
      if (!e.startTime) return
      const key = new Date(e.startTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      if (buckets[key]) {
        if (e.status === 'PASSED') buckets[key].passed++
        else if (e.status === 'FAILED') buckets[key].failed++
      }
    })
    return Object.values(buckets)
  }, [executions])

  useEffect(() => {
    loadReportData()
  }, [page])

  const loadReportData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsRes, execRes, mostExecRes] = await Promise.allSettled([
        executionAPI.getStats(),
        executionAPI.getHistory(null, LIMIT, page * LIMIT),
        apiClient.get('/search/most-executed', { params: { limit: 10 } })
      ])

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data.stats)
      }
      if (execRes.status === 'fulfilled') {
        setExecutions(execRes.value.data.executions || [])
        setTotal(execRes.value.data.total || 0)
      }
      if (mostExecRes.status === 'fulfilled') {
        setMostExecuted(mostExecRes.value.data.scenarios || [])
      }
    } catch (err) {
      setError('Gagal memuat data laporan')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (ms) => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const getStatusBadge = (status) => {
    const map = {
      PASSED: { variant: 'success', label: 'PASSED' },
      FAILED: { variant: 'danger', label: 'FAILED' },
      RUNNING: { variant: 'warning', label: 'RUNNING' },
      CANCELLED: { variant: 'default', label: 'CANCELLED' }
    }
    const { variant, label } = map[status] || { variant: 'default', label: status }
    return <Badge variant={variant}>{label}</Badge>
  }

  const totalPages = Math.ceil(total / LIMIT)

  const handleExportCSV = (scenarioId) => {
    // Download CSV via API
    executionAPI.getHistory(scenarioId, 1000, 0).then(res => {
      const execs = res.data.executions || []
      const csvRows = [
        ['Scenario', 'Status', 'Duration (ms)', 'Passed Steps', 'Failed Steps', 'Start Time', 'End Time'].join(','),
        ...execs.map(e => [
          `"${(e.scenario?.name || '').replace(/"/g, '""')}"`,
          e.status,
          e.duration || 0,
          e.passedSteps || 0,
          e.failedSteps || 0,
          e.startTime || '',
          e.endTime || ''
        ].join(','))
      ]
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'execution-report.csv'
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📈 Reports</h1>
            <p className="text-gray-600 mt-1">Execution reports and analytics</p>
          </div>
          <Button onClick={() => handleExportCSV(null)} variant="secondary">
            📥 Export CSV
          </Button>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <>
            {/* Summary Stats */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                    <p className="text-sm text-gray-600 mt-1">Total Executions</p>
                  </div>
                </Card>
                <Card>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{stats.passed}</p>
                    <p className="text-sm text-gray-600 mt-1">Passed</p>
                  </div>
                </Card>
                <Card>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
                    <p className="text-sm text-gray-600 mt-1">Failed</p>
                  </div>
                </Card>
                <Card>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600">{stats.successRate}%</p>
                    <p className="text-sm text-gray-600 mt-1">Success Rate</p>
                  </div>
                </Card>
              </div>
            )}

            {/* Success Rate Bar */}
            {stats && stats.total > 0 && (
              <Card>
                <h3 className="font-semibold text-gray-900 mb-3">Success Rate</h3>
                <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500 flex items-center justify-center text-xs font-bold text-white"
                    style={{ width: `${Math.max(parseFloat(stats.successRate), 5)}%` }}
                  >
                    {stats.successRate}%
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-sm text-gray-500">
                  <span>✅ {stats.passed} passed</span>
                  <span>❌ {stats.failed} failed</span>
                  <span>⏱️ Avg: {formatDuration(stats.averageDuration)}</span>
                </div>
              </Card>
            )}

            {/* Trend Chart — last 14 days */}
            {trendData.some(d => d.passed + d.failed > 0) && (
              <Card>
                <h3 className="font-semibold text-gray-900 mb-4">📊 Pass/Fail Trend (14 hari terakhir)</h3>
                <TrendChart data={trendData} />
              </Card>
            )}

            {/* Most Executed Scenarios */}
            {mostExecuted.length > 0 && (
              <Card>
                <h3 className="font-semibold text-gray-900 mb-4">🏆 Most Executed Scenarios</h3>
                <div className="space-y-3">
                  {mostExecuted.map((s, idx) => (
                    <div
                      key={s.id}
                      onClick={() => navigate(`/scenarios/${s.id}`)}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 cursor-pointer transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-400 w-6">#{idx + 1}</span>
                        <div>
                          <p className="font-medium text-gray-900">{s.name}</p>
                          <p className="text-xs text-gray-500">{s.description || '-'}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-indigo-600">
                        {s._count?.executions ?? s.executionCount ?? 0} runs
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Execution History Table */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">📋 Execution History</h3>
              {executions.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No executions yet</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-2 font-semibold text-gray-600">Scenario</th>
                          <th className="text-left py-3 px-2 font-semibold text-gray-600">Status</th>
                          <th className="text-left py-3 px-2 font-semibold text-gray-600">Duration</th>
                          <th className="text-left py-3 px-2 font-semibold text-gray-600">Steps (P/F)</th>
                          <th className="text-left py-3 px-2 font-semibold text-gray-600">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {executions.map(e => (
                          <tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-2">
                              <span
                                className="text-indigo-600 hover:underline cursor-pointer"
                                onClick={() => navigate(`/scenarios/${e.scenarioId}`)}
                              >
                                {e.scenario?.name || 'Unknown'}
                              </span>
                            </td>
                            <td className="py-3 px-2">{getStatusBadge(e.status)}</td>
                            <td className="py-3 px-2">{formatDuration(e.duration)}</td>
                            <td className="py-3 px-2">
                              <span className="text-green-600">{e.passedSteps || 0}</span>
                              {' / '}
                              <span className="text-red-600">{e.failedSteps || 0}</span>
                            </td>
                            <td className="py-3 px-2 text-gray-500">{formatDate(e.startTime)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-500">
                        Showing {page * LIMIT + 1}-{Math.min((page + 1) * LIMIT, total)} of {total}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={page === 0}
                          onClick={() => setPage(p => p - 1)}
                        >
                          ← Prev
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={page >= totalPages - 1}
                          onClick={() => setPage(p => p + 1)}
                        >
                          Next →
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          </>
        )}
      </div>
    </Layout>
  )
}
