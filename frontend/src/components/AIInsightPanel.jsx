import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import ExportFormatButton from './ExportFormatButton'
import { aiAPI } from '../services/api'
import { useAiEnabled, formatAiQuotaMessage, invalidateAiStatusCache } from '../hooks/useAiEnabled'

const CONFIDENCE_STYLES = {
  high: 'bg-green-100 text-green-800 border-green-300',
  medium: 'bg-amber-100 text-amber-800 border-amber-300',
  low: 'bg-gray-100 text-gray-700 border-gray-300',
}

export default function AIInsightPanel({ errorDetail }) {
  const { configured, canUse, quota, loading: statusLoading, refresh } = useAiEnabled()
  const [insight, setInsight] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (statusLoading || !configured || !errorDetail) return null

  const quotaHint = quota ? formatAiQuotaMessage(quota) : null

  const handleExplain = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await aiAPI.explainFailure(errorDetail)
      setInsight(res.data.insight)
      invalidateAiStatusCache()
      refresh()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'AI request failed')
      if (err.response?.status === 429) {
        invalidateAiStatusCache()
        refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const confClass = CONFIDENCE_STYLES[insight?.confidence] || CONFIDENCE_STYLES.medium

  return (
    <section className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white overflow-hidden shadow-sm">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-violet-100 bg-violet-50/80">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center">
            <Sparkles size={16} />
          </span>
          <p className="font-semibold text-violet-950 text-sm">AI Failure Analysis</p>
        </div>
        {!insight && (
          <ExportFormatButton
            format="primary"
            icon={loading ? Loader2 : Sparkles}
            onClick={handleExplain}
            disabled={loading || !canUse}
            className={`!text-[11px] !px-2.5 !py-1.5 ${loading ? '[&_svg]:animate-spin' : ''}`}
          >
            {loading ? 'Analyzing...' : 'Ask AI'}
          </ExportFormatButton>
        )}
      </div>

      <div className="p-4 space-y-3 bg-white/60">
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {!insight && !error && (
          <p className="text-sm text-gray-600">
            Get an AI explanation of why this step failed and how to fix it.
            {quotaHint && (
              <span className={`block mt-2 text-xs ${canUse ? 'text-violet-700' : 'text-amber-700'}`}>
                {quotaHint}
              </span>
            )}
          </p>
        )}

        {insight && (
          <>
            <p className="text-sm text-gray-800 leading-relaxed font-medium">{insight.summary}</p>
            {insight.rootCause && (
              <div className="rounded-lg border border-violet-200 border-l-4 border-l-violet-500 bg-violet-50/70 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700 mb-1">
                  Root cause
                </p>
                <p className="text-sm text-gray-800 leading-relaxed">{insight.rootCause}</p>
              </div>
            )}
            {insight.fixSteps?.length > 0 && (
              <ul className="space-y-1.5">
                {insight.fixSteps.map((step, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2 leading-relaxed">
                    <span className="text-violet-600 font-bold flex-shrink-0">→</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            )}
            {insight.confidence && (
              <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${confClass}`}>
                Confidence: {insight.confidence}
              </span>
            )}
            <ExportFormatButton
              format="json"
              onClick={handleExplain}
              disabled={loading}
              className="!text-[11px]"
              icon={null}
            >
              Refresh analysis
            </ExportFormatButton>
          </>
        )}
      </div>
    </section>
  )
}
