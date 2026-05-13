import React from 'react'
import { useSettingsStore } from '../store/settingsStore'

const i18n = {
  en: {
    minResponse: 'Min Response',
    avgResponse: 'Avg Response',
    maxResponse: 'Max Response',
    median: 'Median',
    throughput: 'Throughput',
    errorRate: 'Error Rate',
    executionsPerSec: 'executions/sec',
    percent: '%',
  },
  id: {
    minResponse: 'Respons Min',
    avgResponse: 'Respons Rata-rata',
    maxResponse: 'Respons Max',
    median: 'Median',
    throughput: 'Throughput',
    errorRate: 'Tingkat Error',
    executionsPerSec: 'eksekusi/dtk',
    percent: '%',
  },
}

export default function StressTestMetrics({ metrics }) {
  const { language } = useSettingsStore()
  const t = i18n[language] || i18n.id
  
  if (!metrics) return null

  return (
    <div className="space-y-4 text-sm">
      {/* Response Times */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white bg-opacity-50 p-3 sm:p-4 rounded shadow hover:shadow-md transition-shadow">
          <div className="text-gray-600 text-xs font-medium">{t.minResponse}</div>
          <div className="font-semibold text-lg sm:text-xl mt-1">{metrics.responseTimeMin}ms</div>
        </div>
        <div className="bg-white dark:bg-gray-800 bg-opacity-50 dark:bg-opacity-50 p-3 rounded shadow hover:shadow-md transition-shadow">
          <div className="text-gray-600 dark:text-gray-300 text-xs font-medium\">{t.avgResponse}</div>
          <div className="font-semibold text-lg mt-1 dark:text-white\">{metrics.responseTimeAvg}ms</div>
        </div>
        <div className="bg-white dark:bg-gray-800 bg-opacity-50 dark:bg-opacity-50 p-3 rounded shadow hover:shadow-md transition-shadow">
          <div className="text-gray-600 dark:text-gray-300 text-xs font-medium\">{t.maxResponse}</div>
          <div className="font-semibold text-lg mt-1 dark:text-white\">{metrics.responseTimeMax}ms</div>
        </div>
      </div>

      {/* Percentiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-800 bg-opacity-50 dark:bg-opacity-50 p-3 rounded shadow hover:shadow-md transition-shadow">
          <div className="text-gray-600 dark:text-gray-300 text-xs font-medium">P50 ({t.median})</div>
          <div className="font-semibold text-lg mt-1 dark:text-white">{metrics.responseTimeP50}ms</div>
        </div>
        <div className="bg-white dark:bg-gray-800 bg-opacity-50 dark:bg-opacity-50 p-3 rounded shadow hover:shadow-md transition-shadow">
          <div className="text-gray-600 dark:text-gray-300 text-xs font-medium">P95</div>
          <div className="font-semibold text-lg mt-1 dark:text-white">{metrics.responseTimeP95}ms</div>
        </div>
        <div className="bg-white dark:bg-gray-800 bg-opacity-50 dark:bg-opacity-50 p-3 rounded shadow hover:shadow-md transition-shadow">
          <div className="text-gray-600 dark:text-gray-300 text-xs font-medium">P99</div>
          <div className="font-semibold text-lg mt-1 dark:text-white">{metrics.responseTimeP99}ms</div>
        </div>
      </div>

      {/* Performance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white dark:bg-gray-800 bg-opacity-50 dark:bg-opacity-50 p-3 rounded shadow hover:shadow-md transition-shadow">
          <div className="text-gray-600 dark:text-gray-300 text-xs font-medium">{t.throughput}</div>
          <div className="font-semibold text-lg mt-1 dark:text-white">{metrics.throughput.toFixed(2)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{t.executionsPerSec}</div>
        </div>
        <div className={`p-3 rounded shadow hover:shadow-md transition-shadow ${
          metrics.errorRate < 5 ? 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100' : metrics.errorRate < 20 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100' : 'bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100'
        }`}>
          <div className="text-xs font-medium">{t.errorRate}</div>
          <div className="font-semibold">{metrics.errorRate.toFixed(2)}%</div>
        </div>
      </div>

      {/* Performance Bar */}
      <div className="bg-white dark:bg-gray-800 bg-opacity-50 dark:bg-opacity-50 p-3 rounded">
        <div className="text-gray-600 dark:text-gray-300 text-xs mb-2">Response Time Distribution</div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className="bg-orange-500 dark:bg-orange-600 h-full"
            style={{
              width: `${Math.min(100, (metrics.responseTimeAvg / metrics.responseTimeMax) * 100)}%`
            }}
          />
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {metrics.responseTimeMin}ms ← → {metrics.responseTimeMax}ms
        </div>
      </div>
    </div>
  )
}
