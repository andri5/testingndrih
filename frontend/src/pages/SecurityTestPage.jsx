import React, { useState, useEffect } from 'react'
import apiClient from '../services/api'
import SecurityScanRunner from '../components/security/SecurityScanRunner'
import SecurityFindings from '../components/security/SecurityFindings'
import SecuritySummary from '../components/security/SecuritySummary'
import SecurityHistory from '../components/security/SecurityHistory'
import OwaspCoveragePanel from '../components/security/OwaspCoveragePanel'
import ExportButtons from '../components/ExportButtons'
import Layout from '../components/Layout'
import { Shield, AlertCircle, Loader } from 'lucide-react'
import { analyzeSecurityTestResults } from '../utils/testAnalysis'

const i18n = {
    title: 'Security Testing',
    description: 'Identify vulnerabilities through comprehensive security scanning',
    selectScenario: 'Select Scenario',
    noScenarios: 'No scenarios marked for security testing',
    aboutTitle: '🔐 About Security Tests',
    feature1: 'OWASP Top 10:2021 coverage (A01–A10) mapped on every scan',
    feature2: 'Injection, XSS, auth failures, SSRF, misconfig, and more',
    feature3: 'Live security-header probe + SSL/TLS checks',
    feature4: 'CVSS scoring for risk assessment',
    feature5: 'Detailed remediation recommendations',
    feature6: 'Track findings and remediation status',
    all: 'All',
    loading: 'Loading scenarios...',
    error: 'Error',
  
}

export default function SecurityTestPage() {
  const [scenarios, setScenarios] = useState([])
  const [selectedScenario, setSelectedScenario] = useState(null)
  const [currentScan, setCurrentScan] = useState(null)
  const [findings, setFindings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterSeverity, setFilterSeverity] = useState('ALL')
  const [summaryData, setSummaryData] = useState(null)  const t = i18n

  useEffect(() => {
    loadScenarios()
    loadSecuritySummary()
  }, [])

  const loadSecuritySummary = async () => {
    try {
      const response = await apiClient.get('/security/summary')
      setSummaryData(response.data.data)
    } catch (err) {
      console.error('Failed to load security summary:', err)
    }
  }

  const loadScenarios = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/security/scenarios')
      setScenarios(response.data.data || [])
      if (response.data.data?.length > 0) {
        setSelectedScenario(response.data.data[0])
      }
      setError(null)
    } catch (err) {
      console.error('Failed to load security scenarios:', err)
      setError('Failed to load scenarios')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkSecurity = async (scenarioId) => {
    try {
      await apiClient.post(`/security/mark/${scenarioId}`)
      loadScenarios()
    } catch (err) {
      console.error('Failed to mark scenario:', err)
    }
  }

  const handleScanComplete = (scan) => {
    setCurrentScan(scan)
    loadFindings(scan.id)
  }

  const loadFindings = async (scanId) => {
    try {
      const response = await apiClient.get(`/security/scans/${scanId}/findings`, {
        params: { severity: filterSeverity !== 'ALL' ? filterSeverity : undefined }
      })
      setFindings(response.data.data || [])
    } catch (err) {
      console.error('Failed to load findings:', err)
    }
  }

  const handleFilterChange = (severity) => {
    setFilterSeverity(severity)
    if (currentScan) {
      loadFindings(currentScan.id)
    }
  }

  const getSeverityColor = (severity) => {
    const colors = {
      CRITICAL: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700',
      HIGH: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900 border-orange-200 dark:border-orange-700',
      MEDIUM: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-700',
      LOW: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700',
      INFO: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
    }
    return colors[severity] || colors.INFO
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-2 sm:py-4">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
            <div className="flex items-center gap-3 min-w-0">
              <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-red-500 shrink-0" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">{t.title}</h1>
            </div>
            <a
              href="/help/security-test"
              className="sm:ml-auto self-start px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
              title="View Help Guide"
            >
              ? Help
            </a>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">{t.description}</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <span className="text-red-700 dark:text-red-200">{error}</span>
          </div>
        )}

        {/* Summary */}
        <div className="mb-4">
          <SecuritySummary />
        </div>

        {/* Export Buttons */}
        <div className="mb-8 flex justify-center sm:justify-end">
          <ExportButtons 
            title={t.title}
            summary={summaryData ? {
              'Total Scans': summaryData.totalScans || 0,
              'Avg Risk Score': summaryData.avgRiskScore?.toFixed(1) || 0,
              'Critical Findings': summaryData.criticalFindings || 0,
              'High Findings': summaryData.highFindings || 0,
              'Medium+Low Findings': summaryData.mediumLowFindings || 0,
            } : null}
            details={scenarios.map(s => ({
              'Scenario Name': s.name,
              'URL': s.url || '-',
              'Status': 'Active',
              'Created At': new Date(s.createdAt).toLocaleDateString('en-US')
            }))}
            analysis={analyzeSecurityTestResults(
              summaryData ? {
                'Total Scans': summaryData.totalScans || 0,
                'Avg Risk Score': summaryData.avgRiskScore?.toFixed(1) || 0,
                'Critical': summaryData.criticalFindings || 0,
                'High': summaryData.highFindings || 0,
                'Medium': summaryData.mediumFindings || 0,
                'Low': summaryData.lowFindings || 0,
              } : null,
              scenarios,
              findings
            )}
            filename={`security-test-report-${new Date().toISOString().slice(0, 10)}`}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8">
        {/* Scenario Selector & Runner */}
        <div className="lg:col-span-2 space-y-4">
          {/* Scenario Selection */}
          <div className="bg-[#1A1A1C] rounded-lg shadow border border-[#2D2D2F] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[#E0E0E2]">{t.selectScenario}</h2>
            <div className="bg-[#0F0E11] rounded-lg p-4 max-h-64 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-6 h-6 text-red-500 animate-spin" />
                </div>
              ) : scenarios.length === 0 ? (
                <p className="text-center text-[#8A8A8F] py-8">{t.noScenarios}</p>
              ) : (
                <div className="space-y-2">
                  {scenarios.map(scenario => (
                    <button
                      key={scenario.id}
                      onClick={() => setSelectedScenario(scenario)}
                      className={`w-full p-3 rounded-lg text-left transition-colors border-2 ${
                        selectedScenario?.id === scenario.id
                          ? 'security-scenario-btn-selected'
                          : 'security-scenario-btn-unselected'
                      }`}
                    >
                      <h3 className="font-semibold">{scenario.name}</h3>
                      <p className="text-sm opacity-75">{scenario.url}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Scanner */}
          {selectedScenario && (
            <SecurityScanRunner
              scenario={selectedScenario}
              onScanComplete={handleScanComplete}
            />
          )}

          {/* Findings Display */}
          {currentScan && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Scan Results</h2>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleFilterChange('ALL')}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      filterSeverity === 'ALL'
                        ? 'bg-gray-900 dark:bg-gray-600 text-white shadow'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t.all}
                  </button>
                  {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map(severity => (
                    <button
                      key={severity}
                      onClick={() => handleFilterChange(severity)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        filterSeverity === severity
                          ? `${getSeverityColor(severity)} border`
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {severity}
                    </button>
                  ))}
                </div>
              </div>

              {findings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No findings found</p>
                </div>
              ) : (
                <SecurityFindings findings={findings} />
              )}
            </div>
          )}
        </div>

        {/* History + OWASP Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <OwaspCoveragePanel
            findings={findings}
            categoryCounts={!findings.length ? summaryData?.owaspByCategory : null}
            title="OWASP Top 10:2021"
          />
          {selectedScenario && <SecurityHistory scenario={selectedScenario} />}
        </div>
      </div>
      </div>
    </Layout>
  )
}
