import React, { useState, useEffect } from 'react'
import { Zap, AlertCircle, Loader, CheckCircle2, Zap as ZapIcon, Rocket, MonitorPlay, BarChart2, ListChecks } from 'lucide-react'
import SmokeTestRunner from '../components/SmokeTestRunner'
import SmokeTestHistory from '../components/SmokeTestHistory'
import SmokeTestSummary from '../components/SmokeTestSummary'
import ExportButtons from '../components/ExportButtons'
import Layout from '../components/Layout'
import apiClient from '../services/api'
import { useSettingsStore } from '../store/settingsStore'
import { analyzeSmokeTestResults } from '../utils/testAnalysis'

const i18n = {
  en: {
    title: 'Smoke Tests',
    description: 'Quick validation of core functionality through automated smoke tests',
    selectScenario: 'Select Scenario',
    noScenarios: 'No scenarios marked for smoke testing',
    runAllTests: 'Run All Smoke Tests',
    runningAllTests: 'Running All Tests...',
    aboutTitle: '💨 About Smoke Tests',
    feature1: 'Fast automated tests that validate core functionality',
    feature2: 'Quick feedback on system health',
    feature3: 'Ideal for CI/CD pipelines',
    feature4: 'Comprehensive test history tracking',
    feature5: 'Real-time execution monitoring',
    feature6: 'Scenario success/failure summary',
    steps: 'steps',
    loading: 'Loading scenarios...',
    error: 'Error',
  },
  id: {
    title: 'Pengujian Smoke',
    description: 'Validasi cepat fungsionalitas inti melalui pengujian smoke otomatis',
    selectScenario: 'Pilih Scenario',
    noScenarios: 'Tidak ada scenario yang ditandai untuk pengujian smoke',
    runAllTests: 'Jalankan Semua Pengujian Smoke',
    runningAllTests: 'Menjalankan Semua Tes...',
    aboutTitle: '💨 Tentang Pengujian Smoke',
    feature1: 'Tes otomatis cepat yang memvalidasi fungsionalitas inti',
    feature2: 'Umpan balik cepat tentang kesehatan sistem',
    feature3: 'Ideal untuk pipeline CI/CD',
    feature4: 'Pelacakan riwayat pengujian komprehensif',
    feature5: 'Pemantauan eksekusi real-time',
    feature6: 'Ringkasan kesuksesan/kegagalan scenario',
    steps: 'langkah',
    loading: 'Memuat scenario...',
    error: 'Error',
  },
}

export default function SmokeTestPage() {
  const [smokeScenarios, setSmokeScenarios] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedScenario, setSelectedScenario] = useState(null)
  const [runningAllTests, setRunningAllTests] = useState(false)
  const [summaryData, setSummaryData] = useState(null)
  const { language } = useSettingsStore()
  const t = i18n[language] || i18n.id

  useEffect(() => {
    loadSmokeScenarios()
    loadSummary()
  }, [])

  const loadSummary = async () => {
    try {
      const response = await apiClient.get('/smoke/summary')
      setSummaryData(response.data.data)
    } catch (err) {
      console.error('Failed to load summary:', err)
    }
  }

  const loadSmokeScenarios = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get('/smoke/scenarios')
      setSmokeScenarios(response.data.data)
      setError(null)

      // Auto-select first scenario if available
      if (response.data.data.length > 0 && !selectedScenario) {
        setSelectedScenario(response.data.data[0])
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRunAllTests = async () => {
    try {
      setRunningAllTests(true)
      await apiClient.post('/smoke/run-all', {
        notifyOnComplete: false
      })
      // Reload scenarios to show updated results
      await loadSmokeScenarios()
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setRunningAllTests(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-[#E0E0E2] html.theme-light:text-[#1A1A1C]">{t.title}</h1>
            <a
              href="/help/smoke-test"
              className="ml-auto px-3 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
              title="View Help Guide"
            >
              ? Help
            </a>
          </div>
          <p className="text-[#A0A0A4] html.theme-light:text-[#666]">{t.description}</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-[#2D0D0D] html.theme-light:bg-[#FEF2F2] border border-[#5E1515] html.theme-light:border-[#FCA5A5] flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-400 html.theme-light:text-red-700">{error}</span>
          </div>
        )}

        {/* Summary Stats */}
        <div className="mb-4">
          <SmokeTestSummary />
        </div>

        {/* Export Buttons */}
        <div className="mb-8 flex justify-center sm:justify-end">
          <ExportButtons 
            title={t.title}
            summary={summaryData ? {
              'Total Tests': summaryData.totalTests || 0,
              'Pass Rate (%)': summaryData.passRate || 0,
              'Avg Duration (s)': summaryData.avgDuration ? (summaryData.avgDuration / 1000).toFixed(2) : 0,
            } : null}
            details={smokeScenarios.map(s => ({
              'Scenario Name': s.name,
              'Test Steps': s.testSteps?.length || 0,
              'Status': 'Active',
              'Created At': new Date(s.createdAt).toLocaleDateString(language)
            }))}
            analysis={analyzeSmokeTestResults(
              summaryData ? {
                'Total Tests': summaryData.totalTests || 0,
                'Pass Rate (%)': summaryData.passRate || 0,
                'Avg Duration (s)': summaryData.avgDuration ? (summaryData.avgDuration / 1000).toFixed(2) : 0,
              } : null,
              smokeScenarios
            )}
            filename={`smoke-test-report-${new Date().toISOString().slice(0, 10)}`}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8">
          {/* Left Column - Scenario Selection & Test Runner */}
          <div className="lg:col-span-2 space-y-6">
            {/* Scenario Selector */}
            <div className="bg-[#1A1A1C] rounded-lg shadow p-6 border border-[#2D2D2F]">
              <h2 className="text-lg font-semibold text-[#E0E0E2] mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-500" />
                {t.selectScenario}
              </h2>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-6 h-6 text-orange-500 animate-spin" />
                </div>
              ) : smokeScenarios.length === 0 ? (
                <p className="text-center text-[#8A8A8F] py-8">
                  {t.noScenarios}
                </p>
              ) : (
                <div className="space-y-2 bg-[#0F0E11] rounded-lg p-4 max-h-64 overflow-y-auto">
                  {smokeScenarios.map(scenario => (
                    <button
                      key={scenario.id}
                      onClick={() => setSelectedScenario(scenario)}
                      className={`w-full text-left p-4 rounded-lg border-2 shadow-sm transition-all ${
                        selectedScenario?.id === scenario.id
                          ? 'smoke-scenario-btn-selected'
                          : 'smoke-scenario-btn-unselected'
                      }`}
                    >
                      <h3 className="font-semibold break-words">
                        {scenario.name}
                      </h3>
                      <p className="text-sm text-[#8A8A8F] mt-1">
                        {scenario.testSteps?.length || scenario.steps?.length || 0} {t.steps}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Test Runner */}
            {selectedScenario && (
              <SmokeTestRunner
                scenarioId={selectedScenario.id}
                scenarioName={selectedScenario.name}
                onTestComplete={() => loadSmokeScenarios()}
              />
            )}
          </div>

          {/* Right Column - History */}
          <div>
            {selectedScenario && (
              <SmokeTestHistory scenarioId={selectedScenario.id} />
            )}
          </div>
        </div>

        {/* Run All Button */}
        {smokeScenarios.length > 0 && (
          <div className="text-center pb-8">
            <button
              onClick={handleRunAllTests}
              disabled={runningAllTests}
              className={`px-6 py-3 rounded-lg font-semibold shadow hover:shadow-md transition-all ${
                runningAllTests
                  ? 'bg-[#2D2D2F] html.theme-light:bg-[#DDDDE0] text-[#8A8A8F] html.theme-light:text-[#888] cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700'
              }`}
            >
              {runningAllTests ? (
                <>
                  <Loader className="w-4 h-4 inline mr-2 animate-spin" />
                  {t.runningAllTests}
                </>
              ) : (
                t.runAllTests
              )}
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}
