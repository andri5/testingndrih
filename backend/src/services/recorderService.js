import { prisma } from '../lib/prisma.js'
import { chromium, firefox, webkit } from 'playwright'
import browserLauncher from '../lib/browserLauncher.js'

/**
 * PRIORITY: Playwright-Based Recorder Engine
 * 
 * Each recording session uses a Playwright browser instance to:
 * 1. Open the target URL with full network/cookie/storage access
 * 2. Inject recorder script to capture user interactions
 * 3. Record interactions in memory
 * 4. Close browser on stop recording
 * 
 * Session store - keyed by `userId:scenarioId`
 */
const sessions = new Map()

// headless: false so user can see and interact with the browser during recording
const BROWSER_OPTIONS = {
  headless: false,
  args: [
    '--disable-blink-features=AutomationControlled',
    '--disable-dev-shm-usage',
    '--no-sandbox'
  ]
}

function sessionKey(userId, scenarioId) {
  return `${userId}:${scenarioId}`
}

/**
 * JavaScript injected into the target page to capture user interactions.
 * Communication: PRIMARY postMessage (reliable), FALLBACK console.log (CSP-proof).
 * QUEUE: Retry failed steps with exponential backoff.
 *
 * Supports: Shadow DOM, iframes, contenteditable, SPA navigation,
 *           dynamic class filtering, selector uniqueness validation.
 */
export function getRecorderScript(sessionId = null) {
  const sendStepFn = sessionId !== null
    ? `  var __SESSION_ID = ${JSON.stringify(String(sessionId))};
  var __nativeFetch = window.__nativeFetch || window.fetch.bind(window);
  var __recOrigin = window.__recOrigin || window.location.origin;
  var __stepCount = 0;
  var __failedQueue = [];
  var __retryCount = {};
  var __maxRetries = 3;
  var __retryDelays = [500, 2000, 5000]; // ms between retries
  var __connectionOk = true;
  
  function __showRecErr(msg) {
    var el = document.getElementById('__rec_status');
    if (el) { el.textContent = '\u26a0 ' + msg; el.style.background = '#b91c1c'; }
    __connectionOk = false;
  }
  
  function __showRecInfo(msg) {
    var el = document.getElementById('__rec_status');
    if (el && __connectionOk) { el.textContent = '\u2714 ' + msg; el.style.background = '#10b981'; }
  }
  
  function __updateCounter() {
    __stepCount++;
    var el = document.getElementById('__rec_count');
    if (el) {
      el.dataset.n = __stepCount;
      el.textContent = __stepCount + ' step' + (__stepCount !== 1 ? 's' : '');
    }
  }
  
  function __processFailedQueue() {
    // Try to resend any failed steps
    if (__failedQueue.length === 0) return;
    var step = __failedQueue[0];
    var attempts = __retryCount[step.id] || 0;
    if (attempts >= __maxRetries) {
      __failedQueue.shift();
      __showRecErr('Step dropped after ' + __maxRetries + ' retries');
      return;
    }
    
    // Retry logic
    var delay = __retryDelays[Math.min(attempts, __retryDelays.length - 1)];
    setTimeout(function() {
      __sendStepDirect(step, true);
    }, delay);
  }
  
  function __sendStepDirect(step, isRetry) {
    var token = localStorage.getItem('authToken');
    if (!token) { __showRecErr('authToken tidak ditemukan'); return; }
    var stepId = step.selector + '_' + step.timestamp;
    
    __nativeFetch(__recOrigin + '/api/recorder/step/' + __SESSION_ID, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(step),
      signal: AbortSignal.timeout(10000)
    }).then(function(r) {
      if (r.ok) {
        __updateCounter();
        __connectionOk = true;
        __showRecInfo('Connected');
        if (isRetry) {
          var idx = __failedQueue.findIndex(function(s) { return (s.selector + '_' + s.timestamp) === stepId; });
          if (idx >= 0) __failedQueue.splice(idx, 1);
        }
        __processFailedQueue();
      } else if (r.status === 409) {
        __showRecErr('Recording session ended');
      } else {
        __showRecErr('Step failed: HTTP ' + r.status);
        if (!isRetry) {
          __failedQueue.push(step);
          __retryCount[stepId] = 1;
        } else {
          __retryCount[stepId] = (__retryCount[stepId] || 0) + 1;
        }
        __processFailedQueue();
      }
    }).catch(function(e) {
      __showRecErr('Fetch error: ' + e.message);
      if (!isRetry) {
        __failedQueue.push(step);
        __retryCount[stepId] = 1;
      } else {
        __retryCount[stepId] = (__retryCount[stepId] || 0) + 1;
      }
      __processFailedQueue();
    });
  }
  
  function sendStep(step) {
    // ═══ METHOD 0: Playwright exposeFunction (PRIMARY when running in Playwright browser) ═══
    // This is called when recording via Playwright — no HTTP, no auth token needed
    if (typeof window.__playwrightAddStep === 'function') {
      try {
        window.__playwrightAddStep(step);
        __updateCounter();
        __showRecInfo('Recording');
      } catch(e) {
        console.error('[REC] __playwrightAddStep failed:', e);
      }
      return;
    }

    var token = localStorage.getItem('authToken');
    if (!token) { __showRecErr('authToken tidak ditemukan'); return; }
    
    // ═══ METHOD 1: postMessage (PRIMARY - reliable) ═══
    // Send to parent window (ScenarioDetailPage) via postMessage
    try {
      window.parent.postMessage({
        type: '__REC_STEP__',
        sessionId: __SESSION_ID,
        data: step,
        token: token,
        timestamp: Date.now()
      }, '*');
    } catch(e) {
      console.error('[REC] postMessage failed:', e);
    }
    
    // ═══ METHOD 2: Direct fetch (FALLBACK - for direct iframe access) ═══
    // Also send directly in case parent doesn't listen (e.g., cross-domain)
    __sendStepDirect(step, false);
  }`
    : `  function sendStep(step) {
    try { console.log('__REC__' + JSON.stringify(step)); } catch(e) {}
  }`
  return `
(function() {
  if (window.__recorderInjected) return;
  window.__recorderInjected = true;

` + sendStepFn + `

  /* ══════════════════════════════════════════════════
   * DYNAMIC CLASS FILTER — strips framework-generated classes
   * Covers: Angular (_ngcontent, _nghost, ng-), React (css-), Vue (data-v-),
   * Styled Components (sc-), Tailwind JIT (!), Emotion, CSS Modules (hash suffixes)
   * ══════════════════════════════════════════════════ */
  var dynamicClassRe = /^(_ng|ng-|data-v-|sc-|css-|emotion-|jsx-|svelte-|astro-|__).*/;
  var hashSuffixRe = /^[a-zA-Z][a-zA-Z0-9_-]*[_-][a-zA-Z0-9]{5,8}$/;

  function isStableClass(cls) {
    if (!cls || cls.length === 0 || cls.length > 60) return false;
    if (dynamicClassRe.test(cls)) return false;
    if (hashSuffixRe.test(cls)) return false;
    // Filter Tailwind responsive/state prefix classes (hover:, focus:, dark:, sm:, etc.)
    // These contain colons which are invalid in unescaped CSS selectors
    if (cls.includes(':')) return false;
    return true;
  }

  /* ══════════════════════════════════════════════════
   * SHADOW DOM HELPERS — traverse into shadow roots
   * ══════════════════════════════════════════════════ */
  function getHostChain(el) {
    // Walk up through shadow roots to get the host elements chain
    var chain = [];
    var cur = el;
    while (cur) {
      var root = cur.getRootNode && cur.getRootNode();
      if (root && root !== document && root.host) {
        chain.unshift(root.host);
        cur = root.host;
      } else {
        break;
      }
    }
    return chain;
  }

  function buildShadowPrefix(el) {
    var hosts = getHostChain(el);
    if (hosts.length === 0) return '';
    var parts = hosts.map(function(h) { return buildSelectorForElement(h); });
    return parts.join(' >>> ') + ' >>> ';
  }

  /* ══════════════════════════════════════════════════
   * SELECTOR BUILDER — builds stable, unique selectors
   * Priority: data-testid > id > name > aria-label > placeholder > role+text > cssPath
   * Validates uniqueness and auto-adds :nth-of-type if needed
   * ══════════════════════════════════════════════════ */
  function buildSelectorForElement(el) {
    if (!el || !el.tagName) return '';
    // ═══ Phase 1.4: 10-Level Priority Selector Engine ═══
    // 1. data-testid (most reliable - explicitly set for testing)
    if (el.dataset && el.dataset.testid) return '[data-testid="' + el.dataset.testid + '"]';
    // 2. Stable ID (no digits-only, no colons/dots which are dynamic)
    if (el.id && el.id.length < 80 && !/^[0-9]|[:.]|^(ember|react|vue|ng-)/.test(el.id))
      return '#' + (CSS.escape ? CSS.escape(el.id) : el.id);
    // 3. name attribute (form elements)
    if (el.name && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName))
      return el.tagName.toLowerCase() + '[name="' + el.name + '"]';
    // 4. aria-label (accessible and stable)
    if (el.getAttribute('aria-label'))
      return '[aria-label="' + el.getAttribute('aria-label') + '"]';
    // 5. placeholder (for inputs)
    if (el.placeholder && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA'))
      return el.tagName.toLowerCase() + '[placeholder="' + el.placeholder + '"]';
    // 6. Custom data attributes (data-id, data-name, data-identifier)
    var dataId = el.getAttribute('data-id') || el.getAttribute('data-name') || el.getAttribute('data-identifier');
    if (dataId && dataId.length > 0 && dataId.length < 80)
      return '[data-id="' + dataId + '"]';
    // 7. role + text for buttons and links (interactive elements)
    if ((el.tagName === 'BUTTON' || el.tagName === 'A' || (el.getAttribute('role') === 'button')) && el.textContent) {
      var txt = el.textContent.trim();
      if (txt.length > 0 && txt.length < 60) {
        var tag = el.tagName.toLowerCase();
        if (tag === 'button' || el.getAttribute('role') === 'button')
          return 'button:has-text("' + txt + '")';
        if (tag === 'a') return 'a:has-text("' + txt + '")';
      }
    }
    // 8. input type (but not generic 'text')
    if (el.tagName === 'INPUT' && el.type && el.type !== 'text')
      return 'input[type="' + el.type + '"]';
    // 9. Other custom attributes (title, href for links)
    if (el.getAttribute('title') && el.getAttribute('title').length < 100)
      return '[title="' + el.getAttribute('title') + '"]';
    if (el.tagName === 'A' && el.href && el.href.length < 200)
      return 'a[href="' + el.href + '"]';
    // 10. Fallback to cssPath with stable classes (most general)
    return cssPath(el);
  }

  function buildSelector(el) {
    var shadowPrefix = buildShadowPrefix(el);
    var sel = buildSelectorForElement(el);

    // ═══ SELECTOR UNIQUENESS VALIDATION ═══
    // If selector matches multiple elements, refine it
    if (sel && !shadowPrefix) {
      try {
        var root = el.getRootNode ? el.getRootNode() : document;
        var matches = (root.querySelectorAll ? root : document).querySelectorAll(sel);
        if (matches.length > 1) {
          // Try adding nth-of-type
          var parent = el.parentElement;
          if (parent) {
            var idx = 0;
            for (var i = 0; i < parent.children.length; i++) {
              try {
                if (parent.children[i].matches && parent.children[i].matches(sel)) {
                  idx++;
                  if (parent.children[i] === el) break;
                }
              } catch(_) { idx++; if (parent.children[i] === el) break; }
            }
            if (idx > 0) {
              // Build a more specific selector using parent context
              var parentSel = buildSelectorForElement(parent);
              if (parentSel) sel = parentSel + ' > ' + sel + ':nth-child(' + (Array.prototype.indexOf.call(parent.children, el) + 1) + ')';
            }
          }
        }
      } catch (_) { /* querySelectorAll might fail on some selectors */ }
    }

    return shadowPrefix + sel;
  }

  /* ═══════════════════════════════════════════════════════════
   * Phase 1.4b: FALLBACK SELECTOR GENERATION
   * Generates multiple selector candidates if primary fails
   * Returns best selector, with fallbacks stored for replay
   * ═══════════════════════════════════════════════════════════ */
  function generateFallbackSelectors(el) {
    var selectors = [];
    var primary = buildSelector(el);
    if (primary) selectors.push(primary);
    
    // Fallback 1: CSS Path from parent context
    var cssPath1 = cssPath(el);
    if (cssPath1 && cssPath1 !== primary) selectors.push(cssPath1);
    
    // Fallback 2: Index-based path (position in parent)
    if (el.parentElement) {
      var parentSel = buildSelectorForElement(el.parentElement);
      var childIdx = Array.prototype.indexOf.call(el.parentElement.children, el);
      if (parentSel && childIdx >= 0) {
        selectors.push(parentSel + ' > ' + el.tagName.toLowerCase() + ':nth-child(' + (childIdx + 1) + ')');
      }
    }
    
    // Fallback 3: Tag name + stable classes
    if (el.className && typeof el.className === 'string') {
      var stableClasses = el.className.trim().split(/\\s+/).filter(isStableClass).slice(0, 3);
      if (stableClasses.length) {
        selectors.push(el.tagName.toLowerCase() + '.' + stableClasses.join('.'));
      }
    }
    
    return selectors.length > 0 ? selectors : [primary || el.tagName.toLowerCase()];
  }

  function cssPath(el) {
    var parts = [];
    var cur = el;
    while (cur && cur.nodeType === 1 && cur !== document.body && parts.length < 5) {
      var sel = cur.tagName.toLowerCase();
      if (cur.id && cur.id.length < 80 && !/^[0-9]|[:.]|^(ember|react|vue|ng-)/.test(cur.id)) {
        parts.unshift('#' + (CSS.escape ? CSS.escape(cur.id) : cur.id));
        break;
      }
      if (cur.className && typeof cur.className === 'string') {
        var cls = cur.className.trim().split(/\\s+/).filter(isStableClass).slice(0, 2);
        if (cls.length) sel += '.' + cls.map(function(c) { return CSS.escape ? CSS.escape(c) : c; }).join('.');
      }
      var parent = cur.parentElement;
      if (parent) {
        var siblings = [];
        for (var i = 0; i < parent.children.length; i++) {
          if (parent.children[i].tagName === cur.tagName) siblings.push(parent.children[i]);
        }
        if (siblings.length > 1) sel += ':nth-of-type(' + (siblings.indexOf(cur) + 1) + ')';
      }
      parts.unshift(sel);
      cur = cur.parentElement;
    }
    return parts.join(' > ');
  }

  /* ══════════════════════════════════════════════════
   * DUPLICATE CHECK & PREVENTION
   * Prevents redundant FILL/CLICK events within time windows
   * ══════════════════════════════════════════════════ */
  var lastFillSelector = '';
  var lastFillValue = '';
  var lastClickSelector = '';
  var lastClickTime = 0;

  function emitFill(el) {
    if (!el || !el.tagName) return;
    var selector = buildSelector(el);
    var tag = el.tagName.toLowerCase();
    var value, desc;

    if (el.type === 'checkbox' || el.type === 'radio') {
      value = el.checked ? 'true' : 'false';
      var lbl = (el.labels && el.labels[0]) ? el.labels[0].textContent.trim() : (el.name || el.placeholder || el.type);
      desc = (el.checked ? 'Check' : 'Uncheck') + ' "' + lbl.substring(0, 40) + '"';
    } else if (tag === 'select') {
      value = el.value;
      var opt = el.options && el.options[el.selectedIndex];
      desc = 'Select "' + (opt ? opt.text : el.value).substring(0, 40) + '"';
    } else {
      value = el.value || el.textContent || '';
      var label = ((el.labels && el.labels[0]) ? el.labels[0].textContent.trim() : '') || el.placeholder || el.name || el.type || '';
      desc = 'Fill "' + label.substring(0, 40) + '" with "' + value.substring(0, 30) + '"';
    }

    if (selector === lastFillSelector && value === lastFillValue) return;
    lastFillSelector = selector;
    lastFillValue = value;

    sendStep({ type: 'FILL', selector: selector, value: value, description: desc, tagName: tag, timestamp: Date.now() });
  }

  /* ══════════════════════════════════════════════════
   * CONTENTEDITABLE SUPPORT — captures rich text editors
   * (Gmail compose, WordPress, Notion, CKEditor, etc.)
   * ══════════════════════════════════════════════════ */
  function isContentEditable(el) {
    if (!el) return false;
    if (el.isContentEditable) return true;
    if (el.getAttribute && el.getAttribute('contenteditable') === 'true') return true;
    if (el.getAttribute && el.getAttribute('role') === 'textbox') return true;
    return false;
  }

  var ceDebounce = new Map();

  function handleContentEditableInput(el) {
    if (ceDebounce.has(el)) clearTimeout(ceDebounce.get(el));
    ceDebounce.set(el, setTimeout(function() {
      ceDebounce.delete(el);
      var selector = buildSelector(el);
      var text = (el.innerText || el.textContent || '').trim();
      if (!text) return;
      var desc = 'Fill rich text with "' + text.substring(0, 30) + '"';

      if (selector === lastFillSelector && text === lastFillValue) return;
      lastFillSelector = selector;
      lastFillValue = text;

      sendStep({ type: 'FILL', selector: selector, value: text, description: desc, tagName: el.tagName.toLowerCase(), contentEditable: true, timestamp: Date.now() });
    }, 700));
  }

  /* ══════════════════════════════════════════════════
   * PENDING INPUT TRACKING (debounced)
   * ══════════════════════════════════════════════════ */
  var pendingEls = new Map();

  function flushAll() {
    pendingEls.forEach(function(t, el) { clearTimeout(t); emitFill(el); });
    pendingEls.clear();
    ceDebounce.forEach(function(t, el) { clearTimeout(t); handleContentEditableInput(el); });
  }

  /* ══════════════════════════════════════════════════
   * EVENT LISTENERS (attached to document root)
   * ══════════════════════════════════════════════════ */

  /* ── Click ── */
  document.addEventListener('click', function(e) {
    var el = e.target;
    if (!el) return;

    // Walk up composed path for Shadow DOM clicks
    if (e.composedPath && e.composedPath().length > 0) {
      el = e.composedPath()[0];
    }

    flushAll();

    if (el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio')) {
      setTimeout(function() { emitFill(el); }, 50);
      return;
    }

    var tag = el.tagName ? el.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    // If contenteditable is clicked, don't emit CLICK (will be captured as FILL)
    if (isContentEditable(el)) return;

    var selector = buildSelector(el);
    var text = (el.textContent || '').trim().substring(0, 80);
    var desc = tag === 'a' ? 'Click link "' + text + '"'
             : tag === 'button' ? 'Click button "' + text + '"'
             : 'Click ' + tag + (text ? ' "' + text.substring(0, 30) + '"' : '');

    // Phase 1.3: Duplicate click prevention (500ms window)
    // Filters accidental double-clicks within 500ms of same selector
    var now = Date.now();
    if (selector === lastClickSelector && (now - lastClickTime) < 500) {
      console.log('[REC] Duplicate click filtered: ' + selector);
      return; // Skip duplicate
    }
    lastClickSelector = selector;
    lastClickTime = now;

    sendStep({ type: 'CLICK', selector: selector, value: '', description: desc, tagName: tag, timestamp: now });
  }, true);

  /* ── Input (debounced) ── */
  document.addEventListener('input', function(e) {
    var el = e.target;
    if (e.composedPath && e.composedPath().length > 0) el = e.composedPath()[0];
    if (!el) return;

    // Contenteditable support
    if (isContentEditable(el)) {
      handleContentEditableInput(el);
      return;
    }

    if (!el.tagName || !/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
    if (el.type === 'file' || el.type === 'checkbox' || el.type === 'radio') return;

    if (pendingEls.has(el)) clearTimeout(pendingEls.get(el));
    // Phase 1.2: Increased debounce from 400ms to 500ms to filter ~50% redundant input events
    pendingEls.set(el, setTimeout(function() { emitFill(el); pendingEls.delete(el); }, 500));
  }, true);

  /* ── Blur: flush pending input ── */
  document.addEventListener('focusout', function(e) {
    var el = e.target;
    if (!el) return;
    if (isContentEditable(el)) { flushAll(); return; }
    if (!/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
    if (pendingEls.has(el)) { clearTimeout(pendingEls.get(el)); pendingEls.delete(el); }
    if (el.value) emitFill(el);
  }, true);

  /* ── Paste ── */
  document.addEventListener('paste', function(e) {
    var el = e.target;
    if (e.composedPath && e.composedPath().length > 0) el = e.composedPath()[0];
    if (!el) return;
    if (isContentEditable(el)) { setTimeout(function() { handleContentEditableInput(el); }, 100); return; }
    if (!/^(INPUT|TEXTAREA)$/.test(el.tagName)) return;
    if (pendingEls.has(el)) { clearTimeout(pendingEls.get(el)); pendingEls.delete(el); }
    setTimeout(function() { emitFill(el); }, 100);
  }, true);

  /* ── Change (select, date, etc) ── */
  document.addEventListener('change', function(e) {
    var el = e.target;
    if (!el) return;
    if (el.type === 'checkbox' || el.type === 'radio' || el.type === 'file') return;
    if (el.tagName === 'INPUT' && /^(text|search|email|password|tel|url|number)$/.test(el.type)) return;
    if (el.tagName === 'TEXTAREA') return;
    emitFill(el);
  }, true);

  /* ── Form submit ── */
  document.addEventListener('submit', function() { flushAll(); }, true);

  /* ── File Upload ── */
  document.addEventListener('change', function(e) {
    var el = e.target;
    if (e.composedPath && e.composedPath().length > 0) el = e.composedPath()[0];
    if (!el || el.tagName !== 'INPUT' || el.type !== 'file') return;
    var files = el.files || [];
    if (!files.length) return;
    var fileNames = [];
    for (var i = 0; i < files.length; i++) { fileNames.push(files[i].name); }
    var selector = buildSelector(el);
    var label = ((el.labels && el.labels[0]) ? el.labels[0].textContent.trim() : '') || el.name || 'file';
    var desc = 'Upload file "' + fileNames.join(', ').substring(0, 50) + '" to "' + label.substring(0, 30) + '"';
    sendStep({ type: 'FILE_UPLOAD', selector: selector, value: fileNames.join('|'), description: desc, tagName: 'input', timestamp: Date.now() });
  }, true);

  /* ══════════════════════════════════════════════════
   * HOVER RECORDING — captures intentional hover (500ms dwell)
   * Only records hover on interactive or meaningful elements
   * ══════════════════════════════════════════════════ */
  var hoverTimer = null;
  var lastHoveredSel = '';
  document.addEventListener('mouseover', function(e) {
    var el = e.target;
    if (e.composedPath && e.composedPath().length > 0) el = e.composedPath()[0];
    if (!el || !el.tagName) return;
    var tag = el.tagName.toLowerCase();
    // Only hover on interactive/meaningful elements
    if (!/^(button|a|[data-tooltip]|[title])$/.test(tag) &&
        !el.getAttribute('title') && !el.getAttribute('data-tooltip') &&
        !el.getAttribute('aria-label') && tag !== 'button' && tag !== 'a' &&
        !(el.getAttribute('role') === 'button') && !(el.getAttribute('role') === 'menuitem') &&
        !(el.getAttribute('role') === 'tooltip')) return;
    if (hoverTimer) clearTimeout(hoverTimer);
    hoverTimer = setTimeout(function() {
      var selector = buildSelector(el);
      if (!selector || selector === lastHoveredSel) return;
      lastHoveredSel = selector;
      var text = (el.textContent || el.getAttribute('title') || el.getAttribute('aria-label') || '').trim().substring(0, 40);
      var desc = 'Hover over ' + tag + (text ? ' "' + text + '"' : '');
      sendStep({ type: 'HOVER', selector: selector, value: '', description: desc, tagName: tag, timestamp: Date.now() });
    }, 500);
  }, true);
  document.addEventListener('mouseout', function() {
    if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
  }, true);

  /* ══════════════════════════════════════════════════
   * SCROLL RECORDING — captures significant scroll actions (debounced)
   * Only emits when scroll distance > 100px from last recorded scroll
   * ══════════════════════════════════════════════════ */
  var scrollTimer = null;
  var lastScrollY = 0;
  var lastScrollEl = null;
  window.addEventListener('scroll', function(e) {
    var el = e.target === document ? document.documentElement : e.target;
    var curScrollY = el.scrollTop || window.scrollY || 0;
    if (scrollTimer) clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function() {
      var delta = curScrollY - lastScrollY;
      if (Math.abs(delta) < 100) return; // ignore tiny scrolls
      var selector = '';
      if (el !== document.documentElement) {
        selector = buildSelector(el);
      }
      var dirLabel = delta > 0 ? 'down' : 'up';
      var desc = 'Scroll ' + dirLabel + ' by ' + Math.abs(delta) + 'px' + (selector ? ' in "' + selector + '"' : '');
      lastScrollY = curScrollY;
      sendStep({ type: 'SCROLL', selector: selector, value: String(delta), description: desc, tagName: '', timestamp: Date.now() });
    }, 500);
  }, true);

  /* ══════════════════════════════════════════════════
   * DRAG RECORDING — captures drag-and-drop interactions
   * Records source element on dragstart, emits DRAG step on drop/dragend
   * ══════════════════════════════════════════════════ */
  var dragSource = null;
  var dragSourceSel = '';

  document.addEventListener('dragstart', function(e) {
    var el = (e.composedPath && e.composedPath().length > 0) ? e.composedPath()[0] : e.target;
    if (!el || !el.tagName) return;
    dragSource = el;
    dragSourceSel = buildSelector(el);
  }, true);

  document.addEventListener('drop', function(e) {
    var target = (e.composedPath && e.composedPath().length > 0) ? e.composedPath()[0] : e.target;
    if (!target || !dragSource || !dragSourceSel) return;
    var targetSel = buildSelector(target);
    // Skip if source and target are the same element
    if (!targetSel || targetSel === dragSourceSel) {
      dragSource = null; dragSourceSel = '';
      return;
    }
    var srcText = (dragSource.textContent || dragSource.getAttribute('aria-label') || dragSource.getAttribute('title') || '').trim().substring(0, 40);
    var desc = 'Drag "' + srcText + '" onto ' + targetSel.substring(0, 50);
    sendStep({ type: 'DRAG', selector: dragSourceSel, value: targetSel, description: desc, tagName: dragSource.tagName.toLowerCase(), timestamp: Date.now() });
    dragSource = null; dragSourceSel = '';
  }, true);

  document.addEventListener('dragend', function() {
    // Clear source if drop did not fire (e.g., dropped outside a droppable)
    dragSource = null; dragSourceSel = '';
  }, true);

  /* ══════════════════════════════════════════════════
   * SPA ROUTE DETECTION — catches pushState / replaceState navigation
   * Only fires AFTER user has interacted (click/input) to avoid recording
   * automatic SPA initialization redirects (auth guards, etc.)
   * ══════════════════════════════════════════════════ */
  var lastSpaUrl = location.href;
  var spaTimer = null;
  var userHasInteracted = false;
  // Mark interaction on first click or input
  document.addEventListener('click', function() { userHasInteracted = true; }, { capture: true, once: true, passive: true });
  document.addEventListener('input', function() { userHasInteracted = true; }, { capture: true, once: true, passive: true });

  function checkSpaNavigation() {
    var currentUrl = location.href;
    // Skip if URL contains proxy path — this is the proxy page URL, not a real navigation
    if (currentUrl.indexOf('/api/recorder/proxy') !== -1) {
      lastSpaUrl = currentUrl;
      return;
    }
    if (currentUrl !== lastSpaUrl) {
      var oldUrl = lastSpaUrl;
      lastSpaUrl = currentUrl;
      // Only emit if user has actually interacted AND pathname actually changed (not just hash)
      if (!userHasInteracted) return;
      try {
        var o = new URL(oldUrl);
        var n = new URL(currentUrl);
        if (o.pathname !== n.pathname || o.search !== n.search) {
          sendStep({
            type: 'NAVIGATE',
            selector: '',
            value: currentUrl,
            description: 'Navigate to ' + currentUrl,
            tagName: '',
            timestamp: Date.now()
          });
        }
      } catch(_) {
        sendStep({ type: 'NAVIGATE', selector: '', value: currentUrl, description: 'Navigate to ' + currentUrl, tagName: '', timestamp: Date.now() });
      }
    }
  }

  // Monkey-patch pushState and replaceState
  var origPush = history.pushState;
  var origReplace = history.replaceState;
  history.pushState = function() {
    origPush.apply(this, arguments);
    setTimeout(checkSpaNavigation, 50);
  };
  history.replaceState = function() {
    origReplace.apply(this, arguments);
    setTimeout(checkSpaNavigation, 50);
  };
  window.addEventListener('popstate', function() { setTimeout(checkSpaNavigation, 50); });

  /* ══════════════════════════════════════════════════
   * SHADOW DOM DEEP LISTENER — attach listeners inside shadow roots
   * Uses MutationObserver to detect shadow roots appearing dynamically
   * ══════════════════════════════════════════════════ */
  function attachShadowListeners(shadowRoot) {
    if (shadowRoot.__recListening) return;
    shadowRoot.__recListening = true;
    shadowRoot.addEventListener('click', function(e) { document.dispatchEvent(new e.constructor(e.type, e)); }, true);
    shadowRoot.addEventListener('input', function(e) { document.dispatchEvent(new e.constructor(e.type, e)); }, true);
    shadowRoot.addEventListener('change', function(e) { document.dispatchEvent(new e.constructor(e.type, e)); }, true);
    shadowRoot.addEventListener('focusout', function(e) { document.dispatchEvent(new e.constructor(e.type, e)); }, true);
  }

  function scanForShadowRoots(root) {
    if (!root || !root.querySelectorAll) return;
    var all = root.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      if (all[i].shadowRoot) {
        attachShadowListeners(all[i].shadowRoot);
        scanForShadowRoots(all[i].shadowRoot);
      }
    }
  }

  // Initial scan
  scanForShadowRoots(document);

  // Watch for new shadow roots via MutationObserver
  var observer = new MutationObserver(function(mutations) {
    for (var m = 0; m < mutations.length; m++) {
      for (var n = 0; n < mutations[m].addedNodes.length; n++) {
        var node = mutations[m].addedNodes[n];
        if (node.nodeType === 1) {
          if (node.shadowRoot) attachShadowListeners(node.shadowRoot);
          scanForShadowRoots(node);
        }
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  /* ══════════════════════════════════════════════════
   * HOVER HIGHLIGHT — deferred until DOM body exists
   * ══════════════════════════════════════════════════ */
  function initOverlay() {
    if (!document.body) return;
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;border:2px solid #4F46E5;border-radius:3px;background:rgba(79,70,229,0.08);transition:all 0.05s;display:none;';
    document.body.appendChild(ov);
    var tt = document.createElement('div');
    tt.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;background:#4F46E5;color:#fff;font:11px/1.4 monospace;padding:2px 6px;border-radius:3px;display:none;white-space:nowrap;max-width:400px;overflow:hidden;text-overflow:ellipsis;';
    document.body.appendChild(tt);
    document.addEventListener('mousemove', function(e) {
      var el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || el === ov || el === tt) { ov.style.display='none'; tt.style.display='none'; return; }
      var rect = el.getBoundingClientRect();
      ov.style.left = rect.left+'px'; ov.style.top = rect.top+'px';
      ov.style.width = rect.width+'px'; ov.style.height = rect.height+'px';
      ov.style.display = 'block';
      tt.textContent = buildSelector(el);
      tt.style.left = rect.left+'px'; tt.style.top = Math.max(0,rect.top-22)+'px';
      tt.style.display = 'block';
    }, true);
  }

  if (document.body) { initOverlay(); }
  else if (document.addEventListener) { document.addEventListener('DOMContentLoaded', initOverlay); }

  window.__recSendStep = sendStep;
  console.log('[testingndrih] Recorder injected OK');
})();
`
}

export const recorderService = {
  /**
   * Start recording with Playwright browser
   * Opens headless browser, navigates to target URL, injects recorder script
   */
  async startRecording(userId, scenarioId, startUrl) {
    const key = sessionKey(userId, scenarioId)

    // Clean up stale session
    if (sessions.has(key)) {
      const existing = sessions.get(key)
      if (existing.status === 'recording') {
        throw new Error('Recording sudah berjalan untuk skenario ini')
      }
      // Close browser if it exists
      if (existing.browser) {
        await existing.browser.close().catch(() => {})
      }
      sessions.delete(key)
    }

    // Validate scenario belongs to user
    const scenario = await prisma.scenario.findFirst({
      where: { id: scenarioId, userId }
    })
    if (!scenario) throw new Error('Scenario tidak ditemukan')

    const url = startUrl || scenario.url || ''
    if (!url) throw new Error('URL target diperlukan untuk recording')

    try {
      // ═══ Launch Playwright Browser ═══
      console.log(`[RECORDER] 🚀 Launching Playwright browser for ${url}`)
      
      // Use environment-aware browser launcher
      // For recorder, try headed mode but fallback to headless if display not available
      let browser
      try {
        browser = await chromium.launch({
          headless: false,
          args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage',
            '--no-sandbox'
          ]
        })
      } catch (headedError) {
        console.log(`[RECORDER] ⚠️ Headed mode failed: ${headedError.message}`)
        console.log(`[RECORDER] 💡 Fallback: Using headless mode (recommended for server)`)
        
        // Fallback to headless mode if display server not available
        browser = await chromium.launch({
          headless: true,
          args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage',
            '--no-sandbox'
          ]
        })
        console.log(`[RECORDER] ✅ Browser launched in headless mode`)
      }
      
      // ═══ Create Context & Page ═══
      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        recordVideo: undefined // Optional: can add video recording here later
      })
      
      const page = await context.newPage()
      
      // ═══ Expose step callback — steps sent from page JS → Node.js directly ═══
      // This bypasses HTTP/auth entirely, no need for authToken in the Playwright browser
      await page.exposeFunction('__playwrightAddStep', (step) => {
        const sess = sessions.get(key)
        if (!sess || sess.status !== 'recording') return
        sess.steps.push({ ...step, stepNumber: sess.steps.length + 1 })
        console.log(`[RECORDER] ✓ Step ${sess.steps.length}: ${step.type} "${(step.description || '').substring(0, 60)}"`)
      })

      // ═══ Inject Recorder Script ═══
      // This adds the recorder functionality to capture interactions
      await page.addInitScript(() => {
        // Recorder state
        window.__recorderSteps = []
        window.__recorderConnected = false
        
        // Send step to parent (backend will receive via postMessage or CDP)
        window.__sendRecorderStep = function(step) {
          window.__recorderSteps.push({
            ...step,
            timestamp: Date.now()
          })
          console.log('[REC] Step recorded:', step.type, step.description)
        }

        // Expose recorder API
        window.__recorderAPI = {
          getSteps: () => window.__recorderSteps,
          clearSteps: () => { window.__recorderSteps = [] }
        }
      })

      // ═══ Attach Recorder Script ═══
      const recorderScript = getRecorderScript(scenarioId)
      await page.addInitScript(recorderScript)

      // ═══ Handle page events ═══
      page.on('console', msg => {
        if (msg.text().includes('[REC]')) {
          console.log(`[PAGE-CONSOLE] ${msg.text()}`)
        }
      })

      page.on('error', err => {
        console.error(`[PAGE-ERROR] ${err.message}`)
      })

      // ═══ Navigate to target URL ═══
      console.log(`[RECORDER] 🌐 Navigating to ${url}`)
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {
          // Timeout OK, page might still be loading interactively
          console.log(`[RECORDER] Navigation timeout (continuing anyway)`)
        })
      } catch (err) {
        console.warn(`[RECORDER] Navigation error: ${err.message}`)
      }

      // ═══ Store session with browser instance ═══
      const session = {
        steps: [],
        status: 'recording',
        startedAt: new Date(),
        scenarioId,
        userId,
        startUrl: url,
        browser,       // ⭐ Keep browser instance
        context,
        page,          // ⭐ Keep page instance
        recordStartTime: Date.now()
      }

      sessions.set(key, session)

      // ═══ Add initial NAVIGATE step ═══
      session.steps.push({
        type: 'NAVIGATE',
        selector: '',
        value: url,
        description: `Navigate to ${url}`,
        tagName: '',
        timestamp: Date.now(),
        stepNumber: 1
      })

      console.log(`[RECORDER] ✅ Recording started for ${key}`)

      return {
        status: 'recording',
        startUrl: url,
        scenarioId,
        message: 'Recording started dengan Playwright browser 🎥',
        browserPid: browser.process?.()?.pid || 'unknown'
      }
    } catch (err) {
      console.error(`[RECORDER] startRecording error: ${err.message}`)
      throw new Error(`Failed to start recording: ${err.message}`)
    }
  },

  /**
   * Add a step to the recording session
   * Called via /api/recorder/step/:scenarioId when frontend captures interactions
   * (Still supports for backward compatibility with proxy method)
   */
  addStep(userId, scenarioId, step) {
    const key = sessionKey(userId, scenarioId)
    const session = sessions.get(key)
    if (!session) {
      console.warn(`[RECORDER] No session found for key ${key}. Active sessions: [${[...sessions.keys()].join(', ')}]`)
      return false
    }
    if (session.status !== 'recording') {
      console.warn(`[RECORDER] Session ${key} has status=${session.status}, cannot add step`)
      return false
    }
    session.steps.push({ ...step, stepNumber: session.steps.length + 1 })
    console.log(`[RECORDER] Step added to ${key}: ${step.type} (total: ${session.steps.length})`)
    return true
  },

  /**
   * Get current recording status and steps
   */
  getStatus(userId, scenarioId) {
    const key = sessionKey(userId, scenarioId)
    const session = sessions.get(key)

    if (!session) {
      return { status: 'idle', steps: [], message: 'No active recording' }
    }

    return {
      status: session.status,
      steps: session.steps,
      startedAt: session.startedAt,
      startUrl: session.startUrl,
      stepCount: session.steps.length
    }
  },

  /**
   * Stop recording: close Playwright browser and return recorded steps
   */
  async stopRecording(userId, scenarioId) {
    const key = sessionKey(userId, scenarioId)
    const session = sessions.get(key)

    if (!session) {
      throw new Error('Tidak ada recording aktif')
    }

    try {
      // ═══ Close page, context & browser ═══
      // Steps are already in session.steps via __playwrightAddStep exposeFunction
      if (session.page && !session.page.isClosed()) {
        await session.page.close().catch(() => {})
      }

      // ═══ Close context & browser ═══
      if (session.context) {
        await session.context.close().catch(() => {})
      }

      if (session.browser) {
        await session.browser.close().catch(() => {})
        console.log(`[RECORDER] Browser closed for ${key}`)
      }
    } catch (err) {
      console.error(`[RECORDER] Error closing browser: ${err.message}`)
    }

    session.status = 'stopped'
    const steps = [...session.steps]
    sessions.delete(key)

    const duration = session.recordStartTime ? Math.round((Date.now() - session.recordStartTime) / 1000) : 0

    return {
      status: 'stopped',
      steps,
      stepCount: steps.length,
      duration: `${duration}s`,
      message: `Recording selesai — ${steps.length} steps tercatat dalam ${duration}s`
    }
  },

  /**
   * Save recorded steps to the scenario's test steps in DB
   */
  async saveRecordedSteps(userId, scenarioId, recordedSteps) {
    const scenario = await prisma.scenario.findFirst({
      where: { id: scenarioId, userId }
    })
    if (!scenario) throw new Error('Scenario tidak ditemukan')

    // Use DB transaction to safely get MAX(stepNumber) and create steps atomically
    const created = await prisma.$transaction(async (tx) => {
      const lastStep = await tx.testStep.findFirst({
        where: { scenarioId },
        orderBy: { stepNumber: 'desc' },
        select: { stepNumber: true }
      })
      let nextStepNumber = (lastStep?.stepNumber || 0) + 1

      const results = []
      for (const step of recordedSteps) {
        const created = await tx.testStep.create({
          data: {
            scenarioId,
            stepNumber: nextStepNumber++,
            type: step.type,
            description: step.description || `${step.type} step`,
            selector: step.selector || null,
            value: step.value || null,
            metadata: null
          }
        })
        results.push(created)
      }
      return results
    })

    return {
      stepsCreated: created.length,
      message: `${created.length} recorded steps berhasil disimpan`
    }
  }
}
