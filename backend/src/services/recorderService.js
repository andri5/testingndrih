import crypto from 'crypto'
import { prisma } from '../lib/prisma.js'
import { chromium } from 'playwright'
import { analyzeTargetReachability, summarizeTargetReachability } from '../utils/networkReachability.js'

/**
 * Recording engine
 *
 * Default mode: **client-direct** — open the real target site in the user's browser
 * and inject the recorder (best visual/selector fidelity for playback).
 *
 * Optional: **proxy** — rewrite page through `/api/recorder/proxy` (SPA/image quirks).
 * Optional: **playwright** — server-side headed Chromium (local desktop only).
 *
 * Session store - keyed by `userId:scenarioId`
 */
const sessions = new Map()

const PLAYWRIGHT_BROWSER_ARGS = [
  '--disable-blink-features=AutomationControlled',
  '--disable-dev-shm-usage',
  '--no-sandbox'
]

/**
 * Resolve recording mode.
 * Prefer client-direct (real origin) unless RECORDING_MODE / request says otherwise.
 */
export function resolveRecordingMode(requestedMode) {
  const envMode = String(process.env.RECORDING_MODE || '').toLowerCase()
  const mode = String(requestedMode || envMode || '').toLowerCase()
  if (mode === 'playwright') return 'playwright'
  if (mode === 'proxy') return 'proxy'
  if (mode === 'client-direct' || mode === 'client' || mode === 'direct') return 'client-direct'

  // Default: record on the real site so images/layout/selectors match playback
  return 'client-direct'
}

function sessionKey(userId, scenarioId) {
  return `${userId}:${scenarioId}`
}

export function buildProxyRecordingUrl(scenarioId, targetUrl) {
  return `/api/recorder/proxy?url=${encodeURIComponent(targetUrl)}&sessionId=${encodeURIComponent(scenarioId)}`
}

export function buildClientGateUrl(scenarioId, targetUrl, recordToken) {
  const params = new URLSearchParams({
    url: targetUrl,
    sessionId: scenarioId,
    rt: recordToken,
  })
  return `/api/recorder/client-gate?${params.toString()}`
}

function createRecordToken() {
  return crypto.randomBytes(24).toString('hex')
}

function appendRecordingStep(session, step) {
  if (isNoiseRecordingStep(step)) {
    console.log(`[RECORDER] Skipping noise step: ${step.type} ${step.selector || step.value || ''}`)
    return
  }
  session.steps.push({ ...step, stepNumber: session.steps.length + 1 })
}

/** Browser extensions / proxy artifacts that must not become test steps */
function isNoiseRecordingStep(step) {
  if (!step || typeof step !== 'object') return true
  const sel = String(step.selector || '')
  const val = String(step.value || '')
  const desc = String(step.description || '')
  if (/Language Translate Widget|goog-te|google[_ -]?translate|skiptranslate/i.test(sel + desc)) return true
  if (step.type === 'NAVIGATE' && /\/api\/recorder\//i.test(val)) return true
  if (step.type === 'FILL' && !val.trim() && /translate|Select ""/i.test(sel + desc)) return true
  return false
}


/**
 * JavaScript injected into the target page to capture user interactions.
 * Communication: PRIMARY postMessage (reliable), FALLBACK console.log (CSP-proof).
 * QUEUE: Retry failed steps with exponential backoff.
 *
 * Supports: Shadow DOM, iframes, contenteditable, SPA navigation,
 *           dynamic class filtering, selector uniqueness validation.
 */
/**
 * @param {string|null} sessionId
 * @param {{ recordToken?: string|null }} [options]
 */
export function getRecorderScript(sessionId = null, options = {}) {
  const recordToken = options.recordToken || null
  const sendStepFn = sessionId !== null
    ? `  var __SESSION_ID = ${JSON.stringify(String(sessionId))};
  var __RECORD_TOKEN = window.__recRecordToken || ${JSON.stringify(recordToken)};
  var __nativeFetch = window.__nativeFetch || window.fetch.bind(window);
  var __recOrigin = window.__recOrigin || window.location.origin;
  var __stepCount = 0;
  var __failedQueue = [];
  var __retryCount = {};
  var __maxRetries = 3;
  var __retryDelays = [500, 2000, 5000]; // ms between retries
  var __connectionOk = true;
  var __pendingAcks = {};
  var __acceptedKeys = {};
  var __ackTimeoutMs = 2500;
  var __bridgeReady = false;
  var __flushTimer = null;
  var __bridgeRetryScheduled = false;
  var __directOk = null; // null=probing, true=CSP allows fetch, false=must use bridge
  
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

  function __authHeaders() {
    if (__RECORD_TOKEN) {
      return {
        'Content-Type': 'application/json',
        'X-Record-Token': __RECORD_TOKEN
      };
    }
    var token = window.__recAuthToken || localStorage.getItem('authToken');
    if (!token) return null;
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    };
  }

  function __stepEndpoint() {
    if (__RECORD_TOKEN) return __recOrigin + '/api/recorder/client-step/' + __SESSION_ID;
    return __recOrigin + '/api/recorder/step/' + __SESSION_ID;
  }

  function __stepKey(step) {
    return String(step.selector || '') + '_' + String(step.timestamp || Date.now());
  }
  
  function __getBridgeWindow() {
    // Prefer live opener/popup — unfinished iframe must not steal messages
    try {
      if (window.opener && !window.opener.closed) return window.opener;
    } catch (e) {}
    try {
      var ifr = document.getElementById('__rec_bridge_iframe');
      if (window.__recBridgeWin && !window.__recBridgeWin.closed) {
        if (!ifr || window.__recBridgeWin !== ifr.contentWindow) return window.__recBridgeWin;
      }
    } catch (e2) {}
    try {
      var readyIfr = document.getElementById('__rec_bridge_iframe');
      if (readyIfr && readyIfr.dataset && readyIfr.dataset.ready === '1' && readyIfr.contentWindow) {
        return readyIfr.contentWindow;
      }
    } catch (e3) {}
    return null;
  }

  function __broadcastStep(step) {
    var msg = {
      type: '__REC_STEP__',
      sessionId: __SESSION_ID,
      data: step,
      recordToken: __RECORD_TOKEN || null,
      stepKey: __stepKey(step),
      timestamp: Date.now()
    };
    var bridge = __getBridgeWindow();
    if (!bridge) return false;
    try {
      bridge.postMessage(msg, '*');
      return true;
    } catch (e) {
      return false;
    }
  }

  function __queueStep(step) {
    var qid = __stepKey(step);
    step.id = qid;
    if (!__failedQueue.find(function(s) { return s.id === qid; })) {
      __failedQueue.push(step);
      __retryCount[qid] = 0;
    }
  }

  function __markStepAccepted(stepKey) {
    if (!stepKey) return;
    if (__pendingAcks[stepKey]) delete __pendingAcks[stepKey];
    var idx = __failedQueue.findIndex(function(s) { return s.id === stepKey || __stepKey(s) === stepKey; });
    if (idx >= 0) __failedQueue.splice(idx, 1);
    __bridgeReady = true;
    __connectionOk = true;
    if (!__acceptedKeys[stepKey]) {
      __acceptedKeys[stepKey] = true;
      __updateCounter();
    }
    __showRecInfo(__directOk ? 'Connected (direct)' : 'Connected (bridge)');
  }

  function __awaitAck(step) {
    var key = __stepKey(step);
    if (__acceptedKeys[key]) return;
    __pendingAcks[key] = Date.now();
    setTimeout(function() {
      if (!__pendingAcks[key]) return;
      delete __pendingAcks[key];
      if (__acceptedKeys[key]) return;
      __queueStep(step);
      __showRecErr('Bridge putus — klik Hubungkan bridge');
      __processFailedQueue();
    }, __ackTimeoutMs);
  }

  function __sendClientDirect(step) {
    var key = __stepKey(step);
    step.id = key;
    var headers = __authHeaders();
    if (!headers) return;
    __nativeFetch(__stepEndpoint(), {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(step),
      signal: AbortSignal.timeout(10000)
    }).then(function(r) {
      return r.json().then(function(b) {
        return { httpOk: r.ok, body: b || {} };
      }).catch(function() {
        return { httpOk: false, body: {} };
      });
    }).then(function(result) {
      var body = result.body || {};
      if (result.httpOk && body.ok === true && body.stored === true) {
        __markStepAccepted(key);
        return;
      }
      if (result.httpOk && body.ok === true && body.ignored) {
        return;
      }
      __directOk = false;
      __queueStep(step);
      if (__broadcastStep(step)) __awaitAck(step);
      else __showRecErr('Bridge putus — klik Hubungkan bridge');
    }).catch(function() {
      __directOk = false;
      __queueStep(step);
      if (__broadcastStep(step)) __awaitAck(step);
      else __showRecErr('Bridge putus — klik Hubungkan bridge');
    });
  }

  // Probe whether target CSP allows posting steps directly (common on internal HTTP apps).
  // Deferred so console paste / addScriptTag is not aborted by a sync CSP violation.
  if (__RECORD_TOKEN) {
    setTimeout(function() {
      try {
        __nativeFetch(__stepEndpoint(), {
          method: 'OPTIONS',
          headers: { 'X-Record-Token': __RECORD_TOKEN },
          signal: AbortSignal.timeout(3500)
        }).then(function(r) {
          __directOk = !!(r && (r.ok || r.status === 204 || r.status === 200));
          if (__directOk) {
            __connectionOk = true;
            __showRecInfo('Connected (direct)');
            if (window.__recFlushBridgeQueue) window.__recFlushBridgeQueue();
          }
        }).catch(function() {
          __directOk = false;
        });
      } catch (e) {
        __directOk = false;
      }
    }, 0);
  }

  window.__recFlushBridgeQueue = function() {
    if (!__RECORD_TOKEN) return;
    __bridgeReady = true;
    var pending = __failedQueue.slice();
    __failedQueue = [];
    pending.forEach(function(step) {
      if (__directOk === true) {
        __sendClientDirect(step);
        return;
      }
      if (!__broadcastStep(step)) {
        __queueStep(step);
        return;
      }
      __awaitAck(step);
    });
  };

  window.addEventListener('message', function(ev) {
    var d = ev.data;
    if (!d) return;
    if (d.type === '__REC_BRIDGE_READY__' && String(d.sessionId || __SESSION_ID) === String(__SESSION_ID)) {
      __bridgeReady = true;
      var el = document.getElementById('__rec_status');
      if (el && !__directOk) {
        el.textContent = 'Bridge siap — menunggu step';
        el.style.background = '#d97706';
      }
      if (__flushTimer) clearTimeout(__flushTimer);
      __flushTimer = setTimeout(function() {
        if (window.__recFlushBridgeQueue) window.__recFlushBridgeQueue();
      }, 50);
      return;
    }
    if (d.type === '__REC_STEP_ACK__' && String(d.sessionId) === String(__SESSION_ID)) {
      if (d.stored === false) return;
      __markStepAccepted(String(d.stepKey || ''));
    }
  });

  function __processFailedQueue() {
    if (__failedQueue.length === 0) return;
    if (__RECORD_TOKEN) {
      // Never drop client-direct steps — keep retrying until bridge ACKs
      if (__bridgeRetryScheduled) return;
      __bridgeRetryScheduled = true;
      setTimeout(function() {
        __bridgeRetryScheduled = false;
        var step = __failedQueue[0];
        if (!step) return;
        var key = __stepKey(step);
        if (__pendingAcks[key] || __acceptedKeys[key]) {
          if (__acceptedKeys[key]) {
            var di = __failedQueue.findIndex(function(s) { return s.id === key || __stepKey(s) === key; });
            if (di >= 0) __failedQueue.splice(di, 1);
          }
          __processFailedQueue();
          return;
        }
        if (__directOk === true) {
          __failedQueue.shift();
          __sendClientDirect(step);
          __processFailedQueue();
          return;
        }
        if (typeof window.__recMountIframeBridge === 'function') {
          try { window.__recMountIframeBridge(); } catch (e) {}
        }
        if (__broadcastStep(step)) {
          __awaitAck(step);
        } else {
          __showRecErr('Bridge putus — klik Hubungkan bridge');
        }
        __processFailedQueue();
      }, 1200);
      return;
    }
    var step2 = __failedQueue[0];
    var attempts = __retryCount[step2.id] || 0;
    if (attempts >= __maxRetries) {
      __failedQueue.shift();
      __showRecErr('Step dropped after ' + __maxRetries + ' retries');
      return;
    }
    var delay = __retryDelays[Math.min(attempts, __retryDelays.length - 1)];
    setTimeout(function() {
      __sendStepDirect(step2, true, false);
    }, delay);
  }

  function __sendStepDirect(step, isRetry, silent) {
    // Proxy/JWT path only — client-direct uses __sendClientDirect when allowed
    if (__RECORD_TOKEN) return;
    var headers = __authHeaders();
    if (!headers) {
      if (!silent) __showRecErr('authToken tidak ditemukan');
      return;
    }
    var stepId = step.selector + '_' + step.timestamp;

    __nativeFetch(__stepEndpoint(), {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(step),
      signal: AbortSignal.timeout(10000)
    }).then(function(r) {
      if (r.ok) {
        if (!silent) {
          __updateCounter();
          __connectionOk = true;
          __showRecInfo('Connected');
        }
        if (isRetry) {
          var idx = __failedQueue.findIndex(function(s) { return (s.selector + '_' + s.timestamp) === stepId; });
          if (idx >= 0) __failedQueue.splice(idx, 1);
        }
        __processFailedQueue();
      } else if (r.status === 409) {
        if (!silent) __showRecErr('Recording session ended');
      } else {
        if (!silent) __showRecErr('Step failed: HTTP ' + r.status);
        if (!isRetry) {
          __failedQueue.push(step);
          __retryCount[stepId] = 1;
        } else {
          __retryCount[stepId] = (__retryCount[stepId] || 0) + 1;
        }
        __processFailedQueue();
      }
    }).catch(function(e) {
      if (!silent) __showRecErr('Fetch error: ' + e.message);
      if (!isRetry && !silent) {
        __failedQueue.push(step);
        __retryCount[stepId] = 1;
        __processFailedQueue();
      }
    });
  }

  function sendStep(step) {
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

    // Client-direct: prefer direct POST when CSP allows; else postMessage bridge (iframe/opener)
    if (__RECORD_TOKEN) {
      var key = __stepKey(step);
      step.id = key;
      if (__directOk === true) {
        __sendClientDirect(step);
        return;
      }
      if (typeof window.__recMountIframeBridge === 'function') {
        try { window.__recMountIframeBridge(); } catch (e) {}
      }
      if (!__broadcastStep(step)) {
        __showRecErr('Bridge putus — klik Hubungkan bridge');
        __queueStep(step);
        return;
      }
      __showRecInfo('Mengirim ke bridge…');
      __awaitAck(step);
      return;
    }

    var headers = __authHeaders();
    if (!headers) { __showRecErr('authToken tidak ditemukan'); return; }

    try {
      window.parent.postMessage({
        type: '__REC_STEP__',
        sessionId: __SESSION_ID,
        data: step,
        token: headers.Authorization ? headers.Authorization.replace(/^Bearer\\s+/i, '') : null,
        recordToken: null,
        stepKey: __stepKey(step),
        timestamp: Date.now()
      }, '*');
    } catch(e) {
      console.error('[REC] postMessage failed:', e);
    }

    __sendStepDirect(step, false, false);
  }`
    : `  function sendStep(step) {
    try { console.log('__REC__' + JSON.stringify(step)); } catch(e) {}
  }`
  return `
(function() {
  if (window.__recorderInjected) return;
  window.__recorderInjected = true;

` + sendStepFn + `

  /* ── Noise filter: Google Translate / extensions / recorder chrome ── */
  function isNoiseElement(el) {
    if (!el) return true;
    try {
      if (el.id === '__rec_toolbar' || (el.closest && el.closest('#__rec_toolbar'))) return true;
      var aria = (el.getAttribute && el.getAttribute('aria-label')) || '';
      var id = el.id || '';
      var cls = (typeof el.className === 'string' ? el.className : '') || '';
      if (/translate|Language Translate Widget/i.test(aria + ' ' + id + ' ' + cls)) return true;
      if (el.closest && el.closest('.goog-te-banner-frame, .goog-te-menu-frame, .goog-te-gadget, .goog-te-combo, #google_translate_element, .skiptranslate, [class*="goog-te"], [aria-label*="Translate"]')) return true;
      if (el.tagName === 'SELECT' && /lang|translat/i.test(aria + id + cls) && !(el.name || el.form)) return true;
    } catch (_) {}
    return false;
  }

  function shouldSkipNoiseStep(step) {
    if (!step) return true;
    var sel = step.selector || '';
    var val = step.value || '';
    var desc = step.description || '';
    if (/Language Translate Widget|goog-te|google[_ -]?translate|skiptranslate/i.test(sel + ' ' + desc)) return true;
    if (step.type === 'NAVIGATE' && /\\/api\\/recorder\\//i.test(val)) return true;
    if (step.type === 'FILL' && !String(val).trim() && /translate|Select ""/i.test(sel + ' ' + desc)) return true;
    return false;
  }

  var __rawSendStep = sendStep;
  sendStep = function(step) {
    if (shouldSkipNoiseStep(step)) {
      console.log('[REC] noise step skipped:', step && step.type, step && step.selector);
      return;
    }
    return __rawSendStep(step);
  };

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
    if (!el || !el.tagName || isNoiseElement(el)) return;
    var selector = buildSelector(el);
    var tag = el.tagName.toLowerCase();
    var value, desc;

    if (el.type === 'checkbox' || el.type === 'radio') {
      value = el.checked ? 'true' : 'false';
      var lbl = (el.labels && el.labels[0]) ? el.labels[0].textContent.trim() : (el.name || el.placeholder || el.type);
      desc = (el.checked ? 'Check' : 'Uncheck') + ' "' + lbl.substring(0, 40) + '"';
    } else if (tag === 'select') {
      value = el.value;
      if (!value) return; // ignore empty extension selects (e.g. Google Translate)
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

    if (isNoiseElement(el)) return;

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
    if (!el || isNoiseElement(el)) return;

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
    if (!el || isNoiseElement(el)) return;
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
   * Probe URL target kind (public vs internal) without starting a session.
   */
  async probeTarget(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') {
      throw new Error('URL target diperlukan')
    }
    let parsed
    try {
      parsed = new URL(rawUrl)
    } catch {
      throw new Error('URL target tidak valid')
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Hanya URL http/https yang didukung')
    }
    const reach = await analyzeTargetReachability(parsed.href)
    return summarizeTargetReachability(reach)
  },

  /**
   * Start recording session.
   * @param {string} modeHint - 'client-direct' | 'proxy' | 'playwright' | undefined (auto)
   */
  async startRecording(userId, scenarioId, startUrl, modeHint) {
    const key = sessionKey(userId, scenarioId)

    // Clean up stale session
    if (sessions.has(key)) {
      const existing = sessions.get(key)
      if (existing.status === 'recording') {
        throw new Error('Recording sudah berjalan untuk skenario ini')
      }
      if (existing.browser) {
        await existing.browser.close().catch(() => {})
      }
      sessions.delete(key)
    }

    const scenario = await prisma.scenario.findFirst({
      where: { id: scenarioId, userId }
    })
    if (!scenario) throw new Error('Scenario tidak ditemukan')

    const url = startUrl || scenario.url || ''
    if (!url) throw new Error('URL target diperlukan untuk recording')

    const mode = resolveRecordingMode(modeHint)

    if (mode !== 'playwright') {
      const reach = await analyzeTargetReachability(url)
      const targetMeta = summarizeTargetReachability(reach)
      const recordToken = createRecordToken()
      // Client-direct unless user asked for proxy AND target is public
      const forcedFromProxy = mode === 'proxy' && Boolean(reach.privateNetwork)
      const preferClientDirect = mode !== 'proxy' || forcedFromProxy

      const session = {
        steps: [],
        status: 'recording',
        startedAt: new Date(),
        scenarioId,
        userId,
        startUrl: url,
        method: preferClientDirect ? 'client-direct' : 'proxy',
        recordToken,
        recordStartTime: Date.now(),
      }
      sessions.set(key, session)

      if (preferClientDirect) {
        const clientGateUrl = buildClientGateUrl(scenarioId, url, recordToken)
        const why = reach.privateNetwork
          ? `private/unreachable from server: ${reach.addresses?.join(',') || reach.reason}`
          : forcedFromProxy
            ? 'proxy requested but target internal — forced client-direct'
            : 'client-direct (real-origin fidelity)'
        console.log(`[RECORDER] ✅ Client-direct recording started for ${key} → ${url} (${why})`)

        let message =
          'Recording di situs asli (bukan proxy). Pasang recorder dari halaman panduan, lalu Stop di aplikasi.'
        if (reach.privateNetwork) {
          message =
            'URL target hanya bisa diakses dari jaringan Anda. Buka halaman di browser, lalu pasang recorder dari halaman panduan.'
        }
        if (forcedFromProxy) {
          message =
            'Proxy tidak tersedia untuk jaringan internal/VPN. Dialihkan ke rekam di situs asli — pasang recorder dari halaman panduan.'
        }

        return {
          status: 'recording',
          method: 'client-direct',
          proxyUrl: null,
          clientGateUrl,
          recordToken,
          startUrl: url,
          scenarioId,
          message,
          modeRequested: mode,
          modeForced: forcedFromProxy,
          ...targetMeta,
        }
      }

      const proxyUrl = buildProxyRecordingUrl(scenarioId, url)
      console.log(`[RECORDER] ✅ Proxy recording started for ${key} → ${url}`)

      return {
        status: 'recording',
        method: 'proxy',
        proxyUrl,
        startUrl: url,
        scenarioId,
        message: 'Recording started — interact di jendela browser yang terbuka, lalu klik Stop di aplikasi',
        modeRequested: mode,
        modeForced: false,
        ...targetMeta,
      }
    }

    try {
      console.log(`[RECORDER] 🚀 Launching Playwright browser for ${url}`)

      let browser
      try {
        browser = await chromium.launch({
          headless: false,
          args: PLAYWRIGHT_BROWSER_ARGS
        })
      } catch (headedError) {
        // Do NOT fall back to headless — user cannot interact. Prefer client-direct instead.
        console.error(`[RECORDER] ❌ Headed Playwright failed: ${headedError.message}`)
        throw new Error(
          `Tidak bisa membuka browser headed di server (${headedError.message}). ` +
          `Gunakan mode client-direct/proxy atau jalankan backend di desktop lokal.`
        )
      }

      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
      })

      const page = await context.newPage()

      const session = {
        steps: [],
        status: 'recording',
        startedAt: new Date(),
        scenarioId,
        userId,
        startUrl: url,
        method: 'playwright',
        browser,
        context,
        page,
        recordStartTime: Date.now(),
      }
      sessions.set(key, session)

      await page.exposeFunction('__playwrightAddStep', (step) => {
        const sess = sessions.get(key)
        if (!sess || sess.status !== 'recording') return
        appendRecordingStep(sess, step)
        console.log(`[RECORDER] ✓ Step ${sess.steps.length}: ${step.type} "${(step.description || '').substring(0, 60)}"`)
      })

      await page.addInitScript(() => {
        window.__recorderSteps = []
        window.__recorderConnected = false
        window.__sendRecorderStep = function (step) {
          window.__recorderSteps.push({ ...step, timestamp: Date.now() })
        }
        window.__recorderAPI = {
          getSteps: () => window.__recorderSteps,
          clearSteps: () => { window.__recorderSteps = [] }
        }
      })

      const recorderScript = getRecorderScript(scenarioId)
      await page.addInitScript(recorderScript)

      page.on('console', msg => {
        if (msg.text().includes('[REC]')) {
          console.log(`[PAGE-CONSOLE] ${msg.text()}`)
        }
      })

      page.on('error', err => {
        console.error(`[PAGE-ERROR] ${err.message}`)
      })

      console.log(`[RECORDER] 🌐 Navigating to ${url}`)
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {
          console.log(`[RECORDER] Navigation timeout (continuing anyway)`)
        })
      } catch (err) {
        console.warn(`[RECORDER] Navigation error: ${err.message}`)
      }

      appendRecordingStep(session, {
        type: 'NAVIGATE',
        selector: '',
        value: url,
        description: `Navigate to ${url}`,
        tagName: '',
        timestamp: Date.now(),
      })

      console.log(`[RECORDER] ✅ Playwright recording started for ${key}`)

      return {
        status: 'recording',
        method: 'playwright',
        proxyUrl: null,
        startUrl: url,
        scenarioId,
        message: 'Recording started dengan Playwright browser 🎥',
        browserPid: browser.process?.()?.pid || 'unknown'
      }
    } catch (err) {
      // Cleanup partial session on failure
      const partial = sessions.get(key)
      if (partial?.browser) await partial.browser.close().catch(() => {})
      sessions.delete(key)
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
    let key = sessionKey(userId, scenarioId)
    let session = sessions.get(key)
    if (!session) {
      for (const [k, s] of sessions.entries()) {
        if (
          String(s.scenarioId) === String(scenarioId) &&
          String(s.userId) === String(userId) &&
          s.status === 'recording'
        ) {
          session = s
          key = k
          break
        }
      }
    }
    if (!session) {
      console.warn(`[RECORDER] No session found for key ${key}. Active sessions: [${[...sessions.keys()].join(', ')}]`)
      return { ok: false, stored: false, ignored: false }
    }
    if (session.status !== 'recording') {
      console.warn(`[RECORDER] Session ${key} has status=${session.status}, cannot add step`)
      return { ok: false, stored: false, ignored: false }
    }
    if (isNoiseRecordingStep(step)) {
      console.log(`[RECORDER] Skipping noise step: ${step.type} ${step.selector || step.value || ''}`)
      return { ok: true, stored: false, ignored: true }
    }
    const before = session.steps.length
    appendRecordingStep(session, step)
    if (session.steps.length === before) {
      return { ok: true, stored: false, ignored: true }
    }
    console.log(`[RECORDER] Step added to ${key}: ${step.type} (total: ${session.steps.length})`)
    return { ok: true, stored: true, ignored: false }
  },

  /**
   * Find active recording session by scenarioId (proxy/client-gate have no userId in URL).
   */
  findActiveSessionByScenarioId(scenarioId) {
    for (const session of sessions.values()) {
      if (String(session.scenarioId) === String(scenarioId) && session.status === 'recording') {
        return session
      }
    }
    return null
  },

  /**
   * Add step authenticated by short-lived record token (client-direct / cross-origin).
   */
  addStepByRecordToken(scenarioId, recordToken, step) {
    const session = this.findActiveSessionByScenarioId(scenarioId)
    if (!session || !session.recordToken || session.recordToken !== recordToken) {
      return { ok: false, stored: false, ignored: false }
    }
    return this.addStep(session.userId, scenarioId, step)
  },

  /**
   * Get current recording status and steps
   */
  getStatus(userId, scenarioId) {
    const key = sessionKey(userId, scenarioId)
    let session = sessions.get(key)

    // Fallback: userId string/number mismatch between JWT and session key
    if (!session) {
      const byScenario = this.findActiveSessionByScenarioId(scenarioId)
      if (byScenario && String(byScenario.userId) === String(userId)) {
        session = byScenario
      }
    }

    if (!session) {
      return { status: 'idle', steps: [], message: 'No active recording' }
    }

    return {
      status: session.status,
      steps: session.steps,
      startedAt: session.startedAt,
      startUrl: session.startUrl,
      stepCount: session.steps.length,
      method: session.method || null,
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
        select: { stepNumber: true },
      })
      let nextStepNumber = (lastStep?.stepNumber || 0) + 1

      const results = []
      for (const step of recordedSteps) {
        const createdStep = await tx.testStep.create({
          data: {
            scenarioId,
            stepNumber: nextStepNumber++,
            type: step.type,
            description: step.description || `${step.type} step`,
            selector: step.selector || null,
            value: step.value || null,
            metadata: null,
          },
        })
        results.push(createdStep)
      }

      const stepCount = await tx.testStep.count({ where: { scenarioId } })
      await tx.scenario.update({
        where: { id: scenarioId },
        data: { steps: stepCount },
      })

      return results
    })

    return {
      stepsCreated: created.length,
      message: `${created.length} recorded steps berhasil disimpan`
    }
  }
}
