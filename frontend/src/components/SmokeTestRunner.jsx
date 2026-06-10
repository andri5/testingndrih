import React, { useState, useEffect } from 'react'
import apiClient from '../services/api'
import { AlertCircle, CheckCircle, Zap, Clock, Play, RotateCcw } from 'lucide-react'
import { useSettingsStore } from '../store/settingsStore'

const i18n = {
  en: {
    smokeTest: 'Smoke Test',
    description: 'Quick deployment validation',
    stepsPassed: 'Steps Passed',
    duration: 'Duration',
    timestamp: 'Timestamp',
    notifyCheckbox: 'Send email notification when complete',
    startTest: 'Start Smoke Test',
    running: 'Running...',
    reset: 'Reset',
    testPassed: 'PASSED',
    testFailed: 'FAILED',
  },
  id: {
    smokeTest: 'Pengujian Smoke',
    description: 'Validasi penyebaran cepat',
    stepsPassed: 'Langkah Berhasil',
    duration: 'Durasi',
    timestamp: 'Waktu Stempel',
    notifyCheckbox: 'Kirim notifikasi email setelah selesai',
    startTest: 'Mulai Pengujian Smoke',
    running: 'Menjalankan...',
    reset: 'Setel Ulang',
    testPassed: 'BERHASIL',
    testFailed: 'GAGAL',
  },
}

export default function SmokeTestRunner({ scenarioId, scenarioName, onTestComplete }) {
  const [isRunning, setIsRunning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastResult, setLastResult] = useState(null)
  const [notifyOnComplete, setNotifyOnComplete] = useState(false)
  const { language } = useSettingsStore()
  const t = i18n[language] || i18n.en

  const handleStartTest = async () => {
    try {
      setIsRunning(true)
      setError(null)
      setIsLoading(true)

      const response = await apiClient.post('/smoke', {
        scenarioId,
        notifyOnComplete
      })

      setLastResult(response.data.data)
      if (onTestComplete) {
        onTestComplete(response.data.data)
      }

      setIsRunning(false)
    } catch (err) {
      setError(err.response?.data?.message || err.message)
      setIsRunning(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetTest = () => {
    setLastResult(null)
    setError(null)
  }

  return (
    <div className="bg-[#1A1A1C] html.theme-light:bg-white rounded-lg shadow p-6 border border-[#2D2D2F] html.theme-light:border-[#DDDDE0]">
      <div className="flex items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Zap className="w-6 h-6 text-orange-500 flex-shrink-0" />
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-[#E0E0E2] html.theme-light:text-[#1A1A1C] truncate">
              {t.smokeTest}
            </h3>
            <p className="text-sm text-[#8A8A8F] html.theme-light:text-[#666] truncate">{t.description}</p>
          </div>
        </div>
      </div>

      {/* Status Display */}
      {lastResult && (
        <div className={`mb-6 p-4 rounded-lg border-2 ${
          lastResult.status === 'SMOKE_PASSED'
            ? 'bg-[#0F170F] html.theme-light:bg-[#ECFDF5] border-green-600 html.theme-light:border-green-200'
            : 'bg-[#170F0F] html.theme-light:bg-[#FEF2F2] border-red-600 html.theme-light:border-red-200'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            {lastResult.status === 'SMOKE_PASSED' ? (
              <CheckCircle className="w-5 h-5 text-green-500 html.theme-light:text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500 html.theme-light:text-red-600" />
            )}
            <span className={`font-semibold ${
              lastResult.status === 'SMOKE_PASSED'
                ? 'text-green-400 html.theme-light:text-green-700'
                : 'text-red-400 html.theme-light:text-red-700'
            }`}>
              Test {lastResult.status === 'SMOKE_PASSED' ? t.testPassed : t.testFailed}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-sm">
            <div>
              <span className="text-[#8A8A8F] html.theme-light:text-[#666]">{t.stepsPassed}:</span>
              <p className="font-semibold text-lg text-green-500 html.theme-light:text-green-600">
                {lastResult.passed}/{lastResult.passed + lastResult.failed}
              </p>
            </div>
            <div>
              <span className="text-[#8A8A8F] html.theme-light:text-[#666]">{t.duration}:</span>
              <p className="font-semibold text-lg text-blue-500 html.theme-light:text-blue-600 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {(lastResult.duration / 1000).toFixed(2)}s
              </p>
            </div>
            <div>
              <span className="text-[#8A8A8F] html.theme-light:text-[#666]">{t.timestamp}:</span>
              <p className="font-semibold text-sm text-[#A0A0A4] html.theme-light:text-[#777] truncate">
                {new Date(lastResult.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-[#2D0D0D] html.theme-light:bg-[#FEF2F2] border border-[#5E1515] html.theme-light:border-[#FCA5A5]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 html.theme-light:text-red-600" />
            <span className="text-red-400 html.theme-light:text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Notify Checkbox */}
      <div className="mb-6 flex items-center gap-2">
        <input
          type="checkbox"
          id="notifyCheckbox"
          checked={notifyOnComplete}
          onChange={(e) => setNotifyOnComplete(e.target.checked)}
          disabled={isRunning}
          className="w-4 h-4 rounded border-[#2D2D2F] text-orange-500 focus:ring-orange-500"
        />
        <label htmlFor="notifyCheckbox" className="text-sm text-[#A0A0A4]">
          {t.notifyCheckbox}
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleStartTest}
          disabled={isRunning || isLoading}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium shadow hover:shadow-md transition-all ${
            isRunning || isLoading
              ? 'test-btn-disabled cursor-not-allowed'
              : 'test-action-btn-primary hover:shadow'
          }`}
        >
          <Play className="w-4 h-4" />
          {isLoading ? t.running : t.startTest}
        </button>

        {lastResult && (
          <button
            onClick={handleResetTest}
            disabled={isRunning}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-[#A0A0A4] bg-[#2D2D2F] hover:bg-[#3D3D3F] shadow hover:shadow-md transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            {t.reset}
          </button>
        )}
      </div>

      {/* Info Text */}
      <p className="text-xs text-[#8A8A8F] mt-4">
        💡 Smoke tests run critical paths only (~2-5 minutes). Perfect for quick deployment validation.
      </p>
    </div>
  )
}
