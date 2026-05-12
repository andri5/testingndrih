import React, { useState, useEffect } from 'react'
import apiClient from '../services/api'
import { AlertCircle, Zap, Gauge, TrendingUp, BarChart3 } from 'lucide-react'
import { useSettingsStore } from '../store/settingsStore'

const i18n = {
  en: { 
    totalTests: 'Total Tests', 
    passRate: 'Pass Rate', 
    avgResponse: 'Avg Response', 
    avgThroughput: 'Throughput',
    totalTestsDesc: 'Total stress tests executed',
    passRateDesc: 'Percentage of successful test runs',
    avgResponseDesc: 'Average response time across all tests',
    avgThroughputDesc: 'Average executions per second'
  },
  id: { 
    totalTests: 'Total Tes', 
    passRate: 'Tingkat Keberhasilan', 
    avgResponse: 'Respons Rata-rata', 
    avgThroughput: 'Throughput',
    totalTestsDesc: 'Total tes stress yang dijalankan',
    passRateDesc: 'Persentase keberhasilan jalannya tes',
    avgResponseDesc: 'Rata-rata waktu respons di semua tes',
    avgThroughputDesc: 'Rata-rata eksekusi per detik'
  },
}

export default function StressTestSummary() {
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
      const response = await apiClient.get('/stress/summary')
      setSummary(response.data.data)
    } catch (err) {
      console.error('Failed to load summary:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !summary) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800">
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3 animate-pulse" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
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
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Stress Test Summary</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">System performance under load</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div 
          className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 cursor-help hover:shadow-md transition-shadow"
          title={t.totalTestsDesc}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">{t.totalTests}</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{summary.totalTests}</p>
        </div>

        <div 
          className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 cursor-help hover:shadow-md transition-shadow"
          title={t.passRateDesc}
        >
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="w-4 h-4 text-purple-500" />
            <p className="text-sm text-gray-600 dark:text-gray-400">{t.passRate}</p>
          </div>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{summary.passRate}%</p>
        </div>

        <div 
          className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 cursor-help hover:shadow-md transition-shadow"
          title={t.avgResponseDesc}
        >
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">{t.avgResponse}</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{summary.avgResponseTime || 0}ms</p>
        </div>

        <div 
          className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 cursor-help hover:shadow-md transition-shadow"
          title={t.avgThroughputDesc}
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-purple-500" />
            <p className="text-sm text-gray-600 dark:text-gray-400">{t.avgThroughput}</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{summary.avgThroughput || 0}</p>
        </div>
      </div>

      <button
        onClick={loadSummary}
        className="mt-4 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
      >
        ↻ Refresh
      </button>
    </div>
  )
}
