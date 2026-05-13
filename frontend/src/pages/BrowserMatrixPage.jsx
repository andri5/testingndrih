import { useEffect, useState } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import Layout from '../components/Layout'
import api from '../services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Alert } from '../components/ui'
import { Loader, CheckCircle2, XCircle } from 'lucide-react'

const BROWSERS = [
  { id: 'chromium', name: 'Chromium', icon: '⚙️' },
  { id: 'firefox', name: 'Firefox', icon: '🦊' },
  { id: 'webkit', name: 'WebKit (Safari)', icon: '🧪' },
  { id: 'edge', name: 'Edge', icon: '🌐' }
]

export default function BrowserMatrixPage() {
  const { theme, language } = useSettingsStore()
  const isDark = theme === 'dark'

  const [scenarios, setScenarios] = useState([])
  const [selectedScenario, setSelectedScenario] = useState('')
  const [selectedBrowsers, setSelectedBrowsers] = useState(['chromium', 'firefox', 'webkit'])
  const [executions, setExecutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)
  const [concurrency, setConcurrency] = useState(2)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const i18n = {
    en: {
      title: 'Browser Matrix Testing',
      description: 'Test your scenarios across multiple browsers for compatibility',
      selectScenario: 'Select Scenario',
      selectBrowsers: 'Select Browsers',
      concurrency: 'Max Concurrent',
      execute: 'Run Matrix Test',
      noScenarios: 'No scenarios available',
      selectAtLeastOne: 'Select at least one browser',
      executionStarted: 'Matrix execution started',
      loading: 'Loading...',
      executing: 'Running cross-browser tests...',
      recentTests: 'Recent Matrix Tests',
      noTests: 'No matrix tests yet',
      scenario: 'Scenario',
      browsers: 'Browsers',
      status: 'Status',
      passRate: 'Pass Rate',
      duration: 'Duration',
      completedAt: 'Completed',
      details: 'Details',
      chromium: 'Chromium',
      firefox: 'Firefox',
      webkit: 'WebKit',
      edge: 'Edge',
      compatible: 'Fully Compatible',
      partialCompatible: 'Partially Compatible',
      incompatible: 'Incompatible',
      averagePassRate: 'Average Pass Rate'
    },
    id: {
      title: 'Pengujian Browser Matrix',
      description: 'Test scenarios Anda di berbagai browser untuk kompatibilitas',
      selectScenario: 'Pilih Scenario',
      selectBrowsers: 'Pilih Browser',
      concurrency: 'Maks Bersamaan',
      execute: 'Jalankan Matrix Test',
      noScenarios: 'Tidak ada scenarios',
      selectAtLeastOne: 'Pilih minimal satu browser',
      executionStarted: 'Eksekusi matrix dimulai',
      loading: 'Memuat...',
      executing: 'Menjalankan test cross-browser...',
      recentTests: 'Matrix Tests Terbaru',
      noTests: 'Belum ada matrix tests',
      scenario: 'Scenario',
      browsers: 'Browser',
      status: 'Status',
      passRate: 'Tingkat Keberhasilan',
      duration: 'Durasi',
      completedAt: 'Selesai',
      details: 'Detail',
      chromium: 'Chromium',
      firefox: 'Firefox',
      webkit: 'WebKit',
      edge: 'Edge',
      compatible: 'Sepenuhnya Kompatibel',
      partialCompatible: 'Sebagian Kompatibel',
      incompatible: 'Tidak Kompatibel',
      averagePassRate: 'Tingkat Keberhasilan Rata-rata'
    }
  }

  const t = i18n[language] || i18n.id

  useEffect(() => {
    loadScenarios()
    loadExecutions()
  }, [])

  const loadScenarios = async () => {
    try {
      setLoading(true)
      const res = await api.get('/scenarios')
      setScenarios(res.data.scenarios || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load scenarios')
    } finally {
      setLoading(false)
    }
  }

  const loadExecutions = async () => {
    try {
      const res = await api.get('/browser-matrix/executions')
      setExecutions(res.data.executions || [])
    } catch (err) {
      console.error('Failed to load executions:', err)
    }
  }

  const handleExecute = async () => {
    if (!selectedScenario) {
      setError('Select a scenario')
      return
    }
    if (selectedBrowsers.length === 0) {
      setError(t.selectAtLeastOne)
      return
    }

    try {
      setExecuting(true)
      setError(null)
      const res = await api.post('/browser-matrix/execute', {
        scenarioId: selectedScenario,
        browsers: selectedBrowsers,
        concurrency
      })
      setSuccess(t.executionStarted)
      setExecutions([{ ...res.data, scenario: scenarios.find(s => s.id === selectedScenario) }, ...executions])
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start execution')
    } finally {
      setExecuting(false)
    }
  }

  const toggleBrowser = (browserId) => {
    setSelectedBrowsers(prev =>
      prev.includes(browserId)
        ? prev.filter(id => id !== browserId)
        : [...prev, browserId]
    )
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'PARTIAL_FAILURE':
        return <CheckCircle2 className="w-5 h-5 text-yellow-500" />
      case 'RUNNING':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUCCESS':
        return isDark ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-900'
      case 'PARTIAL_FAILURE':
        return isDark ? 'bg-yellow-900 text-yellow-100' : 'bg-yellow-100 text-yellow-900'
      case 'RUNNING':
        return isDark ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-900'
      case 'FAILED':
        return isDark ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-900'
      default:
        return isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-200 text-gray-900'
    }
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t.title}
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {t.description}
          </p>
        </div>

        {/* Alerts */}
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        {/* Configuration Panel */}
        <Card className={`mb-6 border ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Scenario Selection */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {t.selectScenario}
              </label>
              <select
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
              >
                <option value="">-- Select a scenario --</option>
                {scenarios.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Browser Selection */}
            <div>
              <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {t.selectBrowsers}
              </label>
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                {BROWSERS.map(browser => (
                  <label
                    key={browser.id}
                    className={`flex items-center p-3 rounded border cursor-pointer transition ${
                      selectedBrowsers.includes(browser.id)
                        ? isDark
                          ? 'border-blue-500 bg-blue-900/20'
                          : 'border-blue-500 bg-blue-50'
                        : isDark
                          ? 'border-gray-700 hover:border-gray-600'
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedBrowsers.includes(browser.id)}
                      onChange={() => toggleBrowser(browser.id)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className={`ml-2 text-lg mr-1`}>{browser.icon}</span>
                    <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {browser.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Concurrency Setting */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {t.concurrency}
              </label>
              <select
                value={concurrency}
                onChange={(e) => setConcurrency(parseInt(e.target.value))}
                className={`w-full md:w-32 px-3 py-2 rounded border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
              >
                {[1, 2, 3, 4].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {/* Execute Button */}
            <Button
              onClick={handleExecute}
              disabled={executing || !selectedScenario || selectedBrowsers.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2"
            >
              {executing ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  {t.executing}
                </>
              ) : (
                t.execute
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Executions */}
        <div>
          <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t.recentTests}
          </h2>

          {executions.length === 0 ? (
            <Card className={`border ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
              <CardContent className="text-center py-12">
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  {t.noTests}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {executions.map(execution => (
                <Card key={execution.id} className={`border ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(execution.status)}
                        <div>
                          <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {execution.scenario?.name || 'Unknown'}
                          </p>
                          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            {execution.id.substring(0, 12)}...
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(execution.status)}`}>
                        {execution.status}
                      </span>
                    </div>

                    {/* Browser Results Summary */}
                    <div className="mb-4 pb-4 border-b border-gray-700/30">
                      <p className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t.browsers}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {execution.browsers?.map(browser => (
                          <span
                            key={browser}
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              isDark
                                ? 'bg-gray-800 text-gray-300'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {BROWSERS.find(b => b.id === browser)?.name || browser}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Compatibility Matrix */}
                    {execution.results?.summary && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                        <div>
                          <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Compatibility
                          </p>
                          <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {execution.results.summary.fullyCrossCompatible
                              ? t.compatible
                              : execution.results.summary.partiallyCompatible
                                ? t.partialCompatible
                                : t.incompatible}
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {t.averagePassRate}
                          </p>
                          <p className="text-sm font-semibold text-blue-500">
                            {execution.results.summary.averagePassRate}%
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {t.completedAt}
                          </p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {execution.completedAt
                              ? new Date(execution.completedAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US')
                              : '—'}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
