import React, { useState, useEffect } from 'react'
import apiClient from '../services/api'
import { Clock, RefreshCw } from 'lucide-react'

const i18n = { recentTests: 'Recent Tests', noTests: 'No tests yet', profile: 'Profile', status: 'Status', duration: 'Duration' 
}

export default function StressTestHistory({ scenario }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)  const t = i18n

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
    <div className="bg-[#1A1A1C] html.theme-light:bg-white rounded-lg shadow border border-[#2D2D2F] html.theme-light:border-[#DDDDE0] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#8A8A8F] html.theme-light:text-[#888]" />
          <h3 className="font-semibold text-[#E0E0E2] html.theme-light:text-[#1A1A1C]">{t.recentTests}</h3>
        </div>
        <button
          onClick={loadHistory}
          className="p-1 hover:bg-[#2D2D2F] html.theme-light:hover:bg-[#F0F0F2] rounded transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-[#8A8A8F] html.theme-light:text-[#888]" />
        </button>
      </div>

      <div className="text-xs text-[#8A8A8F] html.theme-light:text-[#888] px-2">Last 10 runs</div>

      {loading ? (
        <p className="text-sm text-[#8A8A8F] html.theme-light:text-[#888] text-center py-4">Loading...</p>
      ) : history.length === 0 ? (
        <p className="text-sm text-[#8A8A8F] html.theme-light:text-[#888] text-center py-4">{t.noTests}</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {history.map((test, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg text-xs ${
                test.status === 'PASSED'
                  ? 'test-history-card-passed'
                  : 'test-history-card-failed'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-[#E0E0E2] html.theme-light:text-[#1A1A1C]">
                  {test.status === 'PASSED' ? '✅' : '❌'} {test.profile}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-2 text-[#8A8A8F] html.theme-light:text-[#555]">
                <div>
                  <div className="opacity-75">Load</div>
                  <div className="font-semibold text-[#E0E0E2] html.theme-light:text-[#1A1A1C]">
                    {test.concurrency}×{test.iterations}
                  </div>
                </div>
                <div>
                  <div className="opacity-75">Duration</div>
                  <div className="font-semibold text-[#E0E0E2] html.theme-light:text-[#1A1A1C]">
                    {formatDuration(test.duration)}
                  </div>
                </div>
              </div>

              {test.metrics && (
                <div className="grid grid-cols-2 gap-2 text-xs text-[#8A8A8F] html.theme-light:text-[#888]">
                  <div>Avg: {test.metrics.responseTimeAvg}ms</div>
                  <div>Error: {test.metrics.errorRate.toFixed(1)}%</div>
                </div>
              )}

              <div className="text-[#8A8A8F] html.theme-light:text-[#888] mt-2 text-xs">
                {formatDate(test.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={loadHistory}
        className="w-full py-2 text-sm text-purple-500 html.theme-light:text-purple-600 hover:text-purple-400 html.theme-light:hover:text-purple-700 rounded transition-colors font-medium"
      >
        Refresh
      </button>
    </div>
  )
}
