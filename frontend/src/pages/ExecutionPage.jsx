import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { Card, Button, Badge, Spinner, Alert } from '../components/ui'
import StepErrorDetail from '../components/StepErrorDetail'
import { useExecutionStore } from '../store/executionStore'
import { useScenarioStore } from '../store/scenarioStore'
import ExportFormatButton from '../components/ExportFormatButton'
import StepResultCard, { StepResultsSummary } from '../components/StepResultCard'
import { ExecuteScenarioButton } from '../components/ExecuteScenarioButton'
import SoftSelect from '../components/SoftSelect'
import ExecutionRunDiff from '../components/ExecutionRunDiff'
import { PlayCircle, CheckCircle2, XCircle, TrendingUp, ClipboardList, Clock, Eye, ListTree, GitCompare } from 'lucide-react'

const i18n = {
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
    exportHTML: 'Export HTML',
    exportPDF: 'Export PDF',
    compareRuns: 'Compare Runs',
    compareSelected: 'Compare Selected',
    selectTwoRuns: 'Select 2 runs to compare',
  
}

export default function ExecutionPage() {
  const navigate = useNavigate()
  const t = i18n
  const [selectedScenarioId, setSelectedScenarioId] = useState(null)
  const [selectedScenarioName, setSelectedScenarioName] = useState('')
  const [screenshotModal, setScreenshotModal] = useState(null)
  const [compareIds, setCompareIds] = useState([])
  const [diffPair, setDiffPair] = useState(null)
  
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
    fetchScenarios(0, 100)
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

  const scenarioOptions = [
    { value: '', label: t.selectScenarioPlaceholder },
    ...(scenarios || []).map((scenario) => ({
      value: scenario.id,
      label: `${scenario.name} (${scenario.stepCount ?? scenario.steps ?? 0} steps)`,
    })),
  ]

  const handleScenarioSelect = (scenarioId) => {
    if (!scenarioId) {
      setSelectedScenarioId(null)
      setSelectedScenarioName('')
      return
    }
    const scenario = scenarios.find((s) => s.id === scenarioId)
    setSelectedScenarioId(scenarioId)
    setSelectedScenarioName(scenario?.name || '')
  }

  const toggleCompareSelection = (executionId) => {
    setCompareIds((prev) => {
      if (prev.includes(executionId)) {
        return prev.filter((id) => id !== executionId)
      }
      if (prev.length >= 2) {
        return [prev[1], executionId]
      }
      return [...prev, executionId]
    })
  }

  const handleCompareSelected = () => {
    if (compareIds.length !== 2) return
    const a = executions.find((e) => e.id === compareIds[0])
    const b = executions.find((e) => e.id === compareIds[1])
    if (a && b) setDiffPair([a, b])
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
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">{t.runScenario}</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {/* Scenario Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-2">
                {t.selectScenario}
              </label>
              <SoftSelect
                value={selectedScenarioId || ''}
                onChange={handleScenarioSelect}
                options={scenarioOptions}
                placeholder={t.selectScenarioPlaceholder}
                className="w-full"
              />
            </div>

            {/* Status Info */}
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-2">
                {t.status}
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg min-h-[42px] flex items-center">
                {isRunning ? (
                  <div className="flex items-center gap-2 text-[#5E6AD2] text-sm font-medium">
                    <Spinner size="sm" />
                    <span>Running...</span>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Ready
                  </span>
                )}
              </div>
            </div>

            {/* Execute Button */}
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-2">
                {t.action}
              </label>
              {selectedScenarioId ? (
                <ExecuteScenarioButton 
                  scenarioId={selectedScenarioId}
                  scenarioName={selectedScenarioName}
                  onExecutionStart={() => {
                    setTimeout(() => {
                      fetchExecutions()
                      fetchExecutionStats()
                    }, 2000)
                  }}
                />
              ) : (
                <div className="inline-flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
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
                    <div className="flex items-center gap-2 mb-3">
                      <ListTree size={18} className="text-[#9BA3F0]" />
                      <h3 className="font-semibold text-gray-900">
                        Detail Per-Step ({currentExecution.stepResults.length})
                      </h3>
                    </div>
                    <StepResultsSummary stepResults={currentExecution.stepResults} />
                    <div className="space-y-3 mt-3">
                      {currentExecution.stepResults.map((result, idx) => (
                        <StepResultCard
                          key={result.id || idx}
                          result={result}
                          index={idx}
                          errorSize="small"
                          onScreenshotClick={
                            result.screenshot
                              ? () =>
                                  setScreenshotModal({
                                    url: result.screenshot.url,
                                    stepNumber: result.testStep?.stepNumber || idx + 1,
                                    description: result.testStep?.description || '',
                                  })
                              : undefined
                          }
                        />
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold text-[#E0E0E2]">{t.executionHistory}</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8A8A8F]">
                {compareIds.length === 0 ? t.selectTwoRuns : `${compareIds.length}/2 selected`}
              </span>
              <ExportFormatButton
                format="html"
                icon={GitCompare}
                onClick={handleCompareSelected}
                disabled={compareIds.length !== 2}
              >
                {t.compareSelected}
              </ExportFormatButton>
            </div>
          </div>

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
                    <th className="text-center py-3 px-2 font-semibold text-[#A0A0A4] w-10">
                      <GitCompare size={14} className="inline" />
                    </th>
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
                      className={`border-b border-[#2D2D2F] hover:bg-[#1A1A1C] transition ${
                        compareIds.includes(execution.id) ? 'bg-[#5E6AD2]/5' : ''
                      }`}
                    >
                      <td className="py-3 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={compareIds.includes(execution.id)}
                          onChange={() => toggleCompareSelection(execution.id)}
                          className="w-4 h-4 rounded border-[rgba(255,255,255,0.2)] bg-[#141316] accent-[#5E6AD2] cursor-pointer"
                          title="Select for comparison"
                        />
                      </td>
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
                          <ExportFormatButton
                            format="primary"
                            icon={Eye}
                            onClick={() => handleViewDetails(execution.id)}
                            title="View execution details"
                          >
                            {t.view}
                          </ExportFormatButton>
                          <ExportFormatButton
                            format="html"
                            onClick={() => handleExportReport(execution.id, 'html')}
                            title="Download HTML report"
                          >
                            {t.exportHTML}
                          </ExportFormatButton>
                          <ExportFormatButton
                            format="pdf"
                            onClick={() => handleExportReport(execution.id, 'pdf')}
                            title="Download PDF report"
                          >
                            {t.exportPDF}
                          </ExportFormatButton>
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

        {diffPair && (
          <ExecutionRunDiff
            executionA={diffPair[0]}
            executionB={diffPair[1]}
            onClose={() => setDiffPair(null)}
          />
        )}

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
