import React, { useState } from 'react'
import apiClient from '../services/api'
import { Play, Loader } from 'lucide-react'
import { useSettingsStore } from '../store/settingsStore'

const i18n = {
  en: {
    startScan: 'Start Security Scan',
    scanType: 'Scan Type',
    fullScan: 'Full Scan',
    quickScan: 'Quick Scan',
    custom: 'Custom',
    selectVulnerabilities: 'Select Vulnerabilities',
    target: 'Target',
    steps: 'steps',
    scanning: 'Scanning...',
  },
  id: {
    startScan: 'Mulai Pemindaian Keamanan',
    scanType: 'Jenis Pemindaian',
    fullScan: 'Pemindaian Lengkap',
    quickScan: 'Pemindaian Cepat',
    custom: 'Kustom',
    selectVulnerabilities: 'Pilih Kerentanan',
    target: 'Target',
    steps: 'langkah',
    scanning: 'Memindai...',
  },
}

export default function SecurityScanRunner({ scenario, onScanComplete }) {
  const [scanning, setScanning] = useState(false)
  const [scanType, setScanType] = useState('full')
  const [selectedVulnTypes, setSelectedVulnTypes] = useState([])
  const [progress, setProgress] = useState(0)
  const { language } = useSettingsStore()
  const t = i18n[language] || i18n.id

  const vulnerabilityTypes = [
    { id: 'SQL_INJECTION', name: 'SQL Injection', severity: 'CRITICAL' },
    { id: 'XSS', name: 'Cross-Site Scripting', severity: 'MEDIUM' },
    { id: 'COMMAND_INJECTION', name: 'Command Injection', severity: 'CRITICAL' },
    { id: 'WEAK_AUTHENTICATION', name: 'Weak Authentication', severity: 'HIGH' },
    { id: 'MISSING_SECURITY_HEADERS', name: 'Missing Headers', severity: 'MEDIUM' },
    { id: 'SSL_TLS_MISCONFIGURATION', name: 'SSL/TLS Issues', severity: 'HIGH' }
  ]

  const handleRunScan = async () => {
    try {
      setScanning(true)
      setProgress(10)

      const response = await apiClient.post('/security/scan', {
        scenarioId: scenario.id,
        scanType,
        vulnTypes: scanType === 'custom' ? selectedVulnTypes : []
      })

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 20, 90))
      }, 500)

      // Poll for scan completion
      const pollScan = async () => {
        try {
          const checkResponse = await apiClient.get(`/security/scans/${response.data.data.id}`)
          if (checkResponse.data.data.status === 'COMPLETED' || checkResponse.data.data.status === 'FAILED') {
            clearInterval(progressInterval)
            setProgress(100)
            
            setTimeout(() => {
              setScanning(false)
              setProgress(0)
              onScanComplete(checkResponse.data.data)
            }, 500)
          } else {
            setTimeout(pollScan, 1000)
          }
        } catch (err) {
          clearInterval(progressInterval)
          console.error('Error checking scan status:', err)
        }
      }

      pollScan()
    } catch (err) {
      console.error('Failed to start security scan:', err)
      alert(`Failed to start scan: ${err.response?.data?.message || err.message}`)
      setScanning(false)
      setProgress(0)
    }
  }

  const handleVulnTypeToggle = (vulnType) => {
    setSelectedVulnTypes(prev =>
      prev.includes(vulnType)
        ? prev.filter(v => v !== vulnType)
        : [...prev, vulnType]
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.startScan}</h2>

      {/* Scan Type Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.scanType}</label>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setScanType('full')}
            disabled={scanning}
            className={`flex-1 min-w-fit px-4 py-2 rounded-lg transition-colors font-medium ${
              scanType === 'full'
                ? 'scan-type-btn-selected'
                : 'scan-type-btn-unselected'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {t.fullScan}
          </button>
          <button
            onClick={() => setScanType('quick')}
            disabled={scanning}
            className={`flex-1 min-w-fit px-4 py-2 rounded-lg transition-colors font-medium ${
              scanType === 'quick'
                ? 'scan-type-btn-selected'
                : 'scan-type-btn-unselected'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {t.quickScan}
          </button>
          <button
            onClick={() => setScanType('custom')}
            disabled={scanning}
            className={`flex-1 min-w-fit px-4 py-2 rounded-lg transition-colors font-medium ${
              scanType === 'custom'
                ? 'scan-type-btn-selected'
                : 'scan-type-btn-unselected'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {t.custom}
          </button>
        </div>
      </div>

      {/* Custom Vulnerability Selection */}
      {scanType === 'custom' && (
        <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.selectVulnerabilities}</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {vulnerabilityTypes.map(vulnType => (
              <label key={vulnType.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedVulnTypes.includes(vulnType.id)}
                  onChange={() => handleVulnTypeToggle(vulnType.id)}
                  disabled={scanning}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm dark:text-gray-200">
                  {vulnType.name}
                  <span className={`ml-1 text-xs font-semibold ${
                    vulnType.severity === 'CRITICAL' ? 'text-red-600 dark:text-red-400' :
                    vulnType.severity === 'HIGH' ? 'text-orange-600 dark:text-orange-400' :
                    'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    ({vulnType.severity})
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Scan Details */}
      <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-3 text-sm">
        <p className="text-blue-800 dark:text-blue-200">
          <strong>{t.target}:</strong> {scenario.name} ({scenario.steps?.length || 0} {t.steps})
        </p>
      </div>

      {/* Progress Bar */}
      {scanning && progress > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Scanning...</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-red-500 dark:bg-red-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Run Button */}
      <button
        onClick={handleRunScan}
        disabled={scanning || (scanType === 'custom' && selectedVulnTypes.length === 0)}
        className={`w-full px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
          scanning || (scanType === 'custom' && selectedVulnTypes.length === 0)
            ? 'test-btn-disabled cursor-not-allowed opacity-50'
            : 'test-action-btn-security hover:shadow'
        }`}
      >
        {scanning ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            {t.scanning}
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            {t.startScan}
          </>
        )}
      </button>
    </div>
  )
}
