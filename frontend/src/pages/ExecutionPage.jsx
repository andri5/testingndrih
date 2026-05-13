import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { Card, Button, Badge, Spinner, Alert } from '../components/ui'
import StepErrorDetail from '../components/StepErrorDetail'
import { useExecutionStore } from '../store/executionStore'
import { useScenarioStore } from '../store/scenarioStore'
import { ExecuteScenarioButton } from '../components/ExecuteScenarioButton'
import { PlayCircle, CheckCircle2, XCircle, TrendingUp, ClipboardList, Clock } from 'lucide-react'
import { useSettingsStore } from '../store/settingsStore'

const i18n = {
  en: {
    title: 'Test Execution',
    subtitle: 'Run and monitor test scenarios',
    runScenario: 'Run Scenario',
    selectScenario: 'Select Scenario',
    selectScenarioPlaceholder: 'Choose a scenario...',
    status: 'Status',
    action: 'Action',
    selectScenarioFirst: '← Select a scenario first',
    viewScreenshot: 'View screenshot',
    executionHistory: 'Execution History',
    scenario: 'Scenario',
    steps: 'Steps (P/F)',
    duration: 'Duration',
    date: 'Date',
    totalExecutions: 'TOTAL EXECUTIONS',
    passed: 'PASSED',
    failed: 'FAILED',
    successRate: 'SUCCESS RATE',
    view: 'View',
    html: 'HTML',
    pdf: 'PDF',
    export: 'Export',
  },
  id: {
    title: 'Eksekusi Pengujian',
    subtitle: 'Jalankan dan pantau skenario pengujian',
    runScenario: 'Jalankan Skenario',
    selectScenario: 'Pilih Skenario',
    selectScenarioPlaceholder: 'Pilih skenario...',
    status: 'Status',
    action: 'Aksi',
    selectScenarioFirst: '← Pilih scenario terlebih dahulu',
    viewScreenshot: 'Lihat screenshot',
    executionHistory: 'Riwayat Eksekusi',
    scenario: 'Skenario',
    steps: 'Langkah (B/G)',
    duration: 'Durasi',
    date: 'Tanggal',
    totalExecutions: 'TOTAL EKSEKUSI',
    passed: 'LULUS',
    failed: 'GAGAL',
    successRate: 'TINGKAT KEBERHASILAN',
    view: 'Lihat',
    html: 'HTML',
    pdf: 'PDF',
    export: 'Ekspor',
  },
}

export default function ExecutionPage() {
  const navigate = useNavigate()
  const { language } = useSettingsStore()
  const t = i18n[language] || i18n.id
  const [selectedScenarioId, setSelectedScenarioId] = useState(null)
  const [selectedScenarioName, setSelectedScenarioName] = useState('')
  const [screenshotModal, setScreenshotModal] = useState(null)
  
  const {
    executions,
    currentExecution,
    isRunning,
    isLoading,
    error,
    stats,
    pagination,
    fetchExecutions,
    fetchExecutionStats,
    getExecutionDetails,
    clearError,
    executeScenario
  } = useExecutionStore()

  const { scenarios, fetchScenarios } = useScenarioStore()

  // Load executions and scenarios on mount
  useEffect(() => {
    fetchExecutions()
    fetchExecutionStats()
    fetchScenarios()
  }, [])

  // Refresh executions when execution completes
  useEffect(() => {
    if (!isRunning && currentExecution) {
      const timer = setTimeout(() => {
        fetchExecutions()
        fetchExecutionStats()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isRunning, currentExecution])

  const handleViewDetails = async (executionId) => {
    try {
      await getExecutionDetails(executionId)
    } catch (err) {
      console.error('Failed to load execution details')
    }
  }

  const handleExportReport = async (executionId, format) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/executions/${executionId}/export?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Export failed')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `execution-report-${executionId}.${format}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
      alert('Export failed: ' + err.message)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PASSED':
        return 'success'
      case 'FAILED':
        return 'danger'
      case 'RUNNING':
        return 'primary'
      case 'PENDING':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PASSED':
        return '✓'
      case 'FAILED':
        return '✗'
      case 'RUNNING':
        return '⏳'
      case 'PENDING':
        return '⟳'
      default:
        return '−'
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#E0E0E2]">{t.title}</h1>
          <p className="text-[#A0A0A4] mt-2">
            {t.subtitle}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={clearError}
          />
        )}

        {/* Execution Control Panel */}
        <Card>
          <h2 className="text-lg sm:text-xl font-bold text-[#E0E0E2] mb-4">{t.runScenario}</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {/* Scenario Selector */}
            <div>
              <label className="block text-sm font-semibold text-[#A0A0A4] mb-2">
                {t.selectScenario}
              </label>
              <select
                value={selectedScenarioId || ''}
                onChange={(e) => {
                  const scenarioId = e.target.value
                  const scenario = scenarios.find(s => s.id === scenarioId)
                  setSelectedScenarioId(scenarioId)
                  setSelectedScenarioName(scenario?.name || '')
                }}
                className="w-full px-3 py-2 bg-[#161618] border border-[#2D2D2F] text-[#E0E0E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]"
              >
                <option value="" className="bg-[#161618]">{t.selectScenarioPlaceholder}</option>
                {scenarios && scenarios.map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenario.name} ({scenario.steps || 0} steps)
                  </option>
                ))}
              </select>
            </div>

            {/* Status Info */}
            <div>
              <label className="block text-sm font-semibold text-[#A0A0A4] mb-2">
                {t.status}
              </label>
              <div className="px-3 py-2 bg-[#1A1A1C] rounded-lg">
                {isRunning ? (
                  <div className="flex items-center gap-2 text-blue-400">
                    <Spinner size="sm" />
                    <span>Running...</span>
                  </div>
                ) : (
                  <span className="text-[#A0A0A4]">Ready</span>
                )}
              </div>
            </div>

            {/* Execute Button */}
            <div>
              <label className="block text-sm font-semibold text-[#A0A0A4] mb-2">
                {t.action}
              </label>
              {selectedScenarioId ? (
                <ExecuteScenarioButton 
                  scenarioId={selectedScenarioId}
                  scenarioName={selectedScenarioName}
                  onExecutionStart={() => {
                    // Refresh executions and stats after execution starts
                    setTimeout(() => {
                      fetchExecutions()
                      fetchExecutionStats()
                    }, 2000)
                  }}
                />
              ) : (
                <div className="w-full px-3.5 py-2 text-sm font-medium rounded-md border border-dashed border-[#3D3D40] text-[#8A8A8F] bg-[#161618] text-center select-none">
                  {t.selectScenarioFirst}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        {Object.keys(stats).length > 0 && (
          <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="linear-card p-5">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#5E6AD2]/10 flex items-center justify-center shrink-0">
                  <PlayCircle size={18} className="text-[#9BA3F0]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#E0E0E2] leading-none">{stats.total || 0}</p>
                  <p className="text-xs text-[#8A8A8F] mt-1.5 font-medium uppercase tracking-wider">{t.totalExecutions}</p>
                </div>
              </div>
            </div>
            <div className="linear-card p-5">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#34D399]/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={18} className="text-[#34D399]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#E0E0E2] leading-none">{stats.passed || 0}</p>
                  <p className="text-xs text-[#8A8A8F] mt-1.5 font-medium uppercase tracking-wider">{t.passed}</p>
                </div>
              </div>
            </div>
            <div className="linear-card p-5">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#F87171]/10 flex items-center justify-center shrink-0">
                  <XCircle size={18} className="text-[#F87171]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#E0E0E2] leading-none">{stats.failed || 0}</p>
                  <p className="text-xs text-[#8A8A8F] mt-1.5 font-medium uppercase tracking-wider">{t.failed}</p>
                </div>
              </div>
            </div>
            <div className="linear-card p-5">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#FBBF24]/10 flex items-center justify-center shrink-0">
                  <TrendingUp size={18} className="text-[#FBBF24]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#E0E0E2] leading-none">{stats.successRate || 0}%</p>
                  <p className="text-xs text-[#8A8A8F] mt-1.5 font-medium uppercase tracking-wider">{t.successRate}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Current Execution Status */}
        {currentExecution && (
          <Card>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-[#E0E0E2]">
                    {currentExecution.scenario?.name}
                  </h2>
                  <Badge variant={getStatusColor(currentExecution.status)}>
                    {getStatusIcon(currentExecution.status)} {currentExecution.status}
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#161618] border border-[#2A2A2D]">
                    <div className="w-8 h-8 rounded-lg bg-[#34D399]/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={15} className="text-[#34D399]" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-[#E0E0E2] leading-none">{currentExecution.passedSteps || 0}</p>
                      <p className="text-xs text-[#8A8A8F] mt-1 uppercase tracking-wider">Passed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#161618] border border-[#2A2A2D]">
                    <div className="w-8 h-8 rounded-lg bg-[#F87171]/10 flex items-center justify-center shrink-0">
                      <XCircle size={15} className="text-[#F87171]" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-[#E0E0E2] leading-none">{currentExecution.failedSteps || 0}</p>
                      <p className="text-xs text-[#8A8A8F] mt-1 uppercase tracking-wider">Failed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#161618] border border-[#2A2A2D]">
                    <div className="w-8 h-8 rounded-lg bg-[#5E6AD2]/10 flex items-center justify-center shrink-0">
                      <ClipboardList size={15} className="text-[#9BA3F0]" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-[#E0E0E2] leading-none">{currentExecution.totalSteps || 0}</p>
                      <p className="text-xs text-[#8A8A8F] mt-1 uppercase tracking-wider">Total</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#161618] border border-[#2A2A2D]">
                    <div className="w-8 h-8 rounded-lg bg-[#FBBF24]/10 flex items-center justify-center shrink-0">
                      <Clock size={15} className="text-[#FBBF24]" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-[#E0E0E2] leading-none">{currentExecution.duration ? `${(currentExecution.duration / 1000).toFixed(2)}s` : '−'}</p>
                      <p className="text-xs text-[#8A8A8F] mt-1 uppercase tracking-wider">Duration</p>
                    </div>
                  </div>
                </div>

                {currentExecution.errorMessage && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    <strong>Error:</strong>
                    <StepErrorDetail errorMessage={currentExecution.errorMessage} size="small" />
                  </div>
                )}

                {currentExecution.startTime && (
                  <div className="mt-4 text-sm text-[#888]">
                    Started: {new Date(currentExecution.startTime).toLocaleString()}
                    {currentExecution.endTime && (
                      <> • Ended: {new Date(currentExecution.endTime).toLocaleString()}</>
                    )}
                    {currentExecution.browser && (
                      <> • Browser: <span className="font-mono">{currentExecution.browser}</span></>
                    )}
                  </div>
                )}

                {/* Video Recording */}
                {currentExecution.videoPath && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-[#E0E0E2] mb-2">📹 Execution Video</h3>
                    <video
                      controls
                      className="w-full max-w-2xl rounded border border-gray-200"
                      src={`http://localhost:5001${currentExecution.videoPath}`}
                    >
                      Your browser does not support video playback.
                    </video>
                  </div>
                )}

                {/* Per-Step Results */}
                {currentExecution.stepResults && currentExecution.stepResults.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-[#E0E0E2] mb-2">Detail Per-Step</h3>
                    <div className="space-y-2">
                      {currentExecution.stepResults.map((result, idx) => (
                        <div
                          key={result.id || idx}
                          className={`flex items-center gap-3 p-2 rounded border ${
                            result.status === 'PASSED'
                              ? 'bg-green-900/20 border-green-700/30'
                              : 'bg-red-900/20 border-red-700/30'
                          }`}
                        >
                          <span className={`text-sm ${result.status === 'PASSED' ? 'text-green-600' : 'text-red-600'}`}>
                            {result.status === 'PASSED' ? '✓' : '✗'}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-[#E0E0E2] truncate">
                              Step {result.testStep?.stepNumber || idx + 1}: {result.testStep?.type || ''} — {result.testStep?.description || '-'}
                            </p>
                            {result.testStep?.selector && (
                              <p className="text-xs text-[#666] truncate font-mono">Selector: {result.testStep.selector}</p>
                            )}
                            {result.errorMessage && (
                              <StepErrorDetail errorMessage={result.errorMessage} size="small" />
                            )}
                          </div>
                          {result.screenshot && (
                            <button
                              onClick={() => setScreenshotModal({
                                url: result.screenshot.url,
                                stepNumber: result.testStep?.stepNumber || idx + 1,
                                description: result.testStep?.description || ''
                              })}
                              className="flex-shrink-0 border-2 border-gray-300 rounded overflow-hidden hover:border-indigo-500 transition cursor-pointer"
                              title={t.viewScreenshot}
                            >
                              <img
                                src={result.screenshot.url}
                                alt={`Step ${result.testStep?.stepNumber || idx + 1}`}
                                className="w-20 h-14 object-cover"
                              />
                            </button>
                          )}
                          <span className="text-xs text-gray-500">
                            {result.duration ? `${result.duration}ms` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isRunning && (
                <Spinner size="lg" />
              )}
            </div>
          </Card>
        )}

        {/* Execution History */}
        <Card>
          <h2 className="text-xl font-bold text-[#E0E0E2] mb-4\">{t.executionHistory}</h2>

          {isLoading && executions.length === 0 ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : executions.length === 0 ? (
            <div className="text-center py-8 text-[#888]">
              <p>No executions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2D2D2F]">
                    <th className="text-left py-3 px-4 font-semibold text-[#A0A0A4]">
                      {t.scenario}
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-[#A0A0A4]">
                      {t.status}
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-[#A0A0A4]">
                      {t.steps}
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-[#A0A0A4]">
                      {t.duration}
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-[#A0A0A4]">
                      {t.date}
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-[#A0A0A4]">
                      {t.action}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {executions.map((execution) => (
                    <tr
                      key={execution.id}
                      className="border-b border-[#2D2D2F] hover:bg-[#1A1A1C] transition"
                    >
                      <td className="py-3 px-4 text-[#E0E0E2]">
                        {execution.scenario?.name}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusColor(execution.status)}>
                          {getStatusIcon(execution.status)} {execution.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center text-sm">
                        <span className="text-green-600 font-semibold">
                          {execution.passedSteps}
                        </span>
                        {' / '}
                        <span className="text-red-600 font-semibold">
                          {execution.failedSteps}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-[#A0A0A4]">
                        {execution.duration
                          ? `${(execution.duration / 1000).toFixed(2)}s`
                          : '−'}
                      </td>
                      <td className="py-3 px-4 text-sm text-[#A0A0A4]">
                        {new Date(execution.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => handleViewDetails(execution.id)}
                            title="View execution details"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold
                              bg-[#5E6AD2] hover:bg-[#6B78E0] text-white
                              dark:bg-[#5E6AD2] dark:hover:bg-[#6B78E0] dark:text-white
                              transition-colors cursor-pointer select-none"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            {t.view}
                          </button>
                          <button
                            onClick={() => handleExportReport(execution.id, 'html')}
                            title="Download HTML report"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold
                              bg-amber-500 hover:bg-amber-600 text-white
                              dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-white
                              transition-colors cursor-pointer select-none"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            {t.html}
                          </button>
                          <button
                            onClick={() => handleExportReport(execution.id, 'pdf')}
                            title="Download PDF report"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold
                              bg-red-500 hover:bg-red-600 text-white
                              dark:bg-red-500 dark:hover:bg-red-600 dark:text-white
                              transition-colors cursor-pointer select-none"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            {t.pdf}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.hasMore && (
            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                onClick={() =>
                  fetchExecutions(null, pagination.limit, pagination.offset + pagination.limit)
                }
                disabled={isLoading}
              >
                Load More
              </Button>
            </div>
          )}
        </Card>

        {/* Screenshot Modal */}
        {screenshotModal && (
          <div
            className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4"
            onClick={() => setScreenshotModal(null)}
          >
            <div
              className="bg-[#1A1A1C] border border-[#2D2D2F] rounded-lg max-w-5xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-[#2D2D2F]">
                <h3 className="text-lg font-semibold text-[#E0E0E2]">
                  📸 Step {screenshotModal.stepNumber}: {screenshotModal.description}
                </h3>
                <button
                  onClick={() => setScreenshotModal(null)}
                  className="text-[#666] hover:text-[#E0E0E2] text-2xl leading-none"
                >
                  ✕
                </button>
              </div>
              <div className="p-4">
                <img
                  src={screenshotModal.url}
                  alt={`Screenshot step ${screenshotModal.stepNumber}`}
                  className="w-full rounded-lg border border-[#2D2D2F]"
                />
              </div>
              <div className="flex justify-end p-4 border-t border-[#2D2D2F]">
                <a
                  href={screenshotModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#5E6AD2] hover:text-[#6B7AE8] text-sm font-medium mr-4"
                >
                  Buka di tab baru ↗
                </a>
                <Button variant="secondary" onClick={() => setScreenshotModal(null)}>
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
