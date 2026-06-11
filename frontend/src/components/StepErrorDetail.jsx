import { useState } from 'react'
import SmartSuggestionPanel from './SmartSuggestionPanel'
import { analyzeErrorSuggestions, CONFIDENCE_LABELS } from '../utils/errorSuggestionAnalyzer'

function parseErrorDetail(errorMessage) {
  if (!errorMessage) return null
  try {
    const parsed = JSON.parse(errorMessage)
    if (parsed.message && parsed.step) return parsed
    return null
  } catch {
    return null
  }
}

export default function StepErrorDetail({
  errorMessage,
  onRetest,
  size = 'normal',
  onApplyAIFix = null,
  onAutoRetry = null,
  isAutoRetrying = false,
  executionId = null,
}) {
  const [expanded, setExpanded] = useState(false)
  const detail = parseErrorDetail(errorMessage)
  const textSize = size === 'small' ? 'text-xs' : 'text-sm'

  if (!detail) {
    return <p className={`${textSize} text-red-700 mt-1 leading-relaxed`}>{errorMessage}</p>
  }

  const { diagnosis, suggestions } = analyzeErrorSuggestions(detail)

  return (
    <div className="mt-1">
      <p className={`${textSize} text-red-700 font-medium leading-relaxed`}>{detail.message}</p>
      <div className="flex items-center gap-3 mt-1.5">
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
          className="text-xs text-[#5E6AD2] hover:text-[#4A55B8] underline font-medium"
        >
          {expanded ? 'Hide details ▲' : 'Show error details ▼'}
        </button>
        {onRetest && (
          <button
            onClick={(e) => { e.stopPropagation(); onRetest() }}
            className="text-xs text-emerald-700 hover:text-emerald-800 underline font-medium"
          >
            Re-run
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-3 space-y-3">
          {/* Context-aware suggestions */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="font-semibold text-amber-950 text-sm">Fix Suggestions</p>
              <span className="text-xs font-medium text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                {suggestions.length} insight{suggestions.length !== 1 ? 's' : ''}
              </span>
            </div>

            {diagnosis && (
              <div className="mb-3 pl-3 border-l-[3px] border-amber-400">
                <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide mb-1">
                  Likely root cause
                </p>
                <p className="text-sm text-gray-800 leading-relaxed">{diagnosis}</p>
              </div>
            )}

            <div className="space-y-2.5">
              {suggestions.map((s) => {
                const conf = CONFIDENCE_LABELS[s.confidence] || CONFIDENCE_LABELS.medium
                return (
                  <div
                    key={s.id}
                    className="bg-white border border-amber-100 rounded-md p-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-base leading-none mt-0.5 flex-shrink-0" aria-hidden>
                        {s.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <p className="font-semibold text-gray-900 text-sm leading-snug">
                            {s.title}
                          </p>
                          <span
                            className={`text-[11px] font-medium px-1.5 py-0.5 rounded border ${conf.className}`}
                          >
                            Relevance {conf.text}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{s.analysis}</p>
                        {s.actions.length > 0 && (
                          <ul className="mt-2.5 space-y-1.5">
                            {s.actions.map((action, i) => (
                              <li
                                key={i}
                                className="text-sm text-gray-600 leading-relaxed flex gap-2"
                              >
                                <span className="text-amber-600 font-semibold flex-shrink-0">→</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Technical Details */}
          <div className="space-y-2">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="font-semibold text-yellow-900 mb-2 text-sm">Step Payload</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-800 font-medium w-16">Type:</span>
                  <code className="bg-white border border-yellow-100 px-2 py-1 rounded font-mono text-yellow-900 text-xs">
                    {detail.step.type}
                  </code>
                </div>
                {detail.step.selector && (
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-800 font-medium w-16 mt-1">Selector:</span>
                    <code className="bg-white border border-yellow-100 px-2 py-1 rounded font-mono text-yellow-900 break-all flex-1 text-xs leading-relaxed">
                      {detail.step.selector}
                    </code>
                  </div>
                )}
                {detail.step.value && (
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-800 font-medium w-16 mt-1">Value:</span>
                    <code className="bg-white border border-yellow-100 px-2 py-1 rounded font-mono text-yellow-900 break-all flex-1 text-xs leading-relaxed">
                      {detail.step.value}
                    </code>
                  </div>
                )}
                {detail.step.description && (
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-800 font-medium w-16 mt-1">Desc:</span>
                    <span className="text-yellow-900 flex-1 text-sm leading-relaxed">
                      {detail.step.description}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
              <p className="font-semibold text-sky-900 mb-2 text-sm">Page State</p>
              <div className="text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-sky-800 font-medium w-16">URL:</span>
                  <code className="bg-white border border-sky-100 px-2 py-1 rounded font-mono text-sky-900 break-all flex-1 text-xs leading-relaxed">
                    {detail.page?.url || '−'}
                  </code>
                </div>
                {detail.execution?.device && (
                  <div className="flex items-start gap-2 mt-1.5">
                    <span className="text-sky-800 font-medium w-16">Device:</span>
                    <span className="text-sky-900 text-sm">{detail.execution.device}</span>
                  </div>
                )}
              </div>
            </div>

            {detail.consoleErrors && detail.consoleErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 font-semibold text-sm mb-2">
                  Console Errors ({detail.consoleErrors.length})
                </p>
                <div className="space-y-1.5">
                  {detail.consoleErrors.map((err, i) => (
                    <div key={i} className="border-l-2 border-red-300 pl-2 text-xs text-gray-700 leading-relaxed">
                      <span className="text-gray-500 font-medium">[{err.type}]</span> {err.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detail.failedRequests && detail.failedRequests.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-orange-800 font-semibold text-sm mb-2">
                  Failed Requests ({detail.failedRequests.length})
                </p>
                <div className="space-y-1.5">
                  {detail.failedRequests.map((req, i) => (
                    <div key={i} className="border-l-2 border-orange-300 pl-2 text-xs leading-relaxed">
                      <p className="text-gray-700">
                        <span className="text-gray-500 font-medium">{req.method}</span> {req.url}
                      </p>
                      <p className="text-red-700 mt-0.5">{req.failure}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {detail.locatorSuggestions && detail.locatorSuggestions.length > 0 && (
        <SmartSuggestionPanel
          suggestions={detail.locatorSuggestions}
          currentSelector={detail.step?.selector}
          onApply={onApplyAIFix}
          onAutoRetry={onAutoRetry}
          isAutoRetrying={isAutoRetrying}
          executionId={executionId}
        />
      )}
    </div>
  )
}
