/**
 * Context-aware error suggestion analyzer.
 * Ranks suggestions by relevance so generic tips are not shown when a specific root cause is known.
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

  // ── Selector not found (wrong/typo selector) ────────────────────────────────
  if (ctx.isElementNotFound && ctx.selector) {
    push(makeSuggestion({
      id: 'selector-not-found',
      priority: 1,
      confidence: 'high',
      category: 'selector-not-found',
      icon: '🎯',
      title: 'Selector does not match any element',
      analysis:
        `The selector "${ctx.selector}" was not found on the page at ${ctx.pageUrl || 'the current URL'}. This usually means a typo, an outdated selector, or the wrong target element.`,
      actions: [
        'Verify the selector in browser DevTools (Elements → right-click → Copy selector).',
        'Use "Test New Selector" below to try alternatives before saving.',
        ctx.hasLocatorSuggestions
          ? 'Pick a working alternative from Smart Locator Suggestions.'
          : 'Re-record this step to capture an up-to-date selector.',
      ],
    }))
  }

  // ── Mobile URL + desktop selector ───────────────────────────────────────────
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
      title: 'Desktop selector used on a mobile page',
      analysis:
        `The current URL (${ctx.pageUrl || 'mobile'}) uses a mobile layout, but this step's selector was recorded for desktop YouTube (ytd-app, yt-searchbox, etc.). Mobile DOM structure is different, so the element will not be found.`,
      actions: [
        'Re-run the scenario — the engine tries mobile fallback selectors automatically.',
        'If it still fails, re-record this step with Mobile viewer enabled.',
        'For long-term stability, use attribute-based selectors: input[name="search_query"] or role:searchbox.',
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
      title: 'Mobile viewer with a desktop selector',
      analysis:
        'The scenario runs with mobile device emulation, but the page may still show a desktop layout. The selector can fail when the site redirects to a mobile URL (e.g. m.youtube.com).',
      actions: [
        'Ensure the NAVIGATE step uses the same URL as during recording.',
        'Re-record in Mobile viewer if the target site auto-redirects to m.*.',
      ],
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
      title: 'Mobile search box may still be hidden',
      analysis:
        'On m.youtube.com, the search input is often hidden until the Search icon is tapped. The timeout happens because FILL looks for an input that is not visible yet.',
      actions: [
        'Add a CLICK step on the Search icon before this FILL step (if missing).',
        'Re-run — the engine tries to open the mobile search overlay automatically.',
        'Add a WAIT step (1000ms) after NAVIGATE if the page is still loading.',
      ],
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
      title: `Selector matches ${ctx.elementCount || 'multiple'} elements`,
      analysis: isGenericRole
        ? `Selector "${target}" is too broad — Playwright found many similar buttons (e.g. channel avatars, thumbnails) and cannot pick one.`
        : `Selector "${target || ctx.selector}" is not unique. Playwright needs exactly one element for this ${ctx.type || 'action'}.`,
      actions: isGenericRole
        ? [
            'Use a more specific selector: aria-label, name, placeholder, or id.',
            'Avoid bare [role="button"] — add context, e.g. button[aria-label*="Search"].',
            ctx.hasLocatorSuggestions
              ? 'See Smart Locator Suggestions below for better alternatives.'
              : 'Re-record the interaction to get a more specific selector.',
          ]
        : [
            'Narrow the selector: add id, aria-label, name, or a parent container.',
            ctx.hasLocatorSuggestions
              ? 'Use an alternative from Smart Locator Suggestions.'
              : 'Edit the selector manually in the step form.',
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
      title: 'Absolute XPath is fragile',
      analysis:
        'The selector uses a long XPath from the HTML root (/html/body/...). Small layout, viewport, or mobile/desktop changes will break it.',
      actions: [
        'Switch to attribute-based selectors: id, name, aria-label, placeholder, or data-testid.',
        'Re-record this step — the recorder usually produces more stable selectors.',
        'For mobile + desktop, store two selectors (primary + mobileSelector in metadata).',
      ],
    }))
  }

  if (ctx.hasLocatorSuggestions && (ctx.isTimeout || ctx.isStrictMode || ctx.isElementNotFound)) {
    push(makeSuggestion({
      id: 'use-locator-suggestions',
      priority: 3,
      confidence: 'high',
      category: 'locator-suggestions',
      icon: '🔧',
      title: 'Alternative selectors found on the page',
      analysis:
        'When the error occurred, the system analyzed the page DOM and found similar elements. This is usually the fastest fix.',
      actions: [
        'Open the Smart Locator Suggestions panel below.',
        'Pick an alternative with High confidence, then click "Apply".',
        'Re-run the scenario to verify.',
      ],
    }))
  }

  if (ctx.isInvalidUrl || ctx.isNetwork) {
    push(makeSuggestion({
      id: 'network-error',
      priority: 2,
      confidence: 'high',
      category: 'network',
      icon: '🌐',
      title: 'Connection or URL problem',
      analysis: 'The browser could not reach the target page. This is usually not a selector issue.',
      actions: [
        'Open the URL in a normal browser to confirm the site is online.',
        'Check for typos in the NAVIGATE step (https://, www, etc.).',
        'Try again later if the site is down.',
      ],
    }))
  }

  if (ctx.isSsl) {
    push(makeSuggestion({
      id: 'ssl-error',
      priority: 2,
      confidence: 'high',
      category: 'ssl',
      icon: '🔒',
      title: 'Invalid SSL certificate',
      analysis: 'The target site has an HTTPS certificate problem. Execution stops before the step can run.',
      actions: [
        'This is an issue on the target website, not your scenario.',
        'Use a URL with a valid certificate or the correct staging environment.',
      ],
    }))
  }

  if (ctx.hasFailedRequests) {
    push(makeSuggestion({
      id: 'failed-requests',
      priority: 4,
      confidence: 'medium',
      category: 'failed-requests',
      icon: '📡',
      title: `${detail.failedRequests.length} network request(s) failed`,
      analysis:
        'Some resources (API, images, scripts) failed to load. The page may be incomplete and the target element may not exist yet.',
      actions: [
        'Check whether the target site works normally in a regular browser.',
        'Add a WAIT step before the failing step if the page depends on API data.',
      ],
    }))
  }

  if (ctx.hasConsoleErrors) {
    push(makeSuggestion({
      id: 'console-errors',
      priority: 5,
      confidence: 'low',
      category: 'console-errors',
      icon: '🐛',
      title: `${detail.consoleErrors.length} error(s) in the target page console`,
      analysis:
        'The tested website threw JavaScript errors. This may affect rendering but is not always the root cause.',
      actions: [
        'Open DevTools in a regular browser and check the Console tab.',
        'If errors appear during manual browsing too, report them to the site developers.',
      ],
    }))
  }

  if (ctx.isDetached) {
    push(makeSuggestion({
      id: 'detached',
      priority: 3,
      confidence: 'medium',
      category: 'detached',
      icon: '💨',
      title: 'Element disappeared before interaction',
      analysis: 'The element was found, then removed from the DOM (re-render, animation, or partial navigation) before the action completed.',
      actions: [
        'Add a WAIT step (500–1500ms) before this step.',
        'Re-record — there may be a loading state that needs to be waited for.',
      ],
    }))
  }

  if (ctx.isIframe) {
    push(makeSuggestion({
      id: 'iframe',
      priority: 3,
      confidence: 'medium',
      category: 'iframe',
      icon: '🖼️',
      title: 'Element may be inside an iframe',
      analysis: 'The selector did not find the element on the main page. The target may be in a separate frame.',
      actions: [
        'Re-record the interaction — the recorder supports iframes.',
        'Ensure the selector includes frame context if required.',
      ],
    }))
  }

  if (ctx.isContentEditable) {
    push(makeSuggestion({
      id: 'contenteditable',
      priority: 3,
      confidence: 'medium',
      category: 'contenteditable',
      icon: '📝',
      title: 'Rich text editor detected',
      analysis: 'The target is a contenteditable element (CKEditor, Quill, etc.), not a standard input.',
      actions: [
        'Re-record the interaction directly on the editor.',
        'Ensure the selector points to the correct editable area.',
      ],
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
        title: 'Input not found within the timeout',
        analysis:
          'The input did not appear or the selector is no longer valid. Common causes: page still loading, form not opened, or UI changed.',
        actions: [
          ctx.hasLocatorSuggestions
            ? 'Try an alternative from Smart Locator Suggestions first.'
            : 'Verify the previous NAVIGATE step succeeded and the URL is correct.',
          'Add a WAIT step (2000ms) before FILL if the page is slow.',
          'Re-record the step if the site layout changed.',
        ],
      }))
    } else if (ctx.type === 'CLICK') {
      push(makeSuggestion({
        id: 'click-timeout',
        priority: 6,
        confidence: 'medium',
        category: 'click-timeout',
        icon: '👆',
        title: 'Click target not found',
        analysis: 'The button or link is not visible, hidden by an overlay, or the selector no longer matches.',
        actions: [
          'Add a WAIT step (1000–3000ms) before this CLICK.',
          'Check for popups, cookie banners, or modals covering the element.',
          'Re-record the interaction for an up-to-date selector.',
        ],
      }))
    } else if (ctx.type === 'NAVIGATE') {
      push(makeSuggestion({
        id: 'navigate-timeout',
        priority: 6,
        confidence: 'medium',
        category: 'navigate-timeout',
        icon: '🌐',
        title: 'Page did not finish loading',
        analysis: 'Navigation to the URL exceeded the wait timeout.',
        actions: [
          'Confirm the URL is correct and the site is reachable.',
          'Try opening the URL manually in a browser.',
        ],
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
      title: 'Unclassified error',
      analysis: 'No specific error pattern was detected. Try the general steps below.',
      actions: [
        'Re-run the scenario once.',
        'Review Step Payload and Page State in the error details.',
        'Edit or re-record the failing step.',
      ],
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

  const top = filtered.slice(0, 4)

  const diagnosis = top[0]
    ? `${top[0].title} — ${top[0].analysis.split('.')[0]}.`
    : null

  return { diagnosis, suggestions: top }
}

export const CONFIDENCE_LABELS = {
  high: { text: 'High', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  medium: { text: 'Medium', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  low: { text: 'Low', className: 'bg-gray-100 text-gray-600 border-gray-200' },
}
