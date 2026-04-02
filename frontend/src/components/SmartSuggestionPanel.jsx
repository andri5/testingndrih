import { useState } from 'react'
import { Button } from './ui'

/**
 * SmartSuggestionPanel — Shows DOM-based locator suggestions when a step fails.
 * No AI required. Suggestions come from page DOM analysis at error time.
 */
export default function SmartSuggestionPanel({ suggestions = [], currentSelector, onApply }) {
  const [expanded, setExpanded] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(null)
  const [showAltSelectors, setShowAltSelectors] = useState(null)

  if (!suggestions || suggestions.length === 0) return null

  const strategyColors = {
    'ID': 'bg-green-100 text-green-800 border-green-300',
    'Test ID': 'bg-green-100 text-green-800 border-green-300',
    'Name': 'bg-blue-100 text-blue-800 border-blue-300',
    'ARIA Label': 'bg-purple-100 text-purple-800 border-purple-300',
    'Placeholder': 'bg-blue-100 text-blue-800 border-blue-300',
    'Type + Name': 'bg-blue-100 text-blue-800 border-blue-300',
    'Tag + Text': 'bg-amber-100 text-amber-800 border-amber-300',
    'CSS Class': 'bg-gray-100 text-gray-700 border-gray-300',
    'Href': 'bg-cyan-100 text-cyan-800 border-cyan-300',
    'Value': 'bg-orange-100 text-orange-800 border-orange-300',
    'Nth-of-type': 'bg-red-100 text-red-700 border-red-300',
  }

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.85) return { text: 'Tinggi', color: 'text-green-700' }
    if (confidence >= 0.60) return { text: 'Sedang', color: 'text-amber-700' }
    return { text: 'Rendah', color: 'text-red-700' }
  }

  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔧</span>
          <h4 className="font-semibold text-gray-900 text-sm">
            Smart Locator Suggestions
          </h4>
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-300">
            {suggestions.length} ditemukan
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-emerald-700 hover:text-emerald-900 font-medium"
        >
          {expanded ? 'Tutup ▲' : 'Lihat detail ▼'}
        </button>
      </div>

      <p className="text-xs text-gray-600 mb-3">
        Elemen serupa ditemukan di halaman. Pilih salah satu untuk mengganti selector yang gagal.
      </p>

      {/* Current failed selector */}
      <div className="mb-3">
        <p className="text-xs text-gray-500 font-medium mb-1">Selector saat ini (gagal):</p>
        <code className="block bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded text-xs break-all">
          {currentSelector}
        </code>
      </div>

      {/* Suggestion cards */}
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
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Preview:</span>{' '}
                        <code className="text-gray-600">{s.preview}</code>
                      </p>
                      {s.reasons && s.reasons.length > 0 && (
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">Alasan:</span> {s.reasons.join(', ')}
                        </p>
                      )}

                      {/* Alternative selectors for same element */}
                      {s.allSelectors && s.allSelectors.length > 1 && (
                        <div className="mt-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowAltSelectors(showAltSelectors === idx ? null : idx)
                            }}
                            className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                          >
                            {showAltSelectors === idx ? 'Sembunyikan alternatif' : `${s.allSelectors.length - 1} selector alternatif lainnya`}
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
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onApply(alt.selector)
                                      }}
                                      className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
                                    >
                                      Gunakan
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

                {/* Apply button */}
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
                    ✓ Gunakan
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick apply for top suggestion */}
      {!expanded && suggestions.length > 0 && onApply && (
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => onApply(suggestions[0].selector)}
            className="flex-1"
          >
            ✓ Gunakan Rekomendasi Terbaik
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setExpanded(true)}
          >
            Lihat Semua
          </Button>
        </div>
      )}
    </div>
  )
}
