import { useEffect, useState } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import Layout from '../components/Layout'
import api from '../services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Alert } from '../components/ui'
import { Loader, CheckCircle2, XCircle, Clock } from 'lucide-react'

export default function ParallelExecutionPage() {
  const { theme, language } = useSettingsStore()
  const isDark = theme === 'dark'

  const [scenarios, setScenarios] = useState([])
  const [batches, setBatches] = useState([])
  const [selectedScenarios, setSelectedScenarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)
  const [concurrency, setConcurrency] = useState(3)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const i18n = {
    en: {
      title: 'Parallel Test Execution',
      description: 'Execute multiple scenarios simultaneously for faster testing',
      selectScenarios: 'Select Scenarios',
      concurrency: 'Max Concurrent Executions',
      execute: 'Execute in Parallel',
      cancel: 'Cancel',
      noScenarios: 'No scenarios available',
      selectAll: 'Select All',
      clearAll: 'Clear All',
      recentBatches: 'Recent Execution Batches',
      noBatches: 'No execution batches yet',
      batchId: 'Batch ID',
      status: 'Status',
      passed: 'Passed',
      failed: 'Failed',
      total: 'Total',
      passRate: 'Pass Rate',
      duration: 'Duration',
      completedAt: 'Completed',
      runningBatches: 'Running Batches',
      noRunning: 'No running batches',
      selectAtLeastOne: 'Select at least one scenario',
      executionStarted: 'Parallel execution started',
      loading: 'Loading...',
      executing: 'Executing in parallel...'
    },
    id: {
      title: 'Eksekusi Test Paralel',
      description: 'Jalankan multiple scenarios secara bersamaan untuk testing lebih cepat',
      selectScenarios: 'Pilih Scenarios',
      concurrency: 'Maks Eksekusi Bersamaan',
      execute: 'Jalankan Paralel',
      cancel: 'Batalkan',
      noScenarios: 'Tidak ada scenarios',
      selectAll: 'Pilih Semua',
      clearAll: 'Hapus Semua',
      recentBatches: 'Batch Eksekusi Terbaru',
      noBatches: 'Belum ada batch eksekusi',
      batchId: 'ID Batch',
      status: 'Status',
      passed: 'Berhasil',
      failed: 'Gagal',
      total: 'Total',
      passRate: 'Tingkat Keberhasilan',
      duration: 'Durasi',
      completedAt: 'Selesai',
      runningBatches: 'Batch Berjalan',
      noRunning: 'Tidak ada batch yang berjalan',
      selectAtLeastOne: 'Pilih minimal satu scenario',
      executionStarted: 'Eksekusi paralel dimulai',
      loading: 'Memuat...',
      executing: 'Mengeksekusi paralel...'
    }
  }

  const t = i18n[language] || i18n.en

  useEffect(() => {
    loadScenarios()
    loadBatches()
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

  const loadBatches = async () => {
    try {
      const res = await api.get('/parallel/batches')
      setBatches(res.data.batches || [])
    } catch (err) {
      console.error('Failed to load batches:', err)
    }
  }

  const handleExecute = async () => {
    if (selectedScenarios.length === 0) {
      setError(t.selectAtLeastOne)
      return
    }

    try {
      setExecuting(true)
      setError(null)
      const res = await api.post('/parallel/execute', {
        scenarioIds: selectedScenarios,
        concurrencyLimit: concurrency,
        timeout: 600000
      })
      setSuccess(t.executionStarted)
      setBatches([{ ...res.data, executions: res.data.executions }, ...batches])
      setSelectedScenarios([])
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start execution')
    } finally {
      setExecuting(false)
    }
  }

  const toggleScenario = (scenarioId) => {
    setSelectedScenarios(prev =>
      prev.includes(scenarioId)
        ? prev.filter(id => id !== scenarioId)
        : [...prev, scenarioId]
    )
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'PARTIAL_FAILURE':
        return <Clock className="w-5 h-5 text-yellow-500" />
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

        {/* Selection Panel */}
        <Card className={`mb-6 border ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
          <CardHeader>
            <CardTitle>{t.selectScenarios}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Scenario Selection */}
            {loading ? (
              <div className="text-center py-8">
                <Loader className={`w-6 h-6 mx-auto animate-spin ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
            ) : scenarios.length === 0 ? (
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{t.noScenarios}</p>
            ) : (
              <>
                <div className="flex gap-2 justify-between">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setSelectedScenarios(scenarios.map(s => s.id))}
                      className={isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}
                    >
                      {t.selectAll}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setSelectedScenarios([])}
                      className={isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}
                    >
                      {t.clearAll}
                    </Button>
                  </div>
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {selectedScenarios.length} / {scenarios.length} selected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-h-96 overflow-y-auto">
                  {scenarios.map(scenario => (
                    <label
                      key={scenario.id}
                      className={`flex items-center p-3 rounded border cursor-pointer transition ${
                        selectedScenarios.includes(scenario.id)
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
                        checked={selectedScenarios.includes(scenario.id)}
                        onChange={() => toggleScenario(scenario.id)}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className={`ml-3 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {scenario.name}
                      </span>
                    </label>
                  ))}
                </div>
              </>
            )}

            {/* Settings */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {t.concurrency}
              </label>
              <select
                value={concurrency}
                onChange={(e) => setConcurrency(parseInt(e.target.value))}
                className={`w-full md:w-32 px-3 py-2 rounded border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
              >
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {/* Execute Button */}
            <Button
              onClick={handleExecute}
              disabled={executing || selectedScenarios.length === 0}
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

        {/* Recent Batches */}
        <div>
          <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t.recentBatches}
          </h2>

          {batches.length === 0 ? (
            <Card className={`border ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
              <CardContent className="text-center py-12">
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  {t.noBatches}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {batches.map(batch => (
                <Card key={batch.id} className={`border ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(batch.status)}
                        <div>
                          <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {t.batchId}
                          </p>
                          <p className={`font-mono text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {batch.id.substring(0, 12)}...
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(batch.status)}`}>
                        {batch.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
                      <div>
                        <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {t.total}
                        </p>
                        <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {batch.scenarioCount}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {t.passed}
                        </p>
                        <p className="text-lg font-bold text-green-500">
                          {batch.successCount || 0}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {t.failed}
                        </p>
                        <p className="text-lg font-bold text-red-500">
                          {batch.failureCount || 0}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {t.passRate}
                        </p>
                        <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {batch.scenarioCount > 0
                            ? ((batch.successCount / batch.scenarioCount) * 100).toFixed(1)
                            : 0}%
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {t.completedAt}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {batch.completedAt
                            ? new Date(batch.completedAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US')
                            : '—'}
                        </p>
                      </div>
                    </div>
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
