import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Card, Spinner } from '../components/ui'
import Layout from '../components/Layout'
import QaseIntegrationCard from '../components/QaseIntegrationCard'
import { executionAPI, scenarioAPI } from '../services/api'
import apiClient from '../services/api'

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [stats, setStats] = useState({ scenarios: 0, executions: 0, successRate: 0, passed: 0, failed: 0, avgDuration: 0 })
  const [recentScenarios, setRecentScenarios] = useState([])
  const [recentExecutions, setRecentExecutions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [execStatsRes, scenariosRes, recentRes, execHistoryRes] = await Promise.allSettled([
        executionAPI.getStats(),
        apiClient.get('/scenarios', { params: { skip: 0, take: 1 } }),
        apiClient.get('/search/recent', { params: { limit: 5 } }),
        executionAPI.getHistory(null, 5, 0)
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
    return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user?.name || 'User'}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your test scenarios and automations
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <div className="text-center">
                  <div className="text-4xl font-bold text-indigo-600">{stats.scenarios}</div>
                  <p className="text-gray-600 mt-2">Test Scenarios</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600">{stats.executions}</div>
                  <p className="text-gray-600 mt-2">Total Executions</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">{stats.successRate}%</div>
                  <p className="text-gray-600 mt-2">Success Rate</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-600">{formatDuration(stats.avgDuration)}</div>
                  <p className="text-gray-600 mt-2">Avg Duration</p>
                </div>
              </Card>
            </div>

            {/* Pass/Fail Summary */}
            {stats.executions > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-l-4 border-l-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Passed</p>
                      <p className="text-2xl font-bold text-green-600">{stats.passed}</p>
                    </div>
                    <span className="text-3xl">✅</span>
                  </div>
                </Card>
                <Card className="border-l-4 border-l-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Failed</p>
                      <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                    </div>
                    <span className="text-3xl">❌</span>
                  </div>
                </Card>
              </div>
            )}

            {/* Quick Actions */}
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => navigate('/scenarios')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition text-left"
                >
                  <p className="font-semibold text-gray-900">+ Create Scenario</p>
                  <p className="text-sm text-gray-600 mt-1">Start recording a new test</p>
                </button>
                <button
                  onClick={() => navigate('/execution')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition text-left"
                >
                  <p className="font-semibold text-gray-900">▶️ Run Execution</p>
                  <p className="text-sm text-gray-600 mt-1">Execute a test scenario</p>
                </button>
                <button
                  onClick={() => navigate('/import')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
                >
                  <p className="font-semibold text-gray-900">📥 Import Scenarios</p>
                  <p className="text-sm text-gray-600 mt-1">Import from CSV or template</p>
                </button>
              </div>
            </Card>

            {/* Qase.io Integration */}
            <QaseIntegrationCard />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Scenarios */}
              <Card>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Scenarios</h2>
                {recentScenarios.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">No scenarios yet</p>
                ) : (
                  <div className="space-y-3">
                    {recentScenarios.map(s => (
                      <div
                        key={s.id}
                        onClick={() => navigate(`/scenarios/${s.id}`)}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 cursor-pointer transition"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{s.name}</p>
                          <p className="text-xs text-gray-500">{formatDate(s.updatedAt || s.createdAt)}</p>
                        </div>
                        <span className="text-sm text-gray-400 ml-2">{s._count?.testSteps ?? s.testSteps?.length ?? 0} steps</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Recent Executions */}
              <Card>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Executions</h2>
                {recentExecutions.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">No executions yet</p>
                ) : (
                  <div className="space-y-3">
                    {recentExecutions.map(e => (
                      <div
                        key={e.id}
                        onClick={() => navigate('/execution')}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 cursor-pointer transition"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{e.scenario?.name || 'Scenario'}</p>
                          <p className="text-xs text-gray-500">{formatDate(e.startTime)}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          e.status === 'PASSED' ? 'bg-green-100 text-green-700' :
                          e.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{e.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
