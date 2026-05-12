import React, { useState, useEffect } from 'react'
import apiClient from '../services/api'
import { Clock, RefreshCw } from 'lucide-react'
import { useSettingsStore } from '../store/settingsStore'

const i18n = {
  en: { recentTests: 'Recent Tests', noTests: 'No tests yet', profile: 'Profile', status: 'Status', duration: 'Duration' },
  id: { recentTests: 'Tes Terakhir', noTests: 'Belum ada tes', profile: 'Profil', status: 'Status', duration: 'Durasi' },
}

export default function StressTestHistory({ scenario }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const { language } = useSettingsStore()
  const t = i18n[language] || i18n.id

  useEffect(() => {
    if (scenario?.id) {
      loadHistory()
    }
  }, [scenario?.id])

  const loadHistory = async () => {
    if (!scenario?.id) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const response = await apiClient.get(`/stress/history/${scenario.id}?limit=10`)
      setHistory(response.data.data || [])
    } catch (err) {
      console.error('Failed to load history:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ${seconds % 60}s`
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">{t.recentTests}</h3>
        </div>
        <button
          onClick={loadHistory}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4 dark:text-gray-400" />
        </button>
      </div>

      <div className="text-xs text-gray-600 dark:text-gray-400 px-2">Last 10 runs</div>

      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Loading...</p>
      ) : history.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">{t.noTests}</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {history.map((test, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg text-xs ${
                test.status === 'PASSED'
                  ? 'bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700'
                  : 'bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold dark:text-white">
                  {test.status === 'PASSED' ? '✅' : '❌'} {test.profile}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-2 text-gray-600 dark:text-gray-300">
                <div>
                  <div className="opacity-75">Load</div>
                  <div className="font-semibold text-gray-800 dark:text-gray-100">
                    {test.concurrency}×{test.iterations}
                  </div>
                </div>
                <div>
                  <div className="opacity-75">Duration</div>
                  <div className="font-semibold text-gray-800 dark:text-gray-100">
                    {formatDuration(test.duration)}
                  </div>
                </div>
              </div>

              {test.metrics && (
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <div>Avg: {test.metrics.responseTimeAvg}ms</div>
                  <div>Error: {test.metrics.errorRate.toFixed(1)}%</div>
                </div>
              )}

              <div className="text-gray-500 dark:text-gray-400 mt-2 text-xs">
                {formatDate(test.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={loadHistory}
        className="w-full py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-700 rounded transition-colors"
      >
        Refresh
      </button>
    </div>
  )
}
