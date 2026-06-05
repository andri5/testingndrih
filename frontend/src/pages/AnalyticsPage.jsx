import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { analyticsAPI } from '../services/api'
import toast from 'react-hot-toast'
import { useSettingsStore } from '../store/settingsStore'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, ComposedChart, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { Download, TrendingUp, Calendar, Zap, AlertTriangle, Activity } from 'lucide-react'

const i18n = {
  en: {
    title: 'Test Analytics Dashboard',
    subtitle: 'Comprehensive test execution metrics and performance tracking',
    exportJson: 'Export JSON',
    exportCsv: 'Export CSV',
    failedLoadAnalytics: 'Failed to load analytics data',
    totalExecutions: 'Total Executions',
    last7Days: 'Last 7 days:',
    passRate: 'Overall Pass Rate',
    avgDuration: 'Avg Duration',
    totalScenarios: 'Total Scenarios',
    underTest: 'Under test',
    passFail: 'Pass/Fail Trend',
    executionVolume: 'Execution Volume',
    failingSteps: 'Top Failing Steps',
    flakySteps: 'Flaky Steps',
    flakyHint: 'Steps that fail intermittently (not every run)',
    scenarioPerformance: 'Scenario Performance',
    failRate: 'Fail rate',
    noData: 'No data available',
    daysShort: 'days',
    passedExec: 'Passed Executions',
    failedExec: 'Failed Executions',
    count: 'Count',
    errorCount: 'Error Count',
  },
  id: {
    title: 'Dashboard Analitik Test',
    subtitle: 'Metrik eksekusi test komprehensif dan pelacakan kinerja',
    exportJson: 'Ekspor JSON',
    exportCsv: 'Ekspor CSV',
    failedLoadAnalytics: 'Gagal memuat data analitik',
    totalExecutions: 'Total Eksekusi',
    last7Days: '7 hari terakhir:',
    passRate: 'Tingkat Keberhasilan Keseluruhan',
    avgDuration: 'Durasi Rata-rata',
    totalScenarios: 'Total Scenario',
    underTest: 'Sedang diuji',
    passFail: 'Tren Lulus/Gagal',
    executionVolume: 'Volume Eksekusi',
    failingSteps: 'Step Teratas yang Gagal',
    flakySteps: 'Step Flaky',
    flakyHint: 'Step yang kadang gagal (tidak setiap run)',
    scenarioPerformance: 'Kinerja Scenario',
    failRate: 'Tingkat gagal',
    noData: 'Tidak ada data',
    daysShort: 'hari',
    passedExec: 'Eksekusi Lulus',
    failedExec: 'Eksekusi Gagal',
    count: 'Jumlah',
    errorCount: 'Jumlah Error',
  },
}

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const { language } = useSettingsStore()
  const t = i18n[language] || i18n.en
  
  const [summary, setSummary] = useState(null)
  const [trendData, setTrendData] = useState([])
  const [volumeData, setVolumeData] = useState([])
  const [failingSteps, setFailingSteps] = useState([])
  const [flakySteps, setFlakySteps] = useState([])
  const [scenarioPerf, setScenarioPerf] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [dayRange, setDayRange] = useState(30)

  useEffect(() => {
    loadAnalytics()
  }, [dayRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const [summaryRes, trendRes, volumeRes, stepsRes, flakyRes, perfRes] = await Promise.all([
        analyticsAPI.getSummary(),
        analyticsAPI.getPassFailTrend?.(dayRange).catch(() => ({ data: [] })),
        analyticsAPI.getExecutionVolume?.(dayRange).catch(() => ({ data: [] })),
        analyticsAPI.getTopFailingSteps?.(10).catch(() => ({ data: [] })),
        analyticsAPI.getFlakySteps?.(15).catch(() => ({ data: [] })),
        analyticsAPI.getScenarioPerformance?.(20).catch(() => ({ data: [] }))
      ])

      setSummary(summaryRes.data)
      setTrendData(trendRes?.data || [])
      setVolumeData(volumeRes?.data || [])
      setFailingSteps(stepsRes?.data || [])
      setFlakySteps(flakyRes?.data || [])
      setScenarioPerf(perfRes?.data || [])
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error(t.failedLoadAnalytics)
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

      toast.success('✅ Export successful')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  const formatDuration = (ms) => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  if (loading && !summary) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 rounded-full border-2 border-[rgba(255,255,255,0.08)] border-t-[#5E6AD2] animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#E0E0E2] flex items-center gap-2">
              <TrendingUp size={24} className="text-[#9BA3F0]" />
              {t.title}
            </h1>
            <p className="text-[#8A8A8F] mt-1">{t.subtitle}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleExport('json')}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5E6AD2]/10 hover:bg-[#5E6AD2]/20 text-[#9BA3F0] font-medium transition-colors disabled:opacity-50"
            >
              <Download size={16} />
              {t.exportJson}
            </button>
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4EC9B0]/10 hover:bg-[#4EC9B0]/20 text-[#4EC9B0] font-medium transition-colors disabled:opacity-50"
            >
              <Download size={16} />
              {t.exportCsv}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Executions */}
            <div className="linear-card stat-cyan p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[#8A8A8F] font-medium uppercase tracking-wider">{t.totalExecutions}</p>
                  <p className="text-3xl font-bold text-[#E0E0E2] mt-2">{summary.totalExecutions}</p>
                  <p className="text-xs text-[#8A8A8F] mt-2">
                    {t.last7Days} {summary.last7Days?.executions || 0}
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
                  <p className="text-xs text-[#8A8A8F] font-medium uppercase tracking-wider">{t.passRate}</p>
                  <p className="text-3xl font-bold text-[#34D399] mt-2">{summary.passRate}%</p>
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
                  <p className="text-xs text-[#8A8A8F] font-medium uppercase tracking-wider">{t.avgDuration}</p>
                  <p className="text-3xl font-bold text-[#FBBF24] mt-2">{formatDuration(summary.avgDuration)}</p>
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
                  <p className="text-xs text-[#8A8A8F] font-medium uppercase tracking-wider">{t.totalScenarios}</p>
                  <p className="text-3xl font-bold text-[#9BA3F0] mt-2">{summary.totalScenarios}</p>
                  <p className="text-xs text-[#8A8A8F] mt-2">{t.underTest}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#5E6AD2]/10 flex items-center justify-center">
                  <Activity size={18} className="text-[#9BA3F0]" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Day Range Selector */}
        <div className="flex gap-2">
          {[7, 30, 90].map(days => (
            <button
              key={days}
              onClick={() => setDayRange(days)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dayRange === days
                  ? 'bg-[#5E6AD2] text-white'
                  : 'bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[#8A8A8F]'
              }`}
            >
              {days} {t.daysShort}
            </button>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pass/Fail Trend Chart */}
          <div className="linear-card p-6">
            <h3 className="text-lg font-bold text-[#E0E0E2] mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-[#9BA3F0]" />
              {t.passFail}
            </h3>
            {trendData && trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={trendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="date" stroke="#8A8A8F" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#8A8A8F" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1C1C2E',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#E0E0E2' }}
                  />
                  <Legend />
                  <Bar dataKey="passed" fill="#34D399" name={t.passedExec} />
                  <Bar dataKey="failed" fill="#F87171" name={t.failedExec} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-72 flex items-center justify-center text-[#8A8A8F]">{t.noData}</div>
            )}
          </div>

          {/* Execution Volume Chart */}
          <div className="linear-card p-6">
            <h3 className="text-lg font-bold text-[#E0E0E2] mb-4 flex items-center gap-2">
              <Activity size={18} className="text-[#4EC9B0]" />
              {t.executionVolume}
            </h3>
            {volumeData && volumeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={volumeData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="date" stroke="#8A8A8F" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#8A8A8F" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1C1C2E',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#E0E0E2' }}
                  />
                  <Area type="monotone" dataKey="count" fill="#9BA3F0" stroke="#5E6AD2" name={t.count} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-72 flex items-center justify-center text-[#8A8A8F]">{t.noData}</div>
            )}
          </div>

          {/* Top Failing Steps */}
          <div className="linear-card p-6">
            <h3 className="text-lg font-bold text-[#E0E0E2] mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-[#F87171]" />
              {t.failingSteps}
            </h3>
            {failingSteps && failingSteps.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={failingSteps}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis type="number" stroke="#8A8A8F" style={{ fontSize: '12px' }} />
                  <YAxis type="category" dataKey="description" stroke="#8A8A8F" style={{ fontSize: '10px' }} width={140} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1C1C2E',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#E0E0E2' }}
                  />
                  <Bar dataKey="failCount" fill="#F87171" name={t.errorCount} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-72 flex items-center justify-center text-[#8A8A8F]">{t.noData}</div>
            )}
          </div>

          {/* Flaky Steps */}
          <div className="linear-card p-6 lg:col-span-2">
            <h3 className="text-lg font-bold text-[#E0E0E2] mb-1 flex items-center gap-2">
              <AlertTriangle size={18} className="text-[#FBBF24]" />
              {t.flakySteps}
            </h3>
            <p className="text-xs text-[#8A8A8F] mb-4">{t.flakyHint}</p>
            {flakySteps && flakySteps.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[#8A8A8F] border-b border-[#2D2D2F]">
                      <th className="py-2 pr-4">Scenario</th>
                      <th className="py-2 pr-4">Step</th>
                      <th className="py-2 pr-4">{t.failRate}</th>
                      <th className="py-2">Runs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flakySteps.map((row, i) => (
                      <tr key={i} className="border-b border-[#2D2D2F]/50 text-[#E0E0E2]">
                        <td className="py-2 pr-4">{row.scenarioName}</td>
                        <td className="py-2 pr-4">
                          #{row.stepNumber} {row.description?.slice(0, 40)}
                        </td>
                        <td className="py-2 pr-4 text-[#FBBF24]">{row.failRate}%</td>
                        <td className="py-2 text-[#8A8A8F]">{row.failed}/{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-[#8A8A8F]">{t.noData}</div>
            )}
          </div>

          {/* Scenario Performance */}
          <div className="linear-card p-6">
            <h3 className="text-lg font-bold text-[#E0E0E2] mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-[#FBBF24]" />
              {t.scenarioPerformance}
            </h3>
            {scenarioPerf && scenarioPerf.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {scenarioPerf.slice(0, 10).map(scenario => (
                  <div key={scenario.id} className="flex items-center justify-between p-3 rounded-lg bg-[rgba(255,255,255,0.02)]">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#E0E0E2] truncate">{scenario.name}</p>
                      <p className="text-xs text-[#8A8A8F]">
                        {scenario.totalExecutions} {t.count.toLowerCase()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="w-24">
                        <div className="h-2 rounded-full bg-[rgba(255,255,255,0.1)] overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#34D399] to-[#4EC9B0]"
                            style={{ width: `${scenario.successRate}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-sm font-bold text-[#34D399] w-10 text-right">{scenario.successRate}%</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-[#8A8A8F]">{t.noData}</div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
