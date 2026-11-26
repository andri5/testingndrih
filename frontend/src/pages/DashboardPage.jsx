import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Layout from '../components/Layout'
import { executionAPI } from '../services/api'
import apiClient from '../services/api'
import {
  ClipboardList,
  PlayCircle,
  CheckCircle2,
  Check,
  X,
} from 'lucide-react'
import { getQuickActionsForRole } from '../constants/quickActions'
import OnboardingChecklist from '../components/OnboardingChecklist'
import OpenIssuesWidget from '../components/OpenIssuesWidget'
import WelcomeSplashModal from '../components/WelcomeSplashModal'
import ScenarioReminders from '../components/ScenarioReminders'
import { WELCOME_SPLASH_STORAGE_KEY } from '../constants/welcomeSplash'

const i18n = {
  welcome: 'Welcome back',
  hereIs: 'What needs your attention in Manual QA today.',
  testScenarios: 'Cases',
  totalExecutions: 'Runs',
  successRate: 'Success Rate',
  passed: 'Passed',
  failed: 'Failed',
  quickActions: 'Quick Actions',
  createScenario: 'New case',
  startRecording: 'Open Cases and create a blank / template / import',
  testRuns: 'Test Runs',
  testRunsDesc: 'Multi-case cycles per feature',
  bugs: 'Bugs',
  bugsDesc: 'Open and track defects',
  environments: 'Environments',
  environmentsDesc: 'Variables per environment',
  scheduler: 'Scheduler',
  schedulerDesc: 'Schedule automated runs',
  parallel: 'Parallel',
  parallelDesc: 'Run cases in parallel',
  smokeTest: 'Smoke Test',
  smokeTestDesc: 'Quick health-check suite',
  stressTest: 'Stress Test',
  stressTestDesc: 'Load and performance',
  securityTest: 'Security Test',
  securityTestDesc: 'OWASP-oriented scans',
  apiTesting: 'API Testing',
  apiTestingDesc: 'HTTP request tests',
  browserMatrix: 'Browser Test',
  browserMatrixDesc: 'Cross-browser checks',
  recentScenarios: 'Recent Cases',
  recentExecutions: 'Recent runs',
  noScenariosYet: 'No cases yet',
  noExecutionsYet: 'No runs yet',
  steps: 'steps',
  reportsLink: 'Full history & trends → Reports',
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const t = i18n
  const locale = 'en-US'
  const [stats, setStats] = useState({
    scenarios: 0,
    executions: 0,
    successRate: 0,
    passed: 0,
    failed: 0,
  })
  const [recentScenarios, setRecentScenarios] = useState([])
  const [recentExecutions, setRecentExecutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showWelcomeSplash, setShowWelcomeSplash] = useState(false)
  const quickActions = getQuickActionsForRole(user)

  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    if (user?.id && localStorage.getItem(WELCOME_SPLASH_STORAGE_KEY) === user.id) {
      setShowWelcomeSplash(true)
    }
  }, [user?.id])

  const dismissWelcomeSplash = () => {
    localStorage.removeItem(WELCOME_SPLASH_STORAGE_KEY)
    setShowWelcomeSplash(false)
  }

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [execStatsRes, scenariosRes, recentRes, execHistoryRes] = await Promise.allSettled([
        executionAPI.getStats(),
        apiClient.get('/scenarios', { params: { skip: 0, take: 1 } }),
        apiClient.get('/search/recent', { params: { limit: 5 } }),
        executionAPI.getHistory(null, 5, 0),
      ])

      if (execStatsRes.status === 'fulfilled') {
        const s = execStatsRes.value.data.stats
        setStats((prev) => ({
          ...prev,
          executions: s.total,
          successRate: s.successRate,
          passed: s.passed,
          failed: s.failed,
        }))
      }
      if (scenariosRes.status === 'fulfilled') {
        setStats((prev) => ({
          ...prev,
          scenarios: scenariosRes.value.data.pagination?.total || 0,
        }))
      }
      if (recentRes.status === 'fulfilled') {
        setRecentScenarios(recentRes.value.data.scenarios || [])
      }
      if (execHistoryRes.status === 'fulfilled') {
        setRecentExecutions(execHistoryRes.value.data.executions || [])
      }
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Layout>
      {showWelcomeSplash && (
        <WelcomeSplashModal userName={user?.name} onClose={dismissWelcomeSplash} />
      )}
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-xl font-semibold text-ink">
            {t.welcome}, <span className="text-brand">{user?.name || 'User'}</span>
          </h1>
          <p className="text-ink-muted mt-1 text-sm">{t.hereIs}</p>
        </div>

        <ScenarioReminders />

        <OnboardingChecklist />

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 rounded-full border-2 border-surface-border border-t-brand animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="linear-card stat-violet p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-ink-muted font-medium uppercase tracking-wider">
                      {t.testScenarios}
                    </p>
                    <p className="text-3xl font-bold text-ink mt-1">{stats.scenarios}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-brand-soft flex items-center justify-center">
                    <ClipboardList size={18} className="text-brand" />
                  </div>
                </div>
              </div>

              <div className="linear-card stat-cyan p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-ink-muted font-medium uppercase tracking-wider">
                      {t.totalExecutions}
                    </p>
                    <p className="text-3xl font-bold text-ink mt-1">{stats.executions}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                    <PlayCircle size={18} className="text-teal-600" />
                  </div>
                </div>
              </div>

              <div className="linear-card stat-green p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-ink-muted font-medium uppercase tracking-wider">
                      {t.successRate}
                    </p>
                    <p className="text-3xl font-bold text-ink mt-1">{stats.successRate}%</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>

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

            <div className="linear-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h2 className="text-sm font-semibold text-ink">{t.quickActions}</h2>
                <Link to="/reports" className="text-xs font-medium text-brand hover:underline">
                  {t.reportsLink}
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                        <div
                          className={`w-8 h-8 rounded-lg ${action.iconBg} flex items-center justify-center`}
                        >
                          <Icon size={15} className={action.iconColor} />
                        </div>
                        <p className="font-medium text-ink text-sm">{t[action.titleKey]}</p>
                      </div>
                      <p className="text-xs text-ink-muted">{t[action.descKey]}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <OpenIssuesWidget />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="linear-card p-5">
                <h2 className="text-sm font-semibold text-ink mb-4">{t.recentScenarios}</h2>
                {recentScenarios.length === 0 ? (
                  <p className="text-center py-6 text-ink-muted text-sm">{t.noScenariosYet}</p>
                ) : (
                  <div className="space-y-2">
                    {recentScenarios.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => navigate('/scenarios')}
                        className="flex items-center justify-between p-3 rounded-md bg-surface-muted hover:bg-brand-soft/40 cursor-pointer transition-all border border-transparent hover:border-surface-border"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-ink text-sm truncate">{s.name}</p>
                          <p className="text-xs text-ink-muted mt-0.5">
                            {formatDate(s.updatedAt || s.createdAt)}
                          </p>
                        </div>
                        <span className="text-xs text-ink-muted ml-3 shrink-0 bg-white border border-surface-border px-2 py-0.5 rounded">
                          {s._count?.testSteps ?? s.testSteps?.length ?? s.steps ?? 0} {t.steps}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="linear-card p-5">
                <h2 className="text-sm font-semibold text-ink mb-4">{t.recentExecutions}</h2>
                {recentExecutions.length === 0 ? (
                  <p className="text-center py-6 text-ink-muted text-sm">{t.noExecutionsYet}</p>
                ) : (
                  <div className="space-y-2">
                    {recentExecutions.map((e) => (
                      <div
                        key={e.id}
                        onClick={() => navigate('/test-runs')}
                        className="flex items-center justify-between p-3 rounded-md bg-surface-muted hover:bg-brand-soft/40 cursor-pointer transition-all border border-transparent hover:border-surface-border"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-ink text-sm truncate">
                            {e.scenario?.name || 'Case'}
                          </p>
                          <p className="text-xs text-[#8A8A8F] mt-1">{formatDate(e.startTime)}</p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                            e.status === 'PASSED'
                              ? 'text-[#34D399]'
                              : e.status === 'FAILED'
                                ? 'text-[#F87171]'
                                : 'text-[#FBBF24]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              e.status === 'PASSED'
                                ? 'bg-[#34D399]'
                                : e.status === 'FAILED'
                                  ? 'bg-[#F87171]'
                                  : 'bg-[#FBBF24]'
                            }`}
                          />
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
