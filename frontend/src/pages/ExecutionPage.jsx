import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { Card, Button, Badge, Spinner, Alert } from '../components/ui'
import { useExecutionStore } from '../store/executionStore'

export default function ExecutionPage() {
  const navigate = useNavigate()
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
    clearError
  } = useExecutionStore()

  // Load executions on mount
  useEffect(() => {
    fetchExecutions()
    fetchExecutionStats()
  }, [])

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
      </div>
    </Layout>
  )
}
