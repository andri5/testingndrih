import { useState } from 'react'
import { Button } from './ui'
import { executionAPI } from '../services/api'

/**
 * SmartSuggestionPanel — DOM-based locator suggestions when a step fails.
 */
export default function SmartSuggestionPanel({
  suggestions = [],
  currentSelector,
  onApply,
  onAutoRetry,
  isAutoRetrying = false,
  executionId = null,
}) {
  const [expanded, setExpanded] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(null)
  const [showAltSelectors, setShowAltSelectors] = useState(null)
  const [testInput, setTestInput] = useState('')
  const [testResult, setTestResult] = useState(null)
  const [testError, setTestError] = useState(null)
  const [isTesting, setIsTesting] = useState(false)

  if (!suggestions || suggestions.length === 0) return null

  const strategyColors = {
    ID: 'bg-green-100 text-green-800 border-green-300',
    'Test ID': 'bg-green-100 text-green-800 border-green-300',
    Name: 'bg-blue-100 text-blue-800 border-blue-300',
    'ARIA Label': 'bg-purple-100 text-purple-800 border-purple-300',
    Placeholder: 'bg-blue-100 text-blue-800 border-blue-300',
    'Type + Name': 'bg-blue-100 text-blue-800 border-blue-300',
    'Tag + Text': 'bg-amber-100 text-amber-800 border-amber-300',
    'CSS Class': 'bg-gray-100 text-gray-700 border-gray-300',
    Href: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    Value: 'bg-orange-100 text-orange-800 border-orange-300',
    'Nth-of-type': 'bg-red-100 text-red-700 border-red-300',
  }

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.85) return { text: 'High', color: 'text-green-700' }
    if (confidence >= 0.60) return { text: 'Medium', color: 'text-amber-700' }
    return { text: 'Low', color: 'text-red-700' }
  }

  const handleTestSelector = async () => {
    if (!testInput.trim()) {
      setTestError('Enter a selector to test.')
      return
    }
    if (!executionId) {
      setTestError('Execution ID missing — re-run the scenario first.')
      return
    }

    setIsTesting(true)
    setTestError(null)
    setTestResult(null)

    try {
      const res = await executionAPI.testSelector(executionId, testInput.trim())
      const result = res.data?.result
      if (!result) {
        setTestError('No response from server. Try re-running the scenario.')
        return
      }
      setTestResult(result)
      if (!result.found && result.error) {
        setTestError(result.error)
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Request failed'
      setTestError(message)
      setTestResult({ found: false, selector: testInput.trim(), error: message })
    } finally {
      setIsTesting(false)
    }
  }

  const handleClearHighlight = async () => {
    if (!executionId) return
    try {
      await executionAPI.clearHighlight(executionId)
    } catch {
      /* ignore */
    }
    setTestResult(null)
    setTestError(null)
    setTestInput('')
  }

  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔧</span>
          <h4 className="font-semibold text-gray-900 text-sm">Smart Locator Suggestions</h4>
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-300">
            {suggestions.length} found
          </span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-emerald-700 hover:text-emerald-900 font-medium"
        >
          {expanded ? 'Collapse ▲' : 'Show details ▼'}
        </button>
      </div>

      <p className="text-sm text-gray-700 mb-3 leading-relaxed">
        Similar elements were found on the page. Pick one to replace the failed selector.
      </p>

      <div className="mb-3">
        <p className="text-xs text-gray-600 font-medium mb-1">Current selector (failed):</p>
        <code className="block bg-red-50 border border-red-200 text-red-800 px-3 py-1.5 rounded text-xs break-all font-mono">
          {currentSelector}
        </code>
      </div>

      {executionId && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800 font-semibold mb-1">Test New Selector</p>
          <p className="text-xs text-blue-700 mb-2 leading-relaxed">
            Supports CSS and XPath. The browser stays open for 15 minutes after a failed run.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={testInput}
              onChange={(e) => {
                setTestInput(e.target.value)
                setTestError(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleTestSelector()}
              placeholder="e.g. button.login, #submit, //input[@name='q']"
              className="flex-1 px-2.5 py-1.5 text-sm border border-blue-300 rounded bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <Button
              size="sm"
              variant="primary"
              onClick={handleTestSelector}
              disabled={!testInput.trim() || isTesting}
              className="whitespace-nowrap"
            >
              {isTesting ? 'Testing…' : 'Test'}
            </Button>
          </div>

          {testError && !testResult?.found && (
            <div className="mt-2 p-2 rounded text-sm bg-red-50 border border-red-200 text-red-800 leading-relaxed">
              {testError}
            </div>
          )}

          {testResult && (
            <div
              className={`mt-2 p-2 rounded text-sm leading-relaxed ${
                testResult.found
                  ? 'bg-green-50 border border-green-300 text-green-900'
                  : 'bg-red-50 border border-red-300 text-red-800'
              }`}
            >
              {testResult.found ? (
                <div className="space-y-1">
                  <p className="font-semibold">Element found</p>
                  {testResult.matchCount > 1 && (
                    <p className="text-amber-800">
                      Warning: {testResult.matchCount} elements match — first match is highlighted.
                    </p>
                  )}
                  <p><span className="font-medium">Tag:</span> {testResult.tagName}</p>
                  {testResult.id && <p><span className="font-medium">ID:</span> {testResult.id}</p>}
                  {testResult.className && (
                    <p>
                      <span className="font-medium">Class:</span>{' '}
                      <code className="bg-white/60 px-1 rounded text-xs">{testResult.className}</code>
                    </p>
                  )}
                  {testResult.text && (
                    <p><span className="font-medium">Text:</span> &quot;{testResult.text.substring(0, 50)}&quot;</p>
                  )}
                  <p>
                    <span className="font-medium">Visibility:</span>{' '}
                    {testResult.isVisible ? 'Visible' : 'Hidden'}
                  </p>
                  <p>
                    <span className="font-medium">Size:</span>{' '}
                    {testResult.boundingBox?.width}x{testResult.boundingBox?.height}px
                  </p>
                  {onApply && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        onApply(testResult.selector)
                        handleClearHighlight()
                      }}
                      className="mt-2 w-full text-xs"
                    >
                      Apply This Selector
                    </Button>
                  )}
                </div>
              ) : (
                <p>Not found: {testResult.error || 'Element not on page'}</p>
              )}
              <Button
                size="sm"
                variant="secondary"
                onClick={handleClearHighlight}
                className="mt-2 w-full text-xs"
              >
                Clear Highlight
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        {suggestions.map((s, idx) => {
          const conf = getConfidenceLabel(s.confidence)
          const colorClass = strategyColors[s.strategy] || 'bg-gray-100 text-gray-700 border-gray-300'
          const isSelected = selectedIdx === idx

          return (
            <div
              key={idx}
              className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-emerald-300'
              }`}
              onClick={() => setSelectedIdx(isSelected ? null : idx)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${colorClass}`}>
                      {s.strategy}
                    </span>
                    <span className={`text-xs font-medium ${conf.color}`}>
                      Confidence: {(s.confidence * 100).toFixed(0)}% ({conf.text})
                    </span>
                  </div>
                  <code className="block text-xs text-gray-800 bg-gray-50 px-2 py-1 rounded break-all font-mono">
                    {s.selector}
                  </code>
                  {expanded && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Preview:</span>{' '}
                        <code className="text-gray-700">{s.preview}</code>
                      </p>
                      {s.reasons && s.reasons.length > 0 && (
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Reason:</span> {s.reasons.join(', ')}
                        </p>
                      )}
                      {s.allSelectors && s.allSelectors.length > 1 && (
                        <div className="mt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowAltSelectors(showAltSelectors === idx ? null : idx)
                            }}
                            className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                          >
                            {showAltSelectors === idx
                              ? 'Hide alternatives'
                              : `${s.allSelectors.length - 1} more alternative(s)`}
                          </button>
                          {showAltSelectors === idx && (
                            <div className="mt-1 space-y-1 pl-2 border-l-2 border-indigo-200">
                              {s.allSelectors.slice(1).map((alt, altIdx) => (
                                <div key={altIdx} className="flex items-center gap-2">
                                  <code className="text-xs text-gray-700 bg-gray-50 px-1 rounded break-all">
                                    {alt.selector}
                                  </code>
                                  <span className="text-xs text-gray-400">({alt.strategy})</span>
                                  {onApply && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onApply(alt.selector)
                                      }}
                                      className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
                                    >
                                      Apply
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {isSelected && onApply && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={(e) => {
                      e.stopPropagation()
                      onApply(s.selector)
                    }}
                    className="whitespace-nowrap flex-shrink-0"
                  >
                    Apply
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {!expanded && suggestions.length > 0 && onApply && (
        <div className="mt-3 flex gap-2 flex-wrap">
          {onAutoRetry && (
            <Button
              size="sm"
              variant="success"
              onClick={() => onAutoRetry(suggestions[0].selector)}
              disabled={isAutoRetrying}
              className="flex-1"
            >
              {isAutoRetrying ? 'Auto-retrying…' : 'Auto-Retry'}
            </Button>
          )}
          <Button
            size="sm"
            variant="primary"
            onClick={() => onApply(suggestions[0].selector)}
            className="flex-1"
          >
            Apply Best Match
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setExpanded(true)}>
            Show All
          </Button>
        </div>
      )}
    </div>
  )
}
