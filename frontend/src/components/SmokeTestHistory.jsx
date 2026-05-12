import React, { useState, useEffect } from 'react'
import apiClient from '../services/api'
import { Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react'
import { useSettingsStore } from '../store/settingsStore'

const i18n = {
  en: { recentTests: 'Recent Tests', failed: 'FAILED', passed: 'PASSED' },
  id: { recentTests: 'Tes Terbaru', failed: 'GAGAL', passed: 'BERHASIL' },
}

export default function SmokeTestHistory({ scenarioId }) {
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const { language } = useSettingsStore()
  const t = i18n[language] || i18n.en

  useEffect(() => {
    loadHistory()
  }, [scenarioId])

  const loadHistory = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get(
        `/smoke/history/${scenarioId}?limit=10`
      )
      setHistory(response.data.data)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t.recentTests}
        </h3>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-500" />
          Recent Tests
        </h3>
        <span className="text-sm text-gray-500">Last 10 runs</span>
      </div>

      {history.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No tests run yet</p>
      ) : (
        <div className="space-y-2">
          {history.map((test) => (
            <div
              key={test.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                test.status === 'PASSED'
                  ? 'bg-green-50 border-green-200'
                  : test.status === 'FAILED'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                {test.status === 'PASSED' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">
                    {test.passedSteps}/{test.totalSteps} steps
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(test.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-sm font-semibold ${
                  test.status === 'PASSED'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {test.status}
                </span>
                <p className="text-xs text-gray-500">
                  {(test.duration / 1000).toFixed(2)}s
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={loadHistory}
        className="w-full mt-4 text-sm text-orange-600 hover:text-orange-700 font-medium py-2"
      >
        Refresh
      </button>
    </div>
  )
}
