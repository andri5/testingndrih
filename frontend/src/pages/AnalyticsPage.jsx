import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { analyticsAPI } from '../services/api'
import toast from 'react-hot-toast'
import { Download, TrendingUp, Calendar, Zap } from 'lucide-react'

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [pagination, setPagination] = useState({ limit: 20, offset: 0 })

  useEffect(() => {
    loadAnalytics()
  }, [pagination])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const [summaryRes, historyRes] = await Promise.all([
        analyticsAPI.getSummary(),
        analyticsAPI.getExecutionHistory(pagination.limit, pagination.offset)
      ])

      setSummary(summaryRes.data)
      setHistory(historyRes.data)
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format) => {
    try {
      setExporting(true)
      const response = await analyticsAPI.exportData(format)

      if (format === 'csv') {
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `analytics-${Date.now()}.csv`)
        document.body.appendChild(link)
        link.click()
        link.parentNode.removeChild(link)
      } else {
        const dataStr = JSON.stringify(response.data, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = window.URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `analytics-${Date.now()}.json`)
        document.body.appendChild(link)
        link.click()
        link.parentNode.removeChild(link)
      }

      toast.success(`✅ Exported as ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export analytics')
    } finally {
      setExporting(false)
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
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PASSED':
        return 'text-[#34D399] bg-[#34D399]/10'
      case 'FAILED':
        return 'text-[#F87171] bg-[#F87171]/10'
      default:
        return 'text-[#FBBF24] bg-[#FBBF24]/10'
    }
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#E0E0E2] flex items-center gap-2">
              <TrendingUp size={24} className="text-[#9BA3F0]" />
              Test Analytics Dashboard
            </h1>
            <p className="text-[#8A8A8F] mt-1">Comprehensive test execution metrics and performance tracking</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('json')}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5E6AD2]/10 hover:bg-[#5E6AD2]/20 text-[#9BA3F0] font-medium transition-colors disabled:opacity-50"
            >
              <Download size={16} />
              Export JSON
            </button>
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4EC9B0]/10 hover:bg-[#4EC9B0]/20 text-[#4EC9B0] font-medium transition-colors disabled:opacity-50"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {loading && !summary ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-2 border-[rgba(255,255,255,0.08)] border-t-[#5E6AD2] animate-spin" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            {summary && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Total Executions */}
                  <div className="linear-card stat-cyan p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-[#8A8A8F] font-medium uppercase tracking-wider">Total Executions</p>
                        <p className="text-3xl font-bold text-[#E0E0E2] mt-2">{summary.totalExecutions}</p>
                        <p className="text-xs text-[#8A8A8F] mt-2">
                          Last 7 days: {summary.last7Days?.executions || 0}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-[#4EC9B0]/10 flex items-center justify-center">
                        <Zap size={18} className="text-[#4EC9B0]" />
                      </div>
                    </div>
                  </div>

                  {/* Pass Rate */}
                  <div className="linear-card stat-green p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-[#8A8A8F] font-medium uppercase tracking-wider">Overall Pass Rate</p>
                        <p className="text-3xl font-bold text-[#34D399] mt-2">{summary.passRate}%</p>
                        <p className="text-xs text-[#8A8A8F] mt-2">
                          7-day rate: {summary.last7Days?.passRate || 0}%
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-[#34D399]/10 flex items-center justify-center">
                        <TrendingUp size={18} className="text-[#34D399]" />
                      </div>
                    </div>
                  </div>

                  {/* Avg Duration */}
                  <div className="linear-card stat-amber p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-[#8A8A8F] font-medium uppercase tracking-wider">Avg Duration</p>
                        <p className="text-3xl font-bold text-[#FBBF24] mt-2">{formatDuration(summary.avgDuration)}</p>
                        <p className="text-xs text-[#8A8A8F] mt-2">Per execution</p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-[#FBBF24]/10 flex items-center justify-center">
                        <Calendar size={18} className="text-[#FBBF24]" />
                      </div>
                    </div>
                  </div>

                  {/* Total Scenarios */}
                  <div className="linear-card stat-violet p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-[#8A8A8F] font-medium uppercase tracking-wider">Total Scenarios</p>
                        <p className="text-3xl font-bold text-[#9BA3F0] mt-2">{summary.totalScenarios}</p>
                        <p className="text-xs text-[#8A8A8F] mt-2">Under test</p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-[#5E6AD2]/10 flex items-center justify-center">
                        <TrendingUp size={18} className="text-[#9BA3F0]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pass/Fail Breakdown */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="linear-card p-6 border-l-2 border-l-[#34D399]">
                    <p className="text-xs text-[#8A8A8F] font-medium uppercase tracking-wider">Passed Executions</p>
                    <div className="flex items-end gap-3 mt-3">
                      <p className="text-3xl font-bold text-[#34D399]">{summary.passedExecutions}</p>
                      <p className="text-sm text-[#8A8A8F] mb-1">
                        ({((summary.passedExecutions / summary.totalExecutions) * 100).toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                  <div className="linear-card p-6 border-l-2 border-l-[#F87171]">
                    <p className="text-xs text-[#8A8A8F] font-medium uppercase tracking-wider">Failed Executions</p>
                    <div className="flex items-end gap-3 mt-3">
                      <p className="text-3xl font-bold text-[#F87171]">{summary.failedExecutions}</p>
                      <p className="text-sm text-[#8A8A8F] mb-1">
                        ({((summary.failedExecutions / summary.totalExecutions) * 100).toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Execution History Table */}
                {history && (
                  <div className="linear-card p-6">
                    <h2 className="text-sm font-semibold text-[#E0E0E2] mb-4">📋 Execution History</h2>

                    {history.data.length === 0 ? (
                      <p className="text-center py-8 text-[#8A8A8F]">No executions yet</p>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-[rgba(255,255,255,0.08)]">
                                <th className="text-left py-3 px-4 text-xs font-medium text-[#8A8A8F] uppercase tracking-wider">
                                  Scenario
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-[#8A8A8F] uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-[#8A8A8F] uppercase tracking-wider">
                                  Duration
                                </th>
                                <th className="text-center py-3 px-4 text-xs font-medium text-[#8A8A8F] uppercase tracking-wider">
                                  Steps
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-[#8A8A8F] uppercase tracking-wider">
                                  Date
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {history.data.map((exec) => (
                                <tr
                                  key={exec.id}
                                  className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                                >
                                  <td className="py-3 px-4">
                                    <p className="text-sm font-medium text-[#E0E0E2] truncate">
                                      {exec.scenario?.name || 'Unnamed'}
                                    </p>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(exec.status)}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${
                                        exec.status === 'PASSED' ? 'bg-[#34D399]' :
                                        exec.status === 'FAILED' ? 'bg-[#F87171]' :
                                        'bg-[#FBBF24]'
                                      }`} />
                                      {exec.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-sm text-[#E0E0E2]">
                                    {formatDuration(exec.duration)}
                                  </td>
                                  <td className="py-3 px-4 text-center text-sm text-[#8A8A8F]">
                                    <span className="inline-block">
                                      {exec.passedSteps}/{exec.totalSteps}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-sm text-[#8A8A8F]">
                                    {formatDate(exec.createdAt)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[rgba(255,255,255,0.08)]">
                          <p className="text-xs text-[#8A8A8F]">
                            Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, history.total)} of {history.total}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setPagination({ ...pagination, offset: Math.max(0, pagination.offset - pagination.limit) })}
                              disabled={pagination.offset === 0}
                              className="px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[#8A8A8F] text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ← Previous
                            </button>
                            <button
                              onClick={() => setPagination({ ...pagination, offset: pagination.offset + pagination.limit })}
                              disabled={pagination.offset + pagination.limit >= history.total}
                              className="px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[#8A8A8F] text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Next →
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
