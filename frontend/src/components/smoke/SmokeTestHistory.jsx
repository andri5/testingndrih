import React, { useState, useEffect } from 'react'
import apiClient from '../services/api'
import { Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react'

const i18n = { recentTests: 'Recent Tests', failed: 'FAILED', passed: 'PASSED' 
}

export default function SmokeTestHistory({ scenarioId }) {
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)  const t = i18n

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
      <div className="bg-[#1A1A1C] html.theme-light:bg-white rounded-lg shadow p-6 border border-[#2D2D2F] html.theme-light:border-[#DDDDE0]">
        <h3 className="text-lg font-semibold text-[#E0E0E2] html.theme-light:text-[#1A1A1C] mb-4">
          {t.recentTests}
        </h3>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-[#2D2D2F] html.theme-light:bg-[#F0F0F2] rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-[#1A1A1C] html.theme-light:bg-white rounded-lg shadow p-6 border border-[#2D2D2F] html.theme-light:border-[#DDDDE0]">
        <div className="flex items-center gap-2 text-red-600 html.theme-light:text-red-500">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#1A1A1C] html.theme-light:bg-white rounded-lg shadow p-6 border border-[#2D2D2F] html.theme-light:border-[#DDDDE0]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#E0E0E2] html.theme-light:text-[#1A1A1C] flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-500" />
          {t.recentTests}
        </h3>
        <span className="text-sm text-[#8A8A8F] html.theme-light:text-[#888]">Last 10 runs</span>
      </div>

      {history.length === 0 ? (
        <p className="text-center text-[#8A8A8F] html.theme-light:text-[#888] py-8">No tests run yet</p>
      ) : (
        <div className="space-y-2">
          {history.map((test) => (
            <div
              key={test.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                test.status === 'PASSED'
                  ? 'test-history-card-passed'
                  : test.status === 'FAILED'
                  ? 'test-history-card-failed'
                  : 'test-history-card-default'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                {test.status === 'PASSED' ? (
                  <CheckCircle className="w-5 h-5 text-green-500 html.theme-light:text-green-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 html.theme-light:text-red-600 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#E0E0E2] html.theme-light:text-[#1A1A1C]">
                    {test.passedSteps}/{test.totalSteps} steps
                  </p>
                  <p className="text-xs text-[#8A8A8F] html.theme-light:text-[#888] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(test.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-sm font-semibold ${
                  test.status === 'PASSED'
                    ? 'text-green-400 html.theme-light:text-green-600'
                    : 'text-red-400 html.theme-light:text-red-600'
                }`}>
                  {t[test.status === 'PASSED' ? 'passed' : 'failed']}
                </span>
                <p className="text-xs text-[#8A8A8F] html.theme-light:text-[#888]">
                  {(test.duration / 1000).toFixed(2)}s
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={loadHistory}
        className="w-full mt-4 text-sm text-orange-500 html.theme-light:text-orange-600 hover:text-orange-400 html.theme-light:hover:text-orange-700 font-medium py-2 transition-colors"
      >
        Refresh
      </button>
    </div>
  )
}
