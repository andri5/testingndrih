import { useState, useEffect } from 'react'
import { Button, Alert, Spinner } from './ui'
import { useExecutionStore } from '../store/executionStore'

export function ExecuteScenarioButton({ scenarioId, scenarioName, onExecutionStart = null }) {
  const { isRunning, executeScenario, clearError, error } = useExecutionStore()
  const [showConfirm, setShowConfirm] = useState(false)
  const [browser, setBrowser] = useState('chromium')
  const [headless, setHeadless] = useState(false)

  const handleExecute = async () => {
    try {
      await executeScenario(scenarioId, { browser, headless })
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
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
          <p className="text-sm text-blue-900">
            Execute: <strong>{scenarioName}</strong>
          </p>
          {/* Browser & headless options */}
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Browser</label>
              <select
                value={browser}
                onChange={e => setBrowser(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="chromium">Chromium</option>
                <option value="firefox">Firefox</option>
                <option value="webkit">WebKit</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <label className="text-xs font-semibold text-gray-600 block mb-1">Headless</label>
              <input
                type="checkbox"
                checked={headless}
                onChange={e => setHeadless(e.target.checked)}
                className="mb-1.5 h-4 w-4 text-indigo-600 border-gray-300 rounded"
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
