import { useState } from 'react'
import { Button, Spinner } from './ui'
import aiService from '../services/aiService'

export default function AISuggestionPanel({
  step,
  errorMessage,
  pageUrl,
  onApply,
  onDismiss
}) {
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState(null)
  const [error, setError] = useState(null)

  const handleAskAI = async () => {
    setLoading(true)
    setError(null)
    setSuggestion(null)

    try {
      const result = await aiService.fixLocator({
        errorMessage: errorMessage || 'Element not found',
        currentLocator: step.selector || '',
        stepDescription: step.description,
        pageUrl: pageUrl,
        stepType: step.type
      })

      console.log('AI Result:', result)
      
      if (result.success && result.suggestion) {
        setSuggestion(result.suggestion)
      } else if (result.error) {
        setError(`${result.error}${result.details ? ' - ' + result.details : ''}`)
      } else {
        setError('Failed to get suggestion from AI')
      }
    } catch (err) {
      console.error('AI Service Error Details:', err)
      const errorMsg = err.error || err.message || 'Error calling AI service'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    if (suggestion && onApply) {
      onApply(suggestion.suggestedLocator)
      setSuggestion(null)
    }
  }

  const handleDismiss = () => {
    setSuggestion(null)
    if (onDismiss) {
      onDismiss()
    }
  }

  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
      {/* AI Suggestion Panel */}
      {!suggestion && !loading && !error && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700">🤖 Having trouble with this selector?</span>
          <Button
            size="sm"
            variant="primary"
            onClick={handleAskAI}
            className="whitespace-nowrap"
          >
            🤖 Ask AI to Fix
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center gap-3">
          <Spinner size="sm" />
          <span className="text-sm text-gray-700">Analyzing selector with AI...</span>
        </div>
      )}

      {/* Suggestion Display */}
      {suggestion && (
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <h4 className="font-semibold text-gray-900">✨ AI Suggestion</h4>
            <button
              onClick={() => setSuggestion(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-600 font-medium mb-1">Current Selector:</p>
              <code className="block bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs break-all">
                {suggestion.currentLocator}
              </code>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium mb-1">Suggested Selector:</p>
              <code className="block bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-xs break-all">
                {suggestion.suggestedLocator}
              </code>
            </div>
          </div>

          <div className="bg-white border border-blue-200 rounded p-3">
            <p className="text-xs text-gray-700">
              <span className="font-medium text-blue-700">Why: </span>
              {suggestion.reason}
            </p>
            {suggestion.confidence && (
              <p className="text-xs text-gray-500 mt-2">
                Confidence: {(suggestion.confidence * 100).toFixed(0)}%
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={handleApply}
              className="flex-1"
            >
              ✓ Apply Fix
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleAskAI}
              className="flex-1"
            >
              ↻ Ask Again
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
            >
              ✗
            </Button>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="space-y-2">
          <p className="text-sm text-red-700">⚠️ {error}</p>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleAskAI}
          >
            ↻ Try Again
          </Button>
        </div>
      )}
    </div>
  )
}
