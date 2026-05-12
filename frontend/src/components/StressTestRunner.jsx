import React, { useState } from 'react'
import apiClient from '../services/api'
import StressTestMetrics from './StressTestMetrics'
import { Play, RotateCcw, Zap } from 'lucide-react'
import { useSettingsStore } from '../store/settingsStore'

const i18n = {
  en: {
    selectLoadProfile: 'Select Load Profile',
    light: 'Light',
    medium: 'Medium',
    heavy: 'Heavy',
    extreme: 'Extreme',
    start: 'Start Stress Test',
    running: 'Running...',
    reset: 'Reset',
    passed: 'Stress Test PASSED',
    failed: 'Stress Test FAILED',
  },
  id: {
    selectLoadProfile: 'Pilih Profil Beban',
    light: 'Ringan',
    medium: 'Sedang',
    heavy: 'Berat',
    extreme: 'Ekstrem',
    start: 'Mulai Tes Stress',
    running: 'Menjalankan...',
    reset: 'Setel Ulang',
    passed: 'Tes Stress BERHASIL',
    failed: 'Tes Stress GAGAL',
  },
}

export default function StressTestRunner({ scenario, onTestComplete }) {
  const [stressProfile, setStressProfile] = useState('LIGHT')
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const { language } = useSettingsStore()
  const t = i18n[language] || i18n.id

  const PROFILES = [
    { key: 'LIGHT', label: 'Light', desc: '2 concurrent × 3 iterations', time: '10m' },
    { key: 'MEDIUM', label: 'Medium', desc: '5 concurrent × 5 iterations', time: '15m' },
    { key: 'HEAVY', label: 'Heavy', desc: '10 concurrent × 10 iterations', time: '20m' },
    { key: 'EXTREME', label: 'Extreme', desc: '20 concurrent × 20 iterations', time: '30m' }
  ]

  const handleStartTest = async () => {
    try {
      setIsRunning(true)
      setError(null)

      const response = await apiClient.post('/stress', {
        scenarioId: scenario.id,
        profile: stressProfile
      })

      setResult(response.data.data)
      onTestComplete?.()
    } catch (err) {
      console.error('Failed to start stress test:', err)
      setError(err.response?.data?.message || 'Failed to start stress test')
    } finally {
      setIsRunning(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 space-y-6">
      {/* Profile Selection */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">{t.selectLoadProfile}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {PROFILES.map(profile => (
            <button
              key={profile.key}
              onClick={() => setStressProfile(profile.key)}
              disabled={isRunning}
              className={`p-3 rounded-lg text-left transition-all shadow-sm hover:shadow ${
                stressProfile === profile.key
                  ? 'bg-purple-500 text-white border-2 border-purple-600 shadow dark:bg-purple-700 dark:border-purple-500'
                  : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600'
              } disabled:opacity-50`}
            >
              <div className="font-semibold text-sm truncate dark:text-white">{profile.label}</div>
              <div className="text-xs opacity-75 line-clamp-2 dark:text-gray-300">{profile.desc}</div>
              <div className="text-xs opacity-75 mt-1 dark:text-gray-300">{profile.time}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Test Result */}
      {result && (
        <div className={`p-4 rounded-lg ${
          result.status === 'PASSED'
            ? 'bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700'
            : 'bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <Zap className={`w-5 h-5 ${result.status === 'PASSED' ? 'text-green-600' : 'text-red-600'}`} />
            <span className={`font-semibold text-lg ${
              result.status === 'PASSED' ? 'text-green-700 dark:text-green-100' : 'text-red-700 dark:text-red-100'
            }`}>
              {result.status === 'PASSED' ? '✅ ' + t.passed : '❌ ' + t.failed}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
            <div>
              <div className="text-gray-600 dark:text-gray-300">Executions</div>
              <div className="font-semibold dark:text-white">{result.totalExecutions}</div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-300">Passed</div>
              <div className="font-semibold text-green-600 dark:text-green-400">{result.passedCount}</div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-300">Failed</div>
              <div className="font-semibold text-red-600 dark:text-red-400">{result.failedCount}</div>
            </div>
          </div>

          {result.metrics && (
            <StressTestMetrics metrics={result.metrics} />
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
          <div className="font-semibold text-red-900 dark:text-red-100 mb-2">⚠️ Error</div>
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleStartTest}
          disabled={isRunning}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 dark:bg-purple-700 text-white rounded-lg font-semibold shadow hover:shadow-md hover:bg-purple-600 dark:hover:bg-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-4 h-4" />
          {isRunning ? t.running : t.start}
        </button>
        {result && (
          <button
            onClick={handleReset}
            disabled={isRunning}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow hover:shadow-md transition-all disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            {t.reset}
          </button>
        )}
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        💡 Stress tests run multiple concurrent instances repeatedly to measure performance under load. 
        This may take 10-30 minutes depending on the profile selected.
      </p>
    </div>
  )
}
