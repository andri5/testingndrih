import { useState, useEffect } from 'react'
import { Play, Loader2 } from 'lucide-react'
import { Alert } from './ui'
import ExportFormatButton from './ExportFormatButton'
import { useExecutionStore } from '../store/executionStore'
import { useSettingsStore } from '../store/settingsStore'
import { environmentAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'

export function ExecuteScenarioButton({ scenarioId, scenarioName, onExecutionStart = null }) {
  const { isRunning, executeScenario, clearError, error } = useExecutionStore()
  const { selectedEnvironmentId, setSelectedEnvironmentId } = useSettingsStore()
  const isAdmin = useAuthStore((state) => state.user)?.role === 'ADMIN'
  const [showConfirm, setShowConfirm] = useState(false)
  const [browser, setBrowser] = useState('chromium')
  const [headless, setHeadless] = useState(false)
  const [environments, setEnvironments] = useState([])
  const [environmentId, setEnvironmentId] = useState(selectedEnvironmentId || '')

  useEffect(() => {
    if (!showConfirm || !isAdmin) return
    environmentAPI.list().then((res) => {
      const list = res.data.environments || []
      setEnvironments(list)
      if (!environmentId && list.length) {
        const def = list.find((e) => e.isDefault) || list[0]
        setEnvironmentId(def.id)
      }
    }).catch(() => {})
  }, [showConfirm, isAdmin])

  const envLabel = 'Environment'

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
        <div className="p-4 rounded-lg space-y-3 border bg-emerald-50/80 border-emerald-200/80">
          <p className="text-sm font-medium text-emerald-900">
            Run scenario: <strong>{scenarioName}</strong>
          </p>
          {/* Browser & headless options */}
          <div className="flex flex-wrap gap-3">
            <div>
              <label className={`text-xs font-semibold block mb-1 ${
                'text-gray-600'
              }`}>Browser</label>
              <select
                value={browser}
                onChange={e => setBrowser(e.target.value)}
                className={`text-sm rounded px-2 py-1 focus:outline-none focus:ring-1 ${
                  'border border-gray-300 text-gray-900 focus:ring-indigo-500'
                }`}
              >
                <option value="chromium">Chromium</option>
                <option value="firefox">Firefox</option>
                <option value="webkit">WebKit</option>
              </select>
            </div>
            {isAdmin && (
              <div>
                <label className={`text-xs font-semibold block mb-1 ${
                  'text-gray-600'
                }`}>{envLabel}</label>
                <select
                  value={environmentId}
                  onChange={(e) => setEnvironmentId(e.target.value)}
                  className={`text-sm rounded px-2 py-1 focus:outline-none focus:ring-1 ${
                    'border border-gray-300 text-gray-900 focus:ring-indigo-500'
                  }`}
                >
                  <option value="">—</option>
                  {environments.map((env) => (
                    <option key={env.id} value={env.id}>{env.name}{env.isDefault ? ' ★' : ''}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-end gap-2">
              <label className={`text-xs font-semibold block mb-1 ${
                'text-gray-600'
              }`}>Headless</label>
              <input
                type="checkbox"
                checked={headless}
                onChange={e => setHeadless(e.target.checked)}
                className={`mb-1.5 h-4 w-4 rounded ${
                  'border-gray-300 text-indigo-600'
                }`}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExportFormatButton
              format="csv"
              icon={isRunning ? Loader2 : Play}
              onClick={handleExecute}
              disabled={isRunning}
              className={`w-full sm:w-auto justify-center ${isRunning ? '[&_svg]:animate-spin' : ''}`}
            >
              {isRunning ? 'Running...' : 'Confirm & Run'}
            </ExportFormatButton>
            <ExportFormatButton
              format="json"
              onClick={() => setShowConfirm(false)}
              disabled={isRunning}
              className="w-full sm:w-auto justify-center"
              icon={null}
            >
              Cancel
            </ExportFormatButton>
          </div>
        </div>
      ) : (
        <ExportFormatButton
          format="csv"
          icon={isRunning ? Loader2 : Play}
          onClick={() => setShowConfirm(true)}
          disabled={isRunning}
          className={`w-full justify-center ${isRunning ? '[&_svg]:animate-spin' : ''}`}
        >
          {isRunning ? 'Running...' : 'Run Scenario'}
        </ExportFormatButton>
      )}
    </>
  )
}
