import React, { useState, useEffect } from 'react'
import apiClient from '../services/api'
import StressTestSummary from '../components/StressTestSummary'
import StressTestRunner from '../components/StressTestRunner'
import StressTestHistory from '../components/StressTestHistory'
import ExportButtons from '../components/ExportButtons'
import Layout from '../components/Layout'
import { Zap, AlertCircle, Loader, Play, BarChart3, Gauge, TrendingUp, Layers } from 'lucide-react'
import { analyzeStressTestResults } from '../utils/testAnalysis'

const i18n = {
    title: 'Stress Tests',
    description: 'Validate system performance under load - measure throughput, response times, and error rates',
    selectScenario: 'Select Scenario',
    noScenarios: 'No scenarios marked for stress testing',
    runAll: 'Run All',
    runAllTooltip: 'Run stress tests on all selected scenarios with light profile',
    aboutTitle: '⚡ About Stress Tests',
    feature1: '4 load profiles: Light, Medium, Heavy, Extreme',
    feature2: 'Concurrent execution with detailed metrics',
    feature3: 'Response time tracking (min/avg/max/P95/P99)',
    feature4: 'Throughput measurement (executions/sec)',
    feature5: 'Error rate monitoring and analysis',
    feature6: 'Comprehensive performance reports',
    loading: 'Loading scenarios...',
    error: 'Error',
    steps: 'steps',
  
}

export default function StressTestPage() {
  const [scenarios, setScenarios] = useState([])
  const [selectedScenario, setSelectedScenario] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [summaryData, setSummaryData] = useState(null)  const t = i18n

  useEffect(() => {
    loadScenarios()
    loadSummary()
  }, [])

  const loadSummary = async () => {
    try {
      const response = await apiClient.get('/stress/summary')
      setSummaryData(response.data.data)
    } catch (err) {
      console.error('Failed to load summary:', err)
    }
  }

  const loadScenarios = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/stress/scenarios')
      setScenarios(response.data.data || [])
      if (response.data.data?.length > 0) {
        setSelectedScenario(response.data.data[0])
      }
      setError(null)
    } catch (err) {
      console.error('Failed to load stress scenarios:', err)
      setError('Failed to load scenarios')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkStress = async (scenarioId) => {
    try {
      await apiClient.post(`/stress/mark/${scenarioId}`)
      loadScenarios()
    } catch (err) {
      console.error('Failed to mark scenario:', err)
    }
  }

  const handleRunAllStressTests = async () => {
    try {
      if (scenarios.length === 0) {
        alert('No stress test scenarios available')
        return
      }
      
      setLoading(true)
      const response = await apiClient.post('/stress/run-all', {
        profile: 'LIGHT' // default profile
      })
      
      if (response.data.success) {
        alert(`Started stress tests for ${scenarios.length} scenarios!\nThis may take a few minutes...`)
        // Reload summary after a delay
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    } catch (err) {
      console.error('Failed to run all stress tests:', err)
      alert('Failed to start stress tests')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-purple-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.title}</h1>
            <a
              href="/help/stress-test"
              className="ml-auto px-3 py-1 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors"
              title="View Help Guide"
            >
              ? Help
            </a>
          </div>
          <p className="text-gray-600 dark:text-gray-400">{t.description}</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Summary */}
        <div className="mb-4">
          <StressTestSummary />
        </div>

        {/* Export Buttons */}
        <div className="mb-8 flex justify-center sm:justify-end">
          <ExportButtons 
            title={t.title}
            summary={summaryData ? {
              'Total Tests': summaryData.totalTests || 0,
              'Pass Rate (%)': summaryData.passRate || 0,
              'Avg Response Time (ms)': summaryData.avgResponseTime || 0,
              'Throughput (exec/sec)': summaryData.avgThroughput || 0,
            } : null}
            details={scenarios.map(s => ({
              'Scenario Name': s.name,
              'Test Steps': s.testSteps?.length || 0,
              'Status': 'Active',
              'Created At': new Date(s.createdAt).toLocaleDateString('en-US')
            }))}
            analysis={analyzeStressTestResults(
              summaryData ? {
                'Total Tests': summaryData.totalTests || 0,
                'Pass Rate (%)': summaryData.passRate || 0,
                'Avg Response Time (ms)': summaryData.avgResponseTime || 0,
                'Throughput (exec/sec)': summaryData.avgThroughput || 0,
                'Error Rate (%)': summaryData.errorRate || 0,
                'Total Requests': summaryData.totalRequests || 0,
              } : null,
              scenarios
            )}
            filename={`stress-test-report-${new Date().toISOString().slice(0, 10)}`}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8">
        {/* Scenario Selector & Runner */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scenario List */}
          <div className="bg-[#1A1A1C] dark:bg-[#1A1A1C] html.theme-light:bg-white rounded-lg shadow border border-[#2D2D2F] dark:border-[#2D2D2F] html.theme-light:border-[#DDDDE0] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[#E0E0E2] dark:text-[#E0E0E2] html.theme-light:text-[#1A1A1C]">{t.selectScenario}</h2>
            <div className="bg-[#0F0E11] dark:bg-[#0F0E11] html.theme-light:bg-[#F5F5F7] rounded-lg p-4 max-h-64 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-6 h-6 text-purple-500 animate-spin" />
                </div>
              ) : scenarios.length === 0 ? (
                <p className="text-center text-[#8A8A8F] dark:text-[#8A8A8F] html.theme-light:text-[#666] py-8">{t.noScenarios}</p>
              ) : (
                <div className="space-y-2">
                  {scenarios.map(scenario => (
                    <button
                      key={scenario.id}
                      onClick={() => setSelectedScenario(scenario)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedScenario?.id === scenario.id
                          ? 'bg-purple-600 dark:bg-purple-600 html.theme-light:bg-[#EEF0FF] border-2 border-purple-500 dark:border-purple-500 html.theme-light:border-purple-300 text-[#E0E0E2] dark:text-white html.theme-light:text-[#1A1A1C]'
                          : 'bg-[#1A1A1C] dark:bg-[#1A1A1C] html.theme-light:bg-white border border-[#2D2D2F] dark:border-[#2D2D2F] html.theme-light:border-[#DDDDE0] text-[#8A8A8F] dark:text-gray-300 html.theme-light:text-[#666] hover:border-purple-500 dark:hover:border-purple-500 html.theme-light:hover:border-purple-300 hover:text-[#E0E0E2] dark:hover:text-white html.theme-light:hover:text-[#1A1A1C]'
                      }`}
                    >
                      <h3 className="font-semibold">{scenario.name}</h3>
                      <p className="text-sm opacity-75">{scenario.testSteps?.length || 0} steps</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Runner */}
          {selectedScenario && (
            <StressTestRunner
              scenario={selectedScenario}
              onTestComplete={loadScenarios}
            />
          )}
        </div>

        {/* History Sidebar */}
        {selectedScenario && (
          <div className="lg:col-span-1">
            <StressTestHistory scenario={selectedScenario} />
          </div>
        )}
      </div>

      {/* Run All Button */}
      <div className="flex justify-center mt-8">
        <button
          onClick={handleRunAllStressTests}
          disabled={loading || scenarios.length === 0}
          title={t.runAllTooltip}
          className="p-3 bg-purple-500 text-white rounded-lg shadow hover:shadow-lg hover:bg-purple-600 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Play className="w-5 h-5 fill-current" />
          <span className="font-semibold">{t.runAll}</span>
        </button>
      </div>
      </div>
    </Layout>
  )
}
