import React, { useState, useEffect } from 'react'
import apiClient from '../services/api'
import { AlertCircle, Shield, AlertTriangle, AlertOctagon, AlertCircle as AlertMedium } from 'lucide-react'
import { useSettingsStore } from '../store/settingsStore'

const i18n = {
  en: { 
    totalScans: 'Total Scans', 
    avgRisk: 'Avg Risk Score', 
    critical: 'Critical', 
    high: 'High', 
    medium: 'Medium+Low',
    totalScansDesc: 'Total security scans executed',
    avgRiskDesc: 'Average CVSS risk score across all scans',
    criticalDesc: 'Number of critical vulnerabilities found',
    highDesc: 'Number of high severity vulnerabilities',
    mediumDesc: 'Number of medium and low severity vulnerabilities'
  },
  id: { 
    totalScans: 'Total Scan', 
    avgRisk: 'Skor Risiko Rata-rata', 
    critical: 'Kritis', 
    high: 'Tinggi', 
    medium: 'Sedang+Rendah',
    totalScansDesc: 'Total scan keamanan yang dijalankan',
    avgRiskDesc: 'Rata-rata skor risiko CVSS di semua scan',
    criticalDesc: 'Jumlah kerentanan kritis yang ditemukan',
    highDesc: 'Jumlah kerentanan dengan keparahan tinggi',
    mediumDesc: 'Jumlah kerentanan dengan keparahan sedang dan rendah'
  },
}

export default function SecuritySummary() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const { language } = useSettingsStore()
  const t = i18n[language] || i18n.id

  useEffect(() => {
    loadSummary()
  }, [])

  const loadSummary = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/security/summary')
      setSummary(response.data.data)
    } catch (err) {
      console.error('Failed to load security summary:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !summary) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800">
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3 animate-pulse" />
          <div className="grid grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security Summary</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Vulnerability assessment & findings</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <div 
          className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 cursor-help hover:shadow-md transition-shadow"
          title={t.totalScansDesc}
        >
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">{t.totalScans}</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{summary.totalScans}</p>
        </div>

        <div 
          className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 cursor-help hover:shadow-md transition-shadow"
          title={t.avgRiskDesc}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertOctagon className="w-4 h-4 text-red-500" />
            <p className="text-sm text-gray-600 dark:text-gray-400">{t.avgRisk}</p>
          </div>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{(summary.avgRiskScore || 0).toFixed(1)}</p>
        </div>

        <div 
          className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 cursor-help hover:shadow-md transition-shadow"
          title={t.criticalDesc}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">{t.critical}</p>
          </div>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{summary.criticalFindings || 0}</p>
        </div>

        <div 
          className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 cursor-help hover:shadow-md transition-shadow"
          title={t.highDesc}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-orange-500 dark:text-orange-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">{t.high}</p>
          </div>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{summary.highFindings || 0}</p>
        </div>

        <div 
          className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 cursor-help hover:shadow-md transition-shadow"
          title={t.mediumDesc}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertMedium className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">{t.medium}</p>
          </div>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{summary.mediumLowFindings || 0}</p>
        </div>
      </div>

      <button
        onClick={loadSummary}
        className="mt-4 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
      >
        ↻ Refresh
      </button>
    </div>
  )
}
