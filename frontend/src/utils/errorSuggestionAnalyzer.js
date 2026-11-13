/**
 * Context-aware error suggestion analyzer for QA.
 * Keep copy short and actionable — one diagnosis + few concrete steps.
 */

const DESKTOP_YT_PATTERN = /ytd-|yt-searchbox|ytd-masthead|\/html\/body\/ytd/i
const MOBILE_URL_PATTERN = /\/\/m\.|\.m\.|\/m\/|m\.youtube/i
const ABSOLUTE_XPATH_PATTERN = /^\/html|^\/\/html/i
const LONG_XPATH_PATTERN = /^\/html.+\/.{80,}/

function detectContext(detail) {
  const msg = detail.message || ''
  const msgLower = msg.toLowerCase()
  const step = detail.step || {}
  const pageUrl = detail.page?.url || ''
  const selector = step.selector || ''
  const execution = detail.execution || {}

  const elementCountMatch = msg.match(/resolved to (\d+) elements/i)
  const strictTarget = msg.match(/waiting for locator\('([^']+)'\)/i)?.[1]
    || msg.match(/waiting for locator\("([^"]+)"\)/i)?.[1]

  return {
    msg,
    msgLower,
    step,
    pageUrl,
    selector,
    execution,
    type: step.type,
    isMobileUrl: MOBILE_URL_PATTERN.test(pageUrl),
    isMobileExecution: !!execution.device || execution.isMobileViewport,
    isDesktopYtSelector: DESKTOP_YT_PATTERN.test(selector),
    isAbsoluteXPath: ABSOLUTE_XPATH_PATTERN.test(selector),
    isLongXPath: LONG_XPATH_PATTERN.test(selector),
    isStrictMode: msgLower.includes('strict mode violation') || /resolved to \d+ elements/i.test(msg),
    isTimeout: msgLower.includes('timeout') && msgLower.includes('waiting'),
    isElementNotFound: /element not found/i.test(msgLower),
    isDetached: msgLower.includes('detached') || msgLower.includes('not attached'),
    isNetwork: msgLower.includes('net::err') || msgLower.includes('err_name_not_resolved'),
    isSsl: msgLower.includes('ssl') || msgLower.includes('certificate') || msgLower.includes('err_cert'),
    isInvalidUrl: msgLower.includes('invalid url'),
    isIframe: msgLower.includes('frame') || msgLower.includes('iframe') || msgLower.includes('cross-origin'),
    isContentEditable: msgLower.includes('contenteditable') || msgLower.includes('not an input'),
    isDialog: msgLower.includes('dialog') || msgLower.includes('alert') || msgLower.includes('confirm'),
    elementCount: elementCountMatch ? parseInt(elementCountMatch[1], 10) : null,
    strictTarget,
    hasLocatorSuggestions: Array.isArray(detail.locatorSuggestions) && detail.locatorSuggestions.length > 0,
    hasConsoleErrors: Array.isArray(detail.consoleErrors) && detail.consoleErrors.length > 0,
    hasFailedRequests: Array.isArray(detail.failedRequests) && detail.failedRequests.length > 0,
    isSearchStep: /search|cari|pencarian|query/i.test(step.description || '') || step.type === 'FILL',
    isYoutube: /youtube\.com/i.test(pageUrl),
  }
}

function makeSuggestion({
  id,
  priority = 5,
  confidence = 'medium',
  category,
  title,
  analysis,
  actions = [],
  icon = '💡',
}) {
  return { id, priority, confidence, category, title, analysis, actions, icon }
}

const CONFIDENCE_ORDER = { high: 0, medium: 1, low: 2 }

/**
 * @returns {{ diagnosis: string|null, suggestions: Array }}
 */
export function analyzeErrorSuggestions(detail) {
  if (!detail) return { diagnosis: null, suggestions: [] }

  const ctx = detectContext(detail)
  const suggestions = []
  const seenCategories = new Set()

  const push = (suggestion) => {
    if (seenCategories.has(suggestion.category)) return
    seenCategories.add(suggestion.category)
    suggestions.push(suggestion)
  }

  if (ctx.isElementNotFound && ctx.selector) {
    push(makeSuggestion({
      id: 'selector-not-found',
      priority: 1,
      confidence: 'high',
      category: 'selector-not-found',
      icon: '🎯',
      title: 'Selector tidak ketemu',
      analysis: `Selector \`${shortSel(ctx.selector)}\` tidak ada di halaman.`,
      actions: [
        ctx.hasLocatorSuggestions
          ? 'Pilih alternatif di panel Smart Locator, lalu Apply.'
          : 'Re-record step ini atau ganti selector dari DevTools.',
      ],
    }))
  }

  if (
    ctx.isMobileUrl &&
    ctx.isDesktopYtSelector &&
    ['FILL', 'CLICK', 'ASSERTION'].includes(ctx.type)
  ) {
    push(makeSuggestion({
      id: 'mobile-desktop-mismatch',
      priority: 1,
      confidence: 'high',
      category: 'mobile-mismatch',
      icon: '📱',
      title: 'Selector desktop di halaman mobile',
      analysis: 'URL mobile, tapi selector masih dari DOM desktop.',
      actions: [
        'Re-record step dengan Mobile viewer.',
        'Atau ganti ke selector atribut: input[name="search_query"].',
      ],
    }))
  }

  if (
    ctx.isMobileExecution &&
    !ctx.isMobileUrl &&
    ctx.isDesktopYtSelector &&
    ['FILL', 'CLICK'].includes(ctx.type)
  ) {
    push(makeSuggestion({
      id: 'mobile-emulation-desktop-dom',
      priority: 2,
      confidence: 'medium',
      category: 'mobile-emulation',
      icon: '📲',
      title: 'Emulasi mobile vs selector desktop',
      analysis: 'Run pakai device mobile, selector masih desktop.',
      actions: ['Samakan URL NAVIGATE dengan saat record, atau re-record di Mobile viewer.'],
    }))
  }

  if (
    ctx.isYoutube &&
    (ctx.isMobileUrl || ctx.isMobileExecution) &&
    ctx.type === 'FILL' &&
    ctx.isSearchStep &&
    ctx.isTimeout
  ) {
    push(makeSuggestion({
      id: 'mobile-search-hidden',
      priority: 2,
      confidence: 'high',
      category: 'mobile-search',
      icon: '🔎',
      title: 'Search box mobile masih tertutup',
      analysis: 'Input search baru muncul setelah ikon Search diklik.',
      actions: ['Tambah step CLICK ikon Search sebelum FILL ini.'],
    }))
  }

  if (ctx.isStrictMode) {
    const target = ctx.strictTarget || ctx.selector
    const isGenericRole = /\[role=["']button["']\]/.test(target || '')
    push(makeSuggestion({
      id: 'strict-mode',
      priority: 2,
      confidence: 'high',
      category: 'strict-mode',
      icon: '⚠️',
      title: `Selector kena ${ctx.elementCount || 'banyak'} elemen`,
      analysis: isGenericRole
        ? `Selector terlalu umum: \`${shortSel(target)}\`.`
        : `Selector tidak unik untuk step ${ctx.type || 'aksi'}.`,
      actions: [
        isGenericRole
          ? 'Perketat: tambah aria-label / name / id (hindari [role="button"] polos).'
          : 'Perketat selector (id, aria-label, atau parent container).',
        ctx.hasLocatorSuggestions ? 'Atau Apply alternatif di Smart Locator.' : 'Edit selector di form step.',
      ],
    }))
  }

  if (ctx.isAbsoluteXPath && (ctx.isTimeout || ctx.isStrictMode)) {
    push(makeSuggestion({
      id: 'fragile-xpath',
      priority: 3,
      confidence: ctx.isLongXPath ? 'high' : 'medium',
      category: 'fragile-xpath',
      icon: '🧩',
      title: 'XPath absolut mudah putus',
      analysis: 'Selector dari /html/body/... rentan berubah layout.',
      actions: ['Ganti ke id / name / aria-label / data-testid, atau re-record step.'],
    }))
  }

  if (ctx.hasLocatorSuggestions && (ctx.isTimeout || ctx.isStrictMode || ctx.isElementNotFound)) {
    push(makeSuggestion({
      id: 'use-locator-suggestions',
      priority: 3,
      confidence: 'high',
      category: 'locator-suggestions',
      icon: '🔧',
      title: 'Ada alternatif selector siap pakai',
      analysis: 'DOM saat gagal sudah dianalisis — biasanya ini perbaikan tercepat.',
      actions: ['Buka Smart Locator → pilih confidence High → Apply → Run ulang.'],
    }))
  }

  if (ctx.isInvalidUrl || ctx.isNetwork) {
    push(makeSuggestion({
      id: 'network-error',
      priority: 2,
      confidence: 'high',
      category: 'network',
      icon: '🌐',
      title: 'URL / koneksi bermasalah',
      analysis: 'Browser tidak bisa membuka target — bukan soal selector.',
      actions: ['Buka URL di browser biasa; cek typo di step NAVIGATE (https://).'],
    }))
  }

  if (ctx.isSsl) {
    push(makeSuggestion({
      id: 'ssl-error',
      priority: 2,
      confidence: 'high',
      category: 'ssl',
      icon: '🔒',
      title: 'Sertifikat SSL invalid',
      analysis: 'HTTPS target bermasalah; eksekusi berhenti sebelum step jalan.',
      actions: ['Pakai URL dengan sertifikat valid / environment staging yang benar.'],
    }))
  }

  if (ctx.hasFailedRequests) {
    push(makeSuggestion({
      id: 'failed-requests',
      priority: 4,
      confidence: 'medium',
      category: 'failed-requests',
      icon: '📡',
      title: `${detail.failedRequests.length} request gagal`,
      analysis: 'API/aset gagal load — elemen target mungkin belum ada.',
      actions: ['Tambah WAIT sebelum step gagal, atau cek API target di Network tab.'],
    }))
  }

  if (ctx.hasConsoleErrors) {
    push(makeSuggestion({
      id: 'console-errors',
      priority: 5,
      confidence: 'low',
      category: 'console-errors',
      icon: '🐛',
      title: `${detail.consoleErrors.length} error di console target`,
      analysis: 'JS error di situs target; bisa memengaruhi render.',
      actions: ['Cek Console di browser; laporkan ke developer situs jika error juga muncul manual.'],
    }))
  }

  if (ctx.isDetached) {
    push(makeSuggestion({
      id: 'detached',
      priority: 3,
      confidence: 'medium',
      category: 'detached',
      icon: '💨',
      title: 'Elemen hilang sebelum diklik/isi',
      analysis: 'Elemen sempat ada, lalu DOM re-render / navigasi.',
      actions: ['Tambah WAIT 500–1500ms sebelum step ini.'],
    }))
  }

  if (ctx.isIframe) {
    push(makeSuggestion({
      id: 'iframe',
      priority: 3,
      confidence: 'medium',
      category: 'iframe',
      icon: '🖼️',
      title: 'Kemungkinan di dalam iframe',
      analysis: 'Elemen tidak di halaman utama.',
      actions: ['Re-record interaksi di dalam iframe (recorder mendukung frame).'],
    }))
  }

  if (ctx.isContentEditable) {
    push(makeSuggestion({
      id: 'contenteditable',
      priority: 3,
      confidence: 'medium',
      category: 'contenteditable',
      icon: '📝',
      title: 'Editor rich text (bukan input biasa)',
      analysis: 'Target contenteditable (CKEditor/Quill, dll).',
      actions: ['Re-record langsung di area editor yang aktif.'],
    }))
  }

  const hasSpecificCause = seenCategories.has('selector-not-found')
    || seenCategories.has('mobile-mismatch')
    || seenCategories.has('mobile-search')
    || seenCategories.has('strict-mode')
    || seenCategories.has('network')
    || seenCategories.has('locator-suggestions')

  if (ctx.isTimeout && !hasSpecificCause) {
    if (ctx.type === 'FILL') {
      push(makeSuggestion({
        id: 'fill-timeout',
        priority: 6,
        confidence: 'medium',
        category: 'fill-timeout',
        icon: '⌨️',
        title: 'Input tidak muncul (timeout)',
        analysis: 'Field belum visible / selector usang / halaman belum siap.',
        actions: [
          ctx.hasLocatorSuggestions
            ? 'Coba alternatif Smart Locator dulu.'
            : 'Cek NAVIGATE berhasil, lalu tambah WAIT ~2s sebelum FILL.',
        ],
      }))
    } else if (ctx.type === 'CLICK') {
      push(makeSuggestion({
        id: 'click-timeout',
        priority: 6,
        confidence: 'medium',
        category: 'click-timeout',
        icon: '👆',
        title: 'Target klik tidak ketemu',
        analysis: 'Tombol/link tertutup overlay, belum visible, atau selector berubah.',
        actions: ['Tutup popup/cookie banner; tambah WAIT; atau re-record klik.'],
      }))
    } else if (ctx.type === 'NAVIGATE') {
      push(makeSuggestion({
        id: 'navigate-timeout',
        priority: 6,
        confidence: 'medium',
        category: 'navigate-timeout',
        icon: '🌐',
        title: 'Halaman tidak selesai load',
        analysis: 'NAVIGATE melebihi timeout.',
        actions: ['Pastikan URL benar dan situs bisa dibuka manual.'],
      }))
    }
  }

  if (suggestions.length === 0) {
    push(makeSuggestion({
      id: 'generic',
      priority: 9,
      confidence: 'low',
      category: 'generic',
      icon: '💡',
      title: 'Error belum terklasifikasi',
      analysis: 'Belum ada pola spesifik dari pesan error.',
      actions: ['Run ulang sekali; bila gagal lagi, re-record step yang fail.'],
    }))
  }

  suggestions.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority
    return CONFIDENCE_ORDER[a.confidence] - CONFIDENCE_ORDER[b.confidence]
  })

  const hasHigh = suggestions.some((s) => s.confidence === 'high')
  const filtered = hasHigh
    ? suggestions.filter((s) => s.confidence !== 'low' || s.priority <= 3)
    : suggestions

  const top = filtered.slice(0, 3)

  const diagnosis = top[0]
    ? `${top[0].title}: ${top[0].analysis}`
    : null

  return { diagnosis, suggestions: top }
}

function shortSel(sel) {
  const s = String(sel || '')
  return s.length > 64 ? `${s.slice(0, 61)}…` : s
}

export const CONFIDENCE_LABELS = {
  high: { text: 'High', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  medium: { text: 'Medium', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  low: { text: 'Low', className: 'bg-gray-100 text-gray-600 border-gray-200' },
}
