import { useState } from 'react'
import { ChevronDown, Lightbulb, RotateCcw, Globe, Code2, Terminal } from 'lucide-react'
import SmartSuggestionPanel from './SmartSuggestionPanel'
import AIInsightPanel from './AIInsightPanel'
import ExportFormatButton from './ExportFormatButton'
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

function PayloadRow({ label, children }) {
  return (
    <div className="grid grid-cols-[4.5rem_1fr] gap-2 items-start text-xs">
      <span className="font-semibold text-gray-500 pt-1">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function MonoBlock({ children }) {
  return (
    <code className="block w-full bg-white border border-gray-200 px-2.5 py-1.5 rounded-lg font-mono text-[11px] text-gray-800 break-all leading-relaxed shadow-sm">
      {children}
    </code>
  )
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
  const [expanded, setExpanded] = useState(true)
  const detail = parseErrorDetail(errorMessage)
  const textSize = size === 'small' ? 'text-xs' : 'text-sm'

  if (!detail) {
    return (
      <p className={`${textSize} text-red-700 mt-1 leading-relaxed font-medium`}>
        {errorMessage}
      </p>
    )
  }

  const { diagnosis, suggestions } = analyzeErrorSuggestions(detail)

  return (
    <div className="mt-1">
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
        <p className={`${textSize} text-red-800 font-medium leading-relaxed`}>
          {detail.message}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-2">
        <ExportFormatButton
          format="primary"
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(!expanded)
          }}
          className="!text-[11px] !px-2.5 !py-1.5"
          icon={null}
          trailing={
            <ChevronDown
              size={12}
              className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          }
        >
          {expanded ? 'Hide details' : 'Show details'}
        </ExportFormatButton>
        {onRetest && (
          <ExportFormatButton
            format="csv"
            icon={RotateCcw}
            onClick={(e) => {
              e.stopPropagation()
              onRetest()
            }}
            className="!text-[11px] !px-2.5 !py-1.5"
            iconSize={12}
          >
            Re-run
          </ExportFormatButton>
        )}
      </div>

      {expanded && (
        <div className="mt-3 space-y-3 animate-fade-in">
          <section className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white overflow-hidden shadow-sm">
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-amber-100 bg-amber-50/80">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Lightbulb size={16} />
                </span>
                <p className="font-semibold text-amber-950 text-sm">Fix Suggestions</p>
              </div>
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200">
                {suggestions.length} insight{suggestions.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="p-4 space-y-3 bg-white/60">
              {diagnosis && (
                <div className="rounded-lg border border-amber-200 border-l-4 border-l-amber-500 bg-amber-50/70 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">
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
                      className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:border-amber-300 transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-lg leading-none mt-0.5 flex-shrink-0" aria-hidden>
                          {s.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900 text-sm">{s.title}</p>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${conf.className}`}
                            >
                              {conf.text}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">{s.analysis}</p>
                          {s.actions.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {s.actions.map((action, i) => (
                                <li
                                  key={i}
                                  className="text-xs text-gray-600 flex gap-2 leading-relaxed"
                                >
                                  <span className="text-amber-600 font-bold flex-shrink-0">→</span>
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
          </section>

          <AIInsightPanel errorDetail={detail} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <section className="rounded-xl border border-[#5E6AD2]/25 bg-[#EEF0FF]/70 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-lg bg-[#5E6AD2]/15 text-[#5E6AD2] flex items-center justify-center">
                  <Code2 size={14} />
                </span>
                <p className="font-semibold text-sm text-gray-900">Step Payload</p>
              </div>
              <div className="space-y-2">
                <PayloadRow label="Type">
                  <MonoBlock>{detail.step.type}</MonoBlock>
                </PayloadRow>
                {detail.step.selector && (
                  <PayloadRow label="Selector">
                    <MonoBlock>{detail.step.selector}</MonoBlock>
                  </PayloadRow>
                )}
                {detail.step.value && (
                  <PayloadRow label="Value">
                    <MonoBlock>{detail.step.value}</MonoBlock>
                  </PayloadRow>
                )}
                {detail.step.description && (
                  <PayloadRow label="Desc">
                    <span className="text-xs text-gray-700 leading-relaxed">
                      {detail.step.description}
                    </span>
                  </PayloadRow>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Globe size={14} />
                </span>
                <p className="font-semibold text-sm text-gray-900">Page State</p>
              </div>
              <PayloadRow label="URL">
                <MonoBlock>{detail.page?.url || '−'}</MonoBlock>
              </PayloadRow>
              {detail.execution?.device && (
                <div className="mt-2">
                  <PayloadRow label="Device">
                    <span className="text-xs text-gray-700">{detail.execution.device}</span>
                  </PayloadRow>
                </div>
              )}
            </section>
          </div>

          {detail.consoleErrors && detail.consoleErrors.length > 0 && (
            <section className="rounded-xl border border-red-200 bg-red-50/80 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Terminal size={14} className="text-red-600" />
                <p className="font-semibold text-sm text-red-700">
                  Console Errors ({detail.consoleErrors.length})
                </p>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {detail.consoleErrors.map((err, i) => (
                  <div
                    key={i}
                    className="text-xs text-gray-700 border-l-2 border-red-300 pl-2 leading-relaxed bg-white/70 rounded-r px-2 py-1"
                  >
                    <span className="text-gray-500 font-medium">[{err.type}]</span> {err.message}
                  </div>
                ))}
              </div>
            </section>
          )}

          {detail.failedRequests && detail.failedRequests.length > 0 && (
            <section className="rounded-xl border border-orange-200 bg-orange-50/80 p-4 shadow-sm">
              <p className="font-semibold text-sm text-orange-700 mb-2">
                Failed Requests ({detail.failedRequests.length})
              </p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {detail.failedRequests.map((req, i) => (
                  <div
                    key={i}
                    className="border-l-2 border-orange-300 pl-2 text-xs leading-relaxed bg-white/70 rounded-r px-2 py-1"
                  >
                    <p className="text-gray-700">
                      <span className="font-medium text-gray-500">{req.method}</span> {req.url}
                    </p>
                    <p className="text-red-600 mt-0.5">{req.failure}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {(detail.locatorSuggestions?.length > 0 || detail.step?.selector) && (
        <div className="mt-3">
          <SmartSuggestionPanel
            suggestions={detail.locatorSuggestions}
            currentSelector={detail.step?.selector}
            onApply={onApplyAIFix}
            onAutoRetry={onAutoRetry}
            isAutoRetrying={isAutoRetrying}
            executionId={executionId}
            errorDetail={detail}
          />
        </div>
      )}
    </div>
  )
}
