import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { Card, Button, Badge, Spinner, Alert } from '../components/ui'
import { useExecutionStore } from '../store/executionStore'
import { useScenarioStore } from '../store/scenarioStore'
import { ExecuteScenarioButton } from '../components/ExecuteScenarioButton'

export default function ExecutionPage() {
  const navigate = useNavigate()
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
          <h1 className="text-3xl font-bold text-gray-900">Test Execution</h1>
          <p className="text-gray-600 mt-2">
            Run and monitor test scenarios
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
          <h2 className="text-xl font-bold text-gray-900 mb-4">Run Scenario</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Scenario Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Scenario
              </label>
              <select
                value={selectedScenarioId || ''}
                onChange={(e) => {
                  const scenarioId = e.target.value
                  const scenario = scenarios.find(s => s.id === scenarioId)
                  setSelectedScenarioId(scenarioId)
                  setSelectedScenarioName(scenario?.name || '')
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choose a scenario...</option>
                {scenarios && scenarios.map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenario.name} ({scenario.testSteps?.length || 0} steps)
                  </option>
                ))}
              </select>
            </div>

            {/* Status Info */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <div className="px-3 py-2 bg-gray-100 rounded-lg">
                {isRunning ? (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Spinner size="sm" />
                    <span>Running...</span>
                  </div>
                ) : (
                  <span className="text-gray-600">Ready</span>
                )}
              </div>
            </div>

            {/* Execute Button */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Action
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
                <Button 
                  variant="secondary" 
                  disabled
                  className="w-full"
                >
                  Select a scenario first
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        {Object.keys(stats).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <div className="text-center">
                <p className="text-3xl font-bold text-indigo-600">{stats.total || 0}</p>
                <p className="text-gray-600 mt-2 text-sm">Total Executions</p>
              </div>
            </Card>

            <Card>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{stats.passed || 0}</p>
                <p className="text-gray-600 mt-2 text-sm">Passed</p>
              </div>
            </Card>

            <Card>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{stats.failed || 0}</p>
                <p className="text-gray-600 mt-2 text-sm">Failed</p>
              </div>
            </Card>

            <Card>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {stats.successRate || 0}%
                </p>
                <p className="text-gray-600 mt-2 text-sm">Success Rate</p>
              </div>
            </Card>
          </div>
        )}

        {/* Current Execution Status */}
        {currentExecution && (
          <Card>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {currentExecution.scenario?.name}
                  </h2>
                  <Badge variant={getStatusColor(currentExecution.status)}>
                    {getStatusIcon(currentExecution.status)} {currentExecution.status}
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Passed Steps</p>
                    <p className="text-2xl font-bold text-green-600">
                      {currentExecution.passedSteps || 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Failed Steps</p>
                    <p className="text-2xl font-bold text-red-600">
                      {currentExecution.failedSteps || 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Total Steps</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {currentExecution.totalSteps || 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {currentExecution.duration ? `${(currentExecution.duration / 1000).toFixed(2)}s` : '−'}
                    </p>
                  </div>
                </div>

                {currentExecution.errorMessage && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    <strong>Error:</strong> {currentExecution.errorMessage}
                  </div>
                )}

                {currentExecution.startTime && (
                  <div className="mt-4 text-sm text-gray-500">
                    Started: {new Date(currentExecution.startTime).toLocaleString()}
                    {currentExecution.endTime && (
                      <> • Ended: {new Date(currentExecution.endTime).toLocaleString()}</>
                    )}
                  </div>
                )}

                {/* Per-Step Results */}
                {currentExecution.stepResults && currentExecution.stepResults.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Detail Per-Step</h3>
                    <div className="space-y-2">
                      {currentExecution.stepResults.map((result, idx) => (
                        <div
                          key={result.id || idx}
                          className={`flex items-center gap-3 p-2 rounded border ${
                            result.status === 'PASSED'
                              ? 'bg-green-50 border-green-200'
                              : 'bg-red-50 border-red-200'
                          }`}
                        >
                          <span className={`text-sm ${result.status === 'PASSED' ? 'text-green-600' : 'text-red-600'}`}>
                            {result.status === 'PASSED' ? '✓' : '✗'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              Step {result.testStep?.stepNumber || idx + 1}: {result.testStep?.description || '-'}
                            </p>
                            {result.errorMessage && (
                              <p className="text-xs text-red-600 truncate">{result.errorMessage}</p>
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
                              title="Lihat screenshot"
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
          <h2 className="text-xl font-bold text-gray-900 mb-4">Execution History</h2>

          {isLoading && executions.length === 0 ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : executions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No executions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Scenario
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">
                      Steps (P/F)
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">
                      Duration
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {executions.map((execution) => (
                    <tr
                      key={execution.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="py-3 px-4 text-gray-900">
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
                      <td className="py-3 px-4 text-center text-sm text-gray-600">
                        {execution.duration
                          ? `${(execution.duration / 1000).toFixed(2)}s`
                          : '−'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(execution.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleViewDetails(execution.id)}
                        >
                          View
                        </Button>
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
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setScreenshotModal(null)}
          >
            <div
              className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  📸 Step {screenshotModal.stepNumber}: {screenshotModal.description}
                </h3>
                <button
                  onClick={() => setScreenshotModal(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ✕
                </button>
              </div>
              <div className="p-4">
                <img
                  src={screenshotModal.url}
                  alt={`Screenshot step ${screenshotModal.stepNumber}`}
                  className="w-full rounded-lg border border-gray-200"
                />
              </div>
              <div className="flex justify-end p-4 border-t">
                <a
                  href={screenshotModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium mr-4"
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
