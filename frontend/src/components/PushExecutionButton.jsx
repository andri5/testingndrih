import { useState } from 'react'
import { useQaseStore } from '../store/qaseStore'

export default function PushExecutionButton({ executionId, disabled = false }) {
  const [isPushing, setPushing] = useState(false)
  const [result, setResult] = useState(null)
  const { pushExecution, isConnected } = useQaseStore()

  if (!isConnected) {
    return null
  }

  const handlePush = async () => {
    setPushing(true)
    setResult(null)

    try {
      await pushExecution(executionId)
      setResult({ success: true, message: 'Execution pushed to Qase successfully' })
      setTimeout(() => setResult(null), 3000)
    } catch (error) {
      setResult({ success: false, message: error.message })
    } finally {
      setPushing(false)
    }
  }

  return (
    <div>
      <button
        onClick={handlePush}
        disabled={isPushing || disabled}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-sm"
      >
        {isPushing ? 'Pushing...' : 'Push to Qase'}
      </button>

      {result && (
        <div className={`mt-2 p-2 rounded text-sm ${
          result.success
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {result.message}
        </div>
      )}
    </div>
  )
}
