import { useState, useEffect } from 'react'
import { Button, Alert, Spinner } from './ui'
import { useExecutionStore } from '../store/executionStore'
import { useSettingsStore } from '../store/settingsStore'
import { environmentAPI } from '../services/api'

export function ExecuteScenarioButton({ scenarioId, scenarioName, onExecutionStart = null }) {
  const { isRunning, executeScenario, clearError, error } = useExecutionStore()
  const { theme, language, selectedEnvironmentId, setSelectedEnvironmentId } = useSettingsStore()
  const isDark = theme !== 'light'
  const [showConfirm, setShowConfirm] = useState(false)
  const [browser, setBrowser] = useState('chromium')
  const [headless, setHeadless] = useState(false)
  const [environments, setEnvironments] = useState([])
  const [environmentId, setEnvironmentId] = useState(selectedEnvironmentId || '')

  useEffect(() => {
    if (!showConfirm) return
    environmentAPI.list().then((res) => {
      const list = res.data.environments || []
      setEnvironments(list)
      if (!environmentId && list.length) {
        const def = list.find((e) => e.isDefault) || list[0]
        setEnvironmentId(def.id)
      }
    }).catch(() => {})
  }, [showConfirm])

  const envLabel = language === 'id' ? 'Environment' : 'Environment'

  const handleExecute = async () => {
    try {
      if (environmentId) setSelectedEnvironmentId(environmentId)
      await executeScenario(scenarioId, {
        browser,
        headless,
        environmentId: environmentId || undefined
      })
      setShowConfirm(false)
      if (onExecutionStart) {
        onExecutionStart()
      }
    } catch (err) {
      console.error('Execution error:', err)
    }
  }

  return (
    <>
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={clearError}
        />
      )}

      {showConfirm ? (
        <div className={`p-4 rounded-lg space-y-3 border ${
          isDark
            ? 'bg-[#1A1A1C] border-[#2D2D2F]'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <p className={`text-sm font-medium ${
            isDark ? 'text-[#E0E0E2]' : 'text-blue-900'
          }`}>
            Execute: <strong>{scenarioName}</strong>
          </p>
          {/* Browser & headless options */}
          <div className="flex flex-wrap gap-3">
            <div>
              <label className={`text-xs font-semibold block mb-1 ${
                isDark ? 'text-[#8A8A8F]' : 'text-gray-600'
              }`}>Browser</label>
              <select
                value={browser}
                onChange={e => setBrowser(e.target.value)}
                className={`text-sm rounded px-2 py-1 focus:outline-none focus:ring-1 ${
                  isDark
                    ? 'bg-[#0F0E11] border border-[#2D2D2F] text-[#E0E0E2] focus:ring-[#5E6AD2]'
                    : 'border border-gray-300 text-gray-900 focus:ring-indigo-500'
                }`}
              >
                <option value="chromium">Chromium</option>
                <option value="firefox">Firefox</option>
                <option value="webkit">WebKit</option>
              </select>
            </div>
            <div>
              <label className={`text-xs font-semibold block mb-1 ${
                isDark ? 'text-[#8A8A8F]' : 'text-gray-600'
              }`}>{envLabel}</label>
              <select
                value={environmentId}
                onChange={(e) => setEnvironmentId(e.target.value)}
                className={`text-sm rounded px-2 py-1 focus:outline-none focus:ring-1 ${
                  isDark
                    ? 'bg-[#0F0E11] border border-[#2D2D2F] text-[#E0E0E2] focus:ring-[#5E6AD2]'
                    : 'border border-gray-300 text-gray-900 focus:ring-indigo-500'
                }`}
              >
                <option value="">—</option>
                {environments.map((env) => (
                  <option key={env.id} value={env.id}>{env.name}{env.isDefault ? ' ★' : ''}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <label className={`text-xs font-semibold block mb-1 ${
                isDark ? 'text-[#8A8A8F]' : 'text-gray-600'
              }`}>Headless</label>
              <input
                type="checkbox"
                checked={headless}
                onChange={e => setHeadless(e.target.checked)}
                className={`mb-1.5 h-4 w-4 rounded ${
                  isDark
                    ? 'bg-[#0F0E11] border-[#2D2D2F] accent-[#5E6AD2]'
                    : 'border-gray-300 text-indigo-600'
                }`}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleExecute}
              disabled={isRunning}
            >
              {isRunning ? 'Running...' : 'Confirm'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowConfirm(false)}
              disabled={isRunning}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="primary"
          onClick={() => setShowConfirm(true)}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <Spinner size="sm" /> Running...
            </>
          ) : (
            '▶️ Execute'
          )}
        </Button>
      )}
    </>
  )
}
