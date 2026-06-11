import React, { useState, useEffect } from 'react'
import apiClient from '../services/api'
import { Clock } from 'lucide-react'

const i18n = {
    scanHistory: 'Scan History',
    loadingHistory: 'Loading history...',
    noScans: 'No scans yet',
    scan: 'Scan',
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
  
}

export default function SecurityHistory({ scenario }) {
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
      const response = await apiClient.get(`/security/history/${scenario.id}`, {
        params: { limit: 10 }
      })
      setHistory(response.data.data || [])
    } catch (err) {
      console.error('Failed to load security history:', err)
    } finally {
      setLoading(false)
    }
  }

  const getRiskBadgeColor = (riskScore) => {
    if (riskScore >= 80) return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
    if (riskScore >= 60) return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100'
    if (riskScore >= 40) return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'
    if (riskScore >= 20) return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100'
    return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      COMPLETED: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100',
      RUNNING: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100',
      PENDING: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100',
      FAILED: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
    }
    return statusMap[status] || statusMap.PENDING
  }

  return (
    <div className="bg-white dark:bg-[#1A1A1C] html.theme-light:bg-white rounded-lg shadow border border-[#E0E0E2] dark:border-[#2D2D2F] html.theme-light:border-[#DDDDE0] p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.scanHistory}</h2>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t.loadingHistory}</p>
      ) : history.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t.noScans}</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {history.map((scan, index) => (
            <div
              key={scan.id}
              className="border border-[#E0E0E2] dark:border-[#2D2D2F] html.theme-light:border-[#DDDDE0] rounded-lg p-3 hover:border-[#DDDDE0] dark:hover:border-[#3D3D3F] html.theme-light:hover:border-[#CCCCCC] transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t.scan} {history.length - index}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(scan.createdAt).toLocaleDateString()} {new Date(scan.createdAt).toLocaleTimeString()}
                  </div>
                </div>
                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(scan.status)}`}>
                  {scan.status}
                </span>
              </div>

              {/* Findings Summary */}
              <div className="space-y-1">
                {scan.criticalCount > 0 && (
                  <div className="text-xs flex items-center gap-2">
                    <span className="w-4 h-4 bg-red-500 rounded-full"></span>
                    <span className="text-gray-600 dark:text-gray-300">{scan.criticalCount} {t.critical}</span>
                  </div>
                )}
                {scan.highCount > 0 && (
                  <div className="text-xs flex items-center gap-2">
                    <span className="w-4 h-4 bg-orange-500 rounded-full"></span>
                    <span className="text-gray-600 dark:text-gray-300">{scan.highCount} {t.high}</span>
                  </div>
                )}
                {scan.mediumCount > 0 && (
                  <div className="text-xs flex items-center gap-2">
                    <span className="w-4 h-4 bg-yellow-500 rounded-full"></span>
                    <span className="text-gray-600 dark:text-gray-300">{scan.mediumCount} {t.medium}</span>
                  </div>
                )}
              </div>

              {/* Risk Score */}
              <div className="mt-2">
                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getRiskBadgeColor(scan.riskScore)}`}>
                  Risk: {scan.riskScore.toFixed(1)}
                </span>
              </div>

              {/* Findings Count */}
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                {scan.findingsCount} total findings
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
