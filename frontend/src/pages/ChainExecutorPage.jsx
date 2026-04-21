/**
 * ChainExecutorPage - Execute chains and view results
 */

import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { chainAPI } from '../services/api'
import { Play, ChevronDown, ChevronUp, Clock, Check, X, Loader } from 'lucide-react'

export default function ChainExecutorPage() {
  const navigate = useNavigate()
  const { chainId } = useParams()

  const [chain, setChain] = useState(null)
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)
  const [error, setError] = useState(null)
  const [headless, setHeadless] = useState(false)
  const [currentExecution, setCurrentExecution] = useState(null)
  const [expandedSteps, setExpandedSteps] = useState({})
  const [executions, setExecutions] = useState([])

  useEffect(() => {
    loadChain()
    loadExecutionHistory()
  }, [chainId])

  async function loadChain() {
    try {
      const response = await chainAPI.getById(chainId)
      setChain(response.data.chain)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load chain')
    } finally {
      setLoading(false)
    }
  }

  async function loadExecutionHistory() {
    try {
      const response = await chainAPI.getExecutionHistory(chainId, 5, 0)
      setExecutions(response.data.executions || [])
    } catch (err) {
      console.error('Failed to load execution history:', err)
    }
  }

  async function handleExecute() {
    setExecuting(true)
    setError(null)
    setCurrentExecution(null)

    try {
      const response = await chainAPI.execute(chainId, headless)
      setCurrentExecution(response.data.chainExecution)
      
      // Reload execution history
      await loadExecutionHistory()
    } catch (err) {
      setError(err.response?.data?.error || 'Chain execution failed')
    } finally {
      setExecuting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-slate-400 mt-4">Loading chain...</p>
        </div>
      </div>
    )
  }

  if (!chain) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-6xl mx-auto text-center py-16">
          <p className="text-red-400 mb-4">Chain not found</p>
          <button
            onClick={() => navigate('/chains')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Back to Chains
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{chain.name}</h1>
            <p className="text-slate-400">{chain.description}</p>
          </div>
          <button
            onClick={() => navigate('/chains')}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition"
          >
            Back
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-600 text-red-300 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Execution Control */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold text-white mb-4">Execute Chain</h2>

              <div className="space-y-4 mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={headless}
                    onChange={(e) => setHeadless(e.target.checked)}
                    disabled={executing}
                    className="w-4 h-4"
                  />
                  <span className="text-slate-300">Headless Mode</span>
                </label>
              </div>

              <button
                onClick={handleExecute}
                disabled={executing || chain.chainSteps?.length === 0}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition"
              >
                {executing ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play size={20} />
                    Run Chain
                  </>
                )}
              </button>

              {chain.chainSteps?.length === 0 && (
                <p className="text-yellow-400 text-sm mt-4">
                  ⚠️ No steps in chain. Add steps before executing.
                </p>
              )}

              <div className="mt-6 pt-6 border-t border-slate-700">
                <h3 className="text-lg font-bold text-white mb-3">Chain Overview</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-400">Total Steps:</span>
                    <span className="text-white ml-2 font-medium">{chain.steps}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Total Executions:</span>
                    <span className="text-white ml-2 font-medium">{executions.length}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Status:</span>
                    <span className={`ml-2 font-medium ${chain.isActive ? 'text-green-400' : 'text-slate-400'}`}>
                      {chain.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Execution */}
            {currentExecution && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">Current Execution</h2>
                <ExecutionResults execution={currentExecution} expandedSteps={expandedSteps} setExpandedSteps={setExpandedSteps} />
              </div>
            )}

            {/* Chain Steps */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Chain Steps ({chain.chainSteps?.length || 0})</h2>
              
              {chain.chainSteps && chain.chainSteps.length > 0 ? (
                <div className="space-y-3">
                  {chain.chainSteps.map((step) => (
                    <div
                      key={step.id}
                      className="bg-slate-900/50 border border-slate-600 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full text-white font-bold text-sm">
                          {step.stepNumber}
                        </span>
                        <div className="flex-1">
                          <div className="text-white font-medium">{step.scenario.name}</div>
                          {step.description && (
                            <div className="text-slate-400 text-sm">{step.description}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span>Wait: {step.waitTime}ms</span>
                          <span>Retry: {step.retryCount}x</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-8">No steps in this chain</p>
              )}
            </div>

            {/* Execution History */}
            {executions.length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">Recent Executions</h2>
                <div className="space-y-3">
                  {executions.map((exec) => (
                    <div
                      key={exec.id}
                      className="bg-slate-900/50 border border-slate-600 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <StatusIcon status={exec.status} />
                          <div>
                            <div className="text-white font-medium">
                              {exec.totalSteps} steps • {exec.passedSteps} passed • {exec.failedSteps} failed
                            </div>
                            <div className="text-slate-400 text-sm">
                              {new Date(exec.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        {exec.duration && (
                          <div className="text-slate-400 text-sm flex items-center gap-1">
                            <Clock size={14} />
                            {(exec.duration / 1000).toFixed(1)}s
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusIcon({ status }) {
  switch (status) {
    case 'PASSED':
      return <Check size={20} className="text-green-400" />
    case 'FAILED':
      return <X size={20} className="text-red-400" />
    case 'RUNNING':
      return <Loader size={20} className="text-blue-400 animate-spin" />
    default:
      return <Clock size={20} className="text-slate-400" />
  }
}

function ExecutionResults({ execution, expandedSteps, setExpandedSteps }) {
  const statusColor = {
    'PASSED': 'bg-green-500/20 text-green-400 border-green-500',
    'FAILED': 'bg-red-500/20 text-red-400 border-red-500',
    'RUNNING': 'bg-blue-500/20 text-blue-400 border-blue-500',
    'PENDING': 'bg-slate-500/20 text-slate-400 border-slate-500'
  }

  return (
    <div className="space-y-4">
      <div className={`border rounded-lg p-4 ${statusColor[execution.status] || statusColor['PENDING']}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold mb-1">
              {execution.status === 'PASSED' && '✓ Execution Passed'}
              {execution.status === 'FAILED' && '✗ Execution Failed'}
              {execution.status === 'RUNNING' && '⟳ Execution Running'}
              {execution.status === 'PENDING' && '⏱ Pending'}
            </div>
            <div className="text-sm opacity-90">
              {execution.totalSteps} steps • {execution.passedSteps} passed • {execution.failedSteps} failed
              {execution.duration && ` • ${(execution.duration / 1000).toFixed(1)}s`}
            </div>
          </div>
          <StatusIcon status={execution.status} />
        </div>
      </div>

      {execution.stepResults && execution.stepResults.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold text-white">Step Results</h3>
          {execution.stepResults.map((result) => (
            <div key={result.id} className="bg-slate-900/50 border border-slate-600 rounded-lg">
              <button
                onClick={() => setExpandedSteps({
                  ...expandedSteps,
                  [result.id]: !expandedSteps[result.id]
                })}
                className="w-full flex items-center justify-between p-3 hover:bg-slate-700/50 transition"
              >
                <div className="flex items-center gap-2">
                  <StatusIcon status={result.status} />
                  <span className="text-white font-medium">Step {result.stepNumber}</span>
                  {result.duration && (
                    <span className="text-slate-400 text-sm ml-2">
                      ({(result.duration / 1000).toFixed(2)}s)
                    </span>
                  )}
                </div>
                {expandedSteps[result.id] ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </button>

              {expandedSteps[result.id] && (
                <div className="border-t border-slate-600 p-3 bg-slate-800/50 text-sm text-slate-300">
                  {result.errorMessage && (
                    <div className="text-red-400">
                      <strong>Error:</strong> {result.errorMessage}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
