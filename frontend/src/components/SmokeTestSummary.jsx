import React, { useState, useEffect } from 'react'
import apiClient from '../services/api'
import { AlertCircle, CheckCircle2, Clock, TrendingUp } from 'lucide-react'
import { useSettingsStore } from '../store/settingsStore'

const i18n = {
  en: { 
    totalTests: 'Total Tests', 
    passRate: 'Pass Rate', 
    avgDuration: 'Avg Duration',
    totalTestsDesc: 'Total smoke tests executed',
    passRateDesc: 'Percentage of successful tests',
    avgDurationDesc: 'Average execution time per test'
  },
  id: { 
    totalTests: 'Total Tes', 
    passRate: 'Tingkat Keberhasilan', 
    avgDuration: 'Durasi Rata-rata',
    totalTestsDesc: 'Total tes smoke yang dijalankan',
    passRateDesc: 'Persentase tes yang berhasil',
    avgDurationDesc: 'Rata-rata waktu eksekusi per tes'
  },
}

export default function SmokeTestSummary() {
  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const { language } = useSettingsStore()
  const t = i18n[language] || i18n.id

  useEffect(() => {
    loadSummary()
  }, [])

  const loadSummary = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get('/smoke/summary')
      setSummary(response.data.data)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800">
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3 animate-pulse" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    )
  }

  if (!summary) return null

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Smoke Test Summary</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Core functionality validation</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <CheckCircle2 className="w-4 h-4 text-orange-500" />
            <p className="text-sm text-gray-600 dark:text-gray-400">{t.passRate}</p>
          </div>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{summary.passRate}%</p>
        </div>

        <div 
          className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 cursor-help hover:shadow-md transition-shadow"
          title={t.avgDurationDesc}
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">{t.avgDuration}</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{(summary.avgDuration / 1000).toFixed(1)}s</p>
        </div>
      </div>

      <button
        onClick={loadSummary}
        className="mt-4 text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium"
      >
        ↻ Refresh
      </button>
    </div>
  )
}
