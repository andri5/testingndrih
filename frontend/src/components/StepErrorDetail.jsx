import { useState } from 'react'
import AISuggestionPanel from './AISuggestionPanel'
import SmartSuggestionPanel from './SmartSuggestionPanel'

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

function getSuggestions(detail) {
  const suggestions = []
  const msg = (detail.message || '').toLowerCase()
  const type = detail.step?.type
  const selector = detail.step?.selector || ''

  // Timeout — element not found
  if (msg.includes('timeout') && msg.includes('waiting for')) {
    if (type === 'CLICK') {
      suggestions.push({
        icon: '🔍',
        text: 'Elemen tidak ditemukan dalam waktu yang ditentukan. Pastikan halaman sudah selesai loading sebelum step ini.',
        action: 'Tambahkan step WAIT (1000-3000ms) sebelum step CLICK ini.'
      })
      suggestions.push({
        icon: '🎯',
        text: `Selector "${selector}" mungkin sudah berubah di halaman target.`,
        action: 'Coba record ulang interaksi ini untuk mendapatkan selector terbaru.'
      })
    }
    if (type === 'FILL') {
      suggestions.push({
        icon: '🔍',
        text: 'Input field tidak ditemukan. Mungkin form belum muncul atau selector berubah.',
        action: 'Pastikan navigasi ke halaman yang benar sebelum step FILL, dan coba record ulang.'
      })
      suggestions.push({
        icon: '⏱️',
        text: 'Halaman mungkin butuh waktu lebih lama untuk render form.',
        action: 'Tambahkan step WAIT (2000-5000ms) sebelum step FILL ini.'
      })
    }
    if (type === 'NAVIGATE') {
      suggestions.push({
        icon: '🌐',
        text: 'Halaman tidak selesai loading dalam waktu yang ditentukan.',
        action: 'Periksa apakah URL benar dan website bisa diakses. Coba buka URL di browser biasa.'
      })
    }
  }

  // Strict mode violation — multiple elements
  if (msg.includes('strict mode violation') || msg.includes('resolved to')) {
    const matchCount = msg.match(/resolved to (\d+) elements/)
    suggestions.push({
      icon: '⚠️',
      text: `Selector cocok dengan lebih dari 1 elemen${matchCount ? ` (${matchCount[1]} elemen)` : ''}. Playwright butuh selector yang unik.`,
      action: 'Edit step ini dan gunakan selector yang lebih spesifik. Contoh: tambahkan class, id, atau gunakan selector yang lebih detail.'
    })
    suggestions.push({
      icon: '🔄',
      text: 'Record ulang bisa menghasilkan selector yang lebih tepat.',
      action: 'Hapus step ini, lalu record ulang interaksi tersebut.'
    })
  }

  // Navigation / URL errors
  if (msg.includes('invalid url') || msg.includes('err_name_not_resolved') || msg.includes('net::err')) {
    suggestions.push({
      icon: '🌐',
      text: 'URL tidak valid atau website tidak bisa diakses.',
      action: 'Periksa URL di step NAVIGATE. Pastikan format benar (https://...) dan website online.'
    })
  }

  // SSL / Certificate errors
  if (msg.includes('ssl') || msg.includes('certificate') || msg.includes('err_cert')) {
    suggestions.push({
      icon: '🔒',
      text: 'Website memiliki masalah sertifikat SSL.',
      action: 'Website target mungkin menggunakan self-signed certificate. Ini bukan masalah di aplikasi kamu.'
    })
  }

  // Detached / removed element
  if (msg.includes('detached') || msg.includes('not attached')) {
    suggestions.push({
      icon: '💨',
      text: 'Elemen sudah dihapus dari halaman sebelum bisa di-klik/isi.',
      action: 'Halaman target mungkin melakukan re-render. Tambahkan step WAIT sebelumnya, atau record ulang.'
    })
  }

  // Shadow DOM element not found
  if (selector.includes('>>>')) {
    suggestions.push({
      icon: '🔮',
      text: 'Elemen ini berada di dalam Shadow DOM (Web Component).',
      action: 'Selector menggunakan >>> piercing. Pastikan host element dan inner selector masih valid.'
    })
  }

  // Contenteditable / rich text editor
  if (msg.includes('fill') && (msg.includes('contenteditable') || msg.includes('not an input'))) {
    suggestions.push({
      icon: '📝',
      text: 'Elemen ini adalah rich text editor (contenteditable), bukan input biasa.',
      action: 'Sistem sudah mendukung contenteditable. Coba record ulang interaksi dengan editor ini.'
    })
  }

  // Dialog blocked interaction
  if (msg.includes('dialog') || msg.includes('alert') || msg.includes('confirm')) {
    suggestions.push({
      icon: '🪟',
      text: 'Dialog alert/confirm/prompt mungkin memblokir interaksi.',
      action: 'Dialog otomatis di-handle saat eksekusi. Jika masih gagal, tambahkan step WAIT sebelumnya.'
    })
  }

  // iframe related
  if (msg.includes('frame') || msg.includes('iframe') || msg.includes('cross-origin')) {
    suggestions.push({
      icon: '🖼️',
      text: 'Elemen mungkin berada di dalam iframe.',
      action: 'Recorder sudah mendukung iframe. Jika masih gagal, coba edit selector secara manual.'
    })
  }

  // Console errors on target page
  if (detail.consoleErrors && detail.consoleErrors.length > 0) {
    suggestions.push({
      icon: '🐛',
      text: `Ada ${detail.consoleErrors.length} error di console halaman target.`,
      action: 'Ini adalah error dari website yang dites, bukan dari aplikasi kamu. Periksa apakah website target berfungsi normal.'
    })
  }

  // Failed network requests
  if (detail.failedRequests && detail.failedRequests.length > 0) {
    suggestions.push({
      icon: '📡',
      text: `Ada ${detail.failedRequests.length} request gagal di halaman target.`,
      action: 'Website target mungkin sedang bermasalah atau memblokir request. Coba test lagi nanti.'
    })
  }

  // Generic fallback
  if (suggestions.length === 0) {
    suggestions.push({
      icon: '💡',
      text: 'Terjadi error yang tidak terduga.',
      action: 'Coba jalankan ulang skenario. Jika masih gagal, edit atau hapus step ini dan record ulang.'
    })
  }

  return suggestions
}

export default function StepErrorDetail({ errorMessage, onRetest, size = 'normal', step = null, pageUrl = '', onApplyAIFix = null }) {
  const [expanded, setExpanded] = useState(false)
  const detail = parseErrorDetail(errorMessage)
  const textSize = size === 'small' ? 'text-xs' : 'text-sm'

  if (!detail) {
    return <p className={`${textSize} text-red-600 mt-1`}>{errorMessage}</p>
  }

  const suggestions = getSuggestions(detail)

  return (
    <div className="mt-1">
      <p className={`${textSize} text-red-600 font-medium`}>{detail.message}</p>
      <div className="flex items-center gap-3 mt-1">
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
          className="text-xs text-indigo-600 hover:text-indigo-800 underline"
        >
          {expanded ? 'Sembunyikan detail ▲' : 'Lihat detail error ▼'}
        </button>
        {onRetest && (
          <button
            onClick={(e) => { e.stopPropagation(); onRetest() }}
            className="text-xs text-green-600 hover:text-green-800 underline font-medium"
          >
            🔄 Jalankan ulang
          </button>
        )}
      </div>
      {expanded && (
        <div className="mt-2 space-y-3 text-xs">
          {/* Suggestions */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
            <p className="font-bold text-amber-800">💡 Saran Perbaikan:</p>
            {suggestions.map((s, i) => (
              <div key={i} className="flex gap-2">
                <span className="flex-shrink-0">{s.icon}</span>
                <div>
                  <p className="text-amber-900 font-medium">{s.text}</p>
                  <p className="text-amber-700 mt-0.5">→ {s.action}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Technical Detail */}
          <div className="bg-gray-900 text-gray-100 rounded-lg p-3 font-mono space-y-2 overflow-x-auto">
            {/* Step Info */}
            <div>
              <span className="text-yellow-400 font-bold">▸ STEP (Payload)</span>
              <div className="ml-2 mt-1 space-y-0.5">
                <p><span className="text-gray-400">Type:</span> {detail.step.type}</p>
                <p><span className="text-gray-400">Selector:</span> {detail.step.selector || '—'}</p>
                <p><span className="text-gray-400">Value:</span> {detail.step.value || '—'}</p>
                <p><span className="text-gray-400">Description:</span> {detail.step.description || '—'}</p>
              </div>
            </div>

            {/* Page State */}
            <div>
              <span className="text-cyan-400 font-bold">▸ PAGE STATE</span>
              <div className="ml-2 mt-1">
                <p><span className="text-gray-400">URL:</span> {detail.page?.url || '—'}</p>
              </div>
            </div>

            {/* Console Errors */}
            {detail.consoleErrors && detail.consoleErrors.length > 0 && (
              <div>
                <span className="text-red-400 font-bold">▸ CONSOLE ERRORS ({detail.consoleErrors.length})</span>
                <div className="ml-2 mt-1 space-y-1">
                  {detail.consoleErrors.map((err, i) => (
                    <div key={i} className="border-l-2 border-red-500 pl-2">
                      <span className="text-gray-500">[{err.type}]</span> {err.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Failed Network Requests */}
            {detail.failedRequests && detail.failedRequests.length > 0 && (
              <div>
                <span className="text-orange-400 font-bold">▸ FAILED REQUESTS ({detail.failedRequests.length})</span>
                <div className="ml-2 mt-1 space-y-1">
                  {detail.failedRequests.map((req, i) => (
                    <div key={i} className="border-l-2 border-orange-500 pl-2">
                      <p><span className="text-gray-400">{req.method}</span> {req.url}</p>
                      <p className="text-red-400">↳ {req.failure}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Smart Locator Suggestions — DOM-based, no AI needed */}
      {detail && detail.locatorSuggestions && detail.locatorSuggestions.length > 0 && (
        <SmartSuggestionPanel
          suggestions={detail.locatorSuggestions}
          currentSelector={detail.step?.selector}
          onApply={onApplyAIFix}
        />
      )}

      {/* AI Suggestion Panel - Fallback when no smart suggestions available */}
      {detail && step && (!detail.locatorSuggestions || detail.locatorSuggestions.length === 0) && (
        <AISuggestionPanel
          step={step}
          errorMessage={detail.message}
          pageUrl={pageUrl}
          onApply={onApplyAIFix}
          onDismiss={null}
        />
      )}
    </div>
  )
}
