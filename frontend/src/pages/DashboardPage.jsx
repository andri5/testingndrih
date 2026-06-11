import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Layout from '../components/Layout'
import { executionAPI, analyticsAPI } from '../services/api'
import apiClient from '../services/api'
import {
  ClipboardList,
  PlayCircle,
  CheckCircle2,
  Clock,
  Check,
  X,
  Download,
  TrendingUp,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getQuickActionsForRole } from '../constants/quickActions'
import OpenIssuesWidget from '../components/OpenIssuesWidget'

// i18n translations
const i18n = {
    welcome: 'Welcome back',
    hereIs: "Here's what's happening with your test automation today.",
    testScenarios: 'Test Scenarios',
    totalExecutions: 'Total Executions',
    successRate: 'Success Rate',
    avgDuration: 'Avg Duration',
    passed: 'Passed',
    failed: 'Failed',
    quickActions: 'Quick Actions',
    createScenario: 'Create Scenario',
    startRecording: 'Start recording a new test',
    runExecution: 'Run Execution',
    executeScenario: 'Execute a test scenario',
    viewAnalytics: 'View Analytics',
    detailedMetrics: 'Detailed test performance metrics',
    analyticsSummary: 'Analytics Summary',
    last7Days: 'Last 7 days',
    passRate: 'pass rate',
    totalScenarios: 'Total Scenarios',
    recentScenarios: 'Recent Scenarios',
    recentExecutions: 'Recent Executions',
    noScenariosYet: 'No scenarios yet',
    noExecutionsYet: 'No executions yet',
    steps: 'steps',
    apiTesting: 'API Testing',
    apiTestingDesc: 'Run HTTP request tests',
    environments: 'Environments',
    environmentsDesc: 'Manage test variables per environment',
    scheduler: 'Scheduler',
    schedulerDesc: 'Schedule automated test runs',
    parallel: 'Parallel Execution',
    parallelDesc: 'Run scenarios in parallel',
    smokeTest: 'Smoke Test',
    smokeTestDesc: 'Quick health-check test suite',
    stressTest: 'Stress Test',
    stressTestDesc: 'Load and performance testing',
    securityTest: 'Security Test',
    securityTestDesc: 'Scan for security vulnerabilities',
    browserMatrix: 'Browser Matrix',
    browserMatrixDesc: 'Cross-browser compatibility tests',
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const t = i18n
  const locale = 'en-US'
  const [stats, setStats] = useState({ scenarios: 0, executions: 0, successRate: 0, passed: 0, failed: 0, avgDuration: 0 })
  const [analytics, setAnalytics] = useState(null)
  const [recentScenarios, setRecentScenarios] = useState([])
  const [recentExecutions, setRecentExecutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const quickActions = getQuickActionsForRole(user?.role)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [execStatsRes, scenariosRes, recentRes, execHistoryRes, analyticsRes] = await Promise.allSettled([
        executionAPI.getStats(),
        apiClient.get('/scenarios', { params: { skip: 0, take: 1 } }),
        apiClient.get('/search/recent', { params: { limit: 5 } }),
        executionAPI.getHistory(null, 5, 0),
        analyticsAPI.getSummary()
      ])

      if (execStatsRes.status === 'fulfilled') {
        const s = execStatsRes.value.data.stats
        setStats(prev => ({ ...prev, executions: s.total, successRate: s.successRate, passed: s.passed, failed: s.failed, avgDuration: s.averageDuration }))
      }
      if (scenariosRes.status === 'fulfilled') {
        setStats(prev => ({ ...prev, scenarios: scenariosRes.value.data.pagination?.total || 0 }))
      }
      if (recentRes.status === 'fulfilled') {
        setRecentScenarios(recentRes.value.data.scenarios || [])
      }
      if (execHistoryRes.status === 'fulfilled') {
        setRecentExecutions(execHistoryRes.value.data.executions || [])
      }
      if (analyticsRes.status === 'fulfilled') {
        setAnalytics(analyticsRes.value.data)
      }
    } catch (err) {
      console.error('Dashboard load error:', err)
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
    return new Date(date).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
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

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Welcome */}
        <div>
          <h1 className="text-xl font-semibold text-[#E0E0E2]">
            {t.welcome}, <span className="text-[#9BA3F0]">{user?.name || 'User'}</span>
          </h1>
          <p className="text-[#8A8A8F] mt-1 text-sm">
            {t.hereIs}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 rounded-full border-2 border-[rgba(255,255,255,0.08)] border-t-[#5E6AD2] animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="linear-card stat-violet p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#8A8A8F] font-medium uppercase tracking-wider">{t.testScenarios}</p>
                    <p className="text-3xl font-bold text-[#E0E0E2] mt-1">{stats.scenarios}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-[#5E6AD2]/10 flex items-center justify-center">
                    <ClipboardList size={18} className="text-[#9BA3F0]" />
                  </div>
                </div>
              </div>

              <div className="linear-card stat-cyan p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#8A8A8F] font-medium uppercase tracking-wider">{t.totalExecutions}</p>
                    <p className="text-3xl font-bold text-[#E0E0E2] mt-1">{stats.executions}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-[#4EC9B0]/10 flex items-center justify-center">
                    <PlayCircle size={18} className="text-[#4EC9B0]" />
                  </div>
                </div>
              </div>

              <div className="linear-card stat-green p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#8A8A8F] font-medium uppercase tracking-wider">{t.successRate}</p>
                    <p className="text-3xl font-bold text-[#E0E0E2] mt-1">{stats.successRate}%</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-[#34D399]/10 flex items-center justify-center">
                    <CheckCircle2 size={18} className="text-[#34D399]" />
                  </div>
                </div>
              </div>

              <div className="linear-card stat-amber p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#8A8A8F] font-medium uppercase tracking-wider">{t.avgDuration}</p>
                    <p className="text-3xl font-bold text-[#E0E0E2] mt-1">{formatDuration(stats.avgDuration)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-[#FBBF24]/10 flex items-center justify-center">
                    <Clock size={18} className="text-[#FBBF24]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Pass/Fail Summary */}
            {stats.executions > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="linear-card p-5 border-l-2 border-l-[#34D399]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#8A8A8F] uppercase tracking-wider">{t.passed}</p>
                      <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.passed}</p>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-[#34D399]/10 flex items-center justify-center">
                      <Check size={16} className="text-[#34D399]" />
                    </div>
                  </div>
                </div>
                <div className="linear-card p-5 border-l-2 border-l-[#F87171]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#8A8A8F] uppercase tracking-wider">{t.failed}</p>
                      <p className="text-2xl font-bold text-rose-400 mt-1">{stats.failed}</p>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-[#F87171]/10 flex items-center justify-center">
                      <X size={16} className="text-[#F87171]" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions — filtered by role (USER vs ADMIN) */}
            <div className="linear-card p-5">
              <h2 className="text-sm font-semibold text-[#E0E0E2] mb-4">{t.quickActions}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => navigate(action.path)}
                      className="action-btn p-4 text-left"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 rounded-lg ${action.iconBg} flex items-center justify-center`}>
                          <Icon size={15} className={action.iconColor} />
                        </div>
                        <p className="font-medium text-[#E0E0E2] text-sm">{t[action.titleKey]}</p>
                      </div>
                      <p className="text-xs text-[#8A8A8F]">{t[action.descKey]}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Analytics Section */}
            {analytics && (
              <div className="linear-card p-6 border-l-2 border-l-[#9BA3F0]">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#5E6AD2]/10 flex items-center justify-center">
                      <TrendingUp size={18} className="text-[#9BA3F0]" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-[#E0E0E2]">📊 {t.analyticsSummary}</h2>
                      <p className="text-xs text-[#8A8A8F] mt-0.5">{t.last7Days}: {analytics.last7Days?.passRate || 0}% {t.passRate}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExport('json')}
                      disabled={exporting}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#5E6AD2]/10 hover:bg-[#5E6AD2]/20 text-[#9BA3F0] text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <Download size={14} />
                      JSON
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      disabled={exporting}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#4EC9B0]/10 hover:bg-[#4EC9B0]/20 text-[#4EC9B0] text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <Download size={14} />
                      CSV
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-[#8A8A8F] mb-1">Total Executions</p>
                    <p className="text-2xl font-bold text-[#E0E0E2]">{analytics.totalExecutions}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#8A8A8F] mb-1">Pass Rate</p>
                    <p className="text-2xl font-bold text-[#34D399]">{analytics.passRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#8A8A8F] mb-1">Avg Duration</p>
                    <p className="text-2xl font-bold text-[#FBBF24]">{formatDuration(analytics.avgDuration)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#8A8A8F] mb-1">Total Scenarios</p>
                    <p className="text-2xl font-bold text-[#4EC9B0]">{analytics.totalScenarios}</p>
                  </div>
                </div>
              </div>
            )}

            <OpenIssuesWidget />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Recent Scenarios */}
              <div className="linear-card p-5">
                <h2 className="text-sm font-semibold text-[#E0E0E2] mb-4">{t.recentScenarios}</h2>
                {recentScenarios.length === 0 ? (
                  <p className="text-center py-6 text-[#8A8A8F] text-sm">{t.noScenariosYet}</p>
                ) : (
                  <div className="space-y-2">
                    {recentScenarios.map(s => (
                      <div
                        key={s.id}
                        onClick={() => navigate(`/scenarios/${s.id}`)}
                        className="flex items-center justify-between p-3 rounded-md bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] cursor-pointer transition-all border border-transparent hover:border-[rgba(255,255,255,0.08)]"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-[#E0E0E2] text-sm truncate">{s.name}</p>
                          <p className="text-xs text-[#8A8A8F] mt-0.5">{formatDate(s.updatedAt || s.createdAt)}</p>
                        </div>
                        <span className="text-xs text-[#8A8A8F] ml-3 shrink-0 bg-[rgba(255,255,255,0.04)] px-2 py-0.5 rounded">
                          {s._count?.testSteps ?? s.testSteps?.length ?? s.steps ?? 0} {t.steps}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Executions */}
              <div className="linear-card p-5">
                <h2 className="text-sm font-semibold text-[#E0E0E2] mb-4">{t.recentExecutions}</h2>
                {recentExecutions.length === 0 ? (
                  <p className="text-center py-6 text-[#8A8A8F] text-sm">{t.noExecutionsYet}</p>
                ) : (
                  <div className="space-y-2">
                    {recentExecutions.map(e => (
                      <div
                        key={e.id}
                        onClick={() => navigate('/execution')}
                        className="flex items-center justify-between p-3 rounded-md bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] cursor-pointer transition-all border border-transparent hover:border-[rgba(255,255,255,0.08)]"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-[#E0E0E2] text-sm truncate">{e.scenario?.name || 'Scenario'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-[#8A8A8F]">{formatDate(e.startTime)}</p>
                            {e.browser && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs font-medium">
                                🌐 {e.browser}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                          e.status === 'PASSED' ? 'text-[#34D399]' :
                          e.status === 'FAILED' ? 'text-[#F87171]' :
                          'text-[#FBBF24]'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            e.status === 'PASSED' ? 'bg-[#34D399]' :
                            e.status === 'FAILED' ? 'bg-[#F87171]' :
                            'bg-[#FBBF24]'
                          }`} />
                          {e.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
