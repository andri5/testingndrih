import { useState, useEffect } from 'react'
import { Button, Alert, Spinner } from './ui'
import { useExecutionStore } from '../store/executionStore'

export function ExecuteScenarioButton({ scenarioId, scenarioName, onExecutionStart = null }) {
  const { isRunning, executeScenario, clearError, error } = useExecutionStore()
  const [showConfirm, setShowConfirm] = useState(false)

  const handleExecute = async () => {
    try {
      await executeScenario(scenarioId)
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
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900 mb-3">
            Execute scenario: <strong>{scenarioName}</strong>?
          </p>
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
