import { CheckCircle2, XCircle, Clock, ImageIcon } from 'lucide-react'
import StepErrorDetail from './StepErrorDetail'

const TYPE_COLORS = {
  NAVIGATE: 'bg-[#5E6AD2]/15 text-[#5E6AD2] border border-[#5E6AD2]/20',
  CLICK: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  FILL: 'bg-amber-50 text-amber-800 border border-amber-200',
  WAIT: 'bg-violet-50 text-violet-700 border border-violet-200',
  ASSERTION: 'bg-purple-50 text-purple-700 border border-purple-200',
  SCREENSHOT: 'bg-pink-50 text-pink-700 border border-pink-200',
  default: 'bg-[#EEF0FF] text-[#5E6AD2] border border-[#5E6AD2]/20',
}

function formatDuration(ms) {
  if (!ms && ms !== 0) return null
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`
  return `${ms}ms`
}

export default function StepResultCard({
  result,
  index = 0,
  onScreenshotClick,
  onRetest,
  onApplyAIFix,
  onAutoRetry,
  isAutoRetrying = false,
  executionId = null,
  errorSize = 'normal',
}) {
  const passed = result.status === 'PASSED'
  const stepNumber = result.testStep?.stepNumber ?? index + 1
  const stepType = result.testStep?.type || result.type || 'STEP'
  const description = result.testStep?.description || result.description || '-'
  const selector = result.testStep?.selector
  const duration = formatDuration(result.duration)
  const typeClass = TYPE_COLORS[stepType] || TYPE_COLORS.default

  return (
    <article
      className={`group relative overflow-hidden rounded-xl border transition-all duration-200 shadow-sm ${
        passed
          ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white hover:border-emerald-300'
          : 'border-red-200 bg-gradient-to-br from-red-50 to-white hover:border-red-300'
      }`}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${passed ? 'bg-emerald-500' : 'bg-red-500'}`}
        aria-hidden
      />

      <div className="flex items-start gap-3 p-4 pl-5">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            passed
              ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
              : 'bg-red-100 text-red-600 border border-red-200'
          }`}
        >
          {passed ? <CheckCircle2 size={20} strokeWidth={2.25} /> : <XCircle size={20} strokeWidth={2.25} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Step {stepNumber}
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${typeClass}`}>
              {stepType}
            </span>
            {duration && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 ml-auto">
                <Clock size={12} />
                {duration}
              </span>
            )}
          </div>

          <p className="font-semibold text-gray-900 leading-snug">{description}</p>

          {selector && (
            <p
              className="mt-1.5 text-xs font-mono text-gray-500 truncate bg-gray-50 border border-gray-100 rounded px-2 py-1"
              title={selector}
            >
              {selector}
            </p>
          )}

          {result.errorMessage && (
            <div className="mt-3">
              <StepErrorDetail
                errorMessage={result.errorMessage}
                onRetest={onRetest}
                size={errorSize}
                onApplyAIFix={onApplyAIFix}
                onAutoRetry={onAutoRetry}
                isAutoRetrying={isAutoRetrying}
                executionId={executionId}
              />
            </div>
          )}
        </div>

        {result.screenshot && onScreenshotClick && (
          <button
            type="button"
            onClick={onScreenshotClick}
            className="group/img relative flex-shrink-0 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-[#5E6AD2]/50 transition-all hover:scale-[1.02] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/40"
            title="View screenshot"
          >
            <img
              src={result.screenshot.url}
              alt={`Screenshot step ${stepNumber}`}
              className="w-28 h-[4.5rem] object-cover"
            />
            <span className="absolute inset-0 bg-[#5E6AD2]/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
              <ImageIcon size={18} className="text-white drop-shadow-md" />
            </span>
          </button>
        )}
      </div>
    </article>
  )
}

export function StepResultsSummary({ stepResults = [] }) {
  const passed = stepResults.filter((r) => r.status === 'PASSED').length
  const failed = stepResults.length - passed
  const total = stepResults.length
  const passRate = total ? Math.round((passed / total) * 100) : 0

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4 p-3 rounded-xl border border-gray-200 bg-gray-50/80 shadow-sm">
      <div className="flex items-center gap-4 text-sm">
        <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
          <CheckCircle2 size={16} />
          {passed} passed
        </span>
        <span className="inline-flex items-center gap-1.5 font-medium text-red-600">
          <XCircle size={16} />
          {failed} failed
        </span>
      </div>
      <div className="flex-1 min-w-[120px] h-2 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
          style={{ width: `${passRate}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-600 tabular-nums">{passRate}% pass</span>
    </div>
  )
}
