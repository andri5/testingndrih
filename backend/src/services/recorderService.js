import { chromium } from 'playwright'
import { prisma } from '../lib/prisma.js'

/**
 * Recording session store - keyed by `userId:scenarioId`
 * Each session holds the browser, page, and recorded steps
 */
const sessions = new Map()

function sessionKey(userId, scenarioId) {
  return `${userId}:${scenarioId}`
}

/**
 * JavaScript injected into the target page to capture user interactions.
 * Communication: uses console.log with __REC__ prefix (CSP-proof, works on all sites).
 *
 * Supports: Shadow DOM, iframes, contenteditable, SPA navigation,
 *           dynamic class filtering, selector uniqueness validation.
 */
export function getRecorderScript() {
  return `
(function() {
  if (window.__recorderInjected) return;
  window.__recorderInjected = true;

  function sendStep(step) {
    try { console.log('__REC__' + JSON.stringify(step)); } catch(e) {}
  }

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
    // 1. data-testid
    if (el.dataset && el.dataset.testid) return '[data-testid="' + el.dataset.testid + '"]';
    // 2. Stable ID (no digits-only, no colons/dots which are dynamic)
    if (el.id && el.id.length < 80 && !/^[0-9]|[:.]|^(ember|react|vue|ng-)/.test(el.id))
      return '#' + CSS.escape ? CSS.escape(el.id) : el.id;
    // 3. name attribute (form elements)
    if (el.name && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName))
      return el.tagName.toLowerCase() + '[name="' + el.name + '"]';
    // 4. aria-label
    if (el.getAttribute('aria-label'))
      return '[aria-label="' + el.getAttribute('aria-label') + '"]';
    // 5. placeholder
    if (el.placeholder && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA'))
      return el.tagName.toLowerCase() + '[placeholder="' + el.placeholder + '"]';
    // 6. role + text for buttons and links
    if ((el.tagName === 'BUTTON' || el.tagName === 'A' || (el.getAttribute('role') === 'button')) && el.textContent) {
      var txt = el.textContent.trim();
      if (txt.length > 0 && txt.length < 60) {
        var tag = el.tagName.toLowerCase();
        if (tag === 'button' || el.getAttribute('role') === 'button')
          return 'button:has-text("' + txt + '")';
        if (tag === 'a') return 'a:has-text("' + txt + '")';
      }
    }
    // 7. input type (but not generic 'text')
    if (el.tagName === 'INPUT' && el.type && el.type !== 'text')
      return 'input[type="' + el.type + '"]';
    // 8. Fallback to cssPath with stable classes
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
        if (cls.length) sel += '.' + cls.join('.');
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
   * DUPLICATE CHECK
   * ══════════════════════════════════════════════════ */
  var lastFillSelector = '';
  var lastFillValue = '';

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
    }, 600));
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

    sendStep({ type: 'CLICK', selector: selector, value: '', description: desc, tagName: tag, timestamp: Date.now() });
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
    pendingEls.set(el, setTimeout(function() { emitFill(el); pendingEls.delete(el); }, 400));
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

  /* ══════════════════════════════════════════════════
   * SPA ROUTE DETECTION — catches pushState / replaceState navigation
   * ══════════════════════════════════════════════════ */
  var lastSpaUrl = location.href;
  var spaTimer = null;

  function checkSpaNavigation() {
    var currentUrl = location.href;
    if (currentUrl !== lastSpaUrl) {
      var oldUrl = lastSpaUrl;
      lastSpaUrl = currentUrl;
      // Only emit if pathname actually changed (not just hash)
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

  console.log('[testingndrih] Recorder injected OK');
})();
`
}

export const recorderService = {
  /**
   * Start a recording session: Launch headed Chromium, navigate to URL,
   * inject recorder script, capture user interactions.
   */
  async startRecording(userId, scenarioId, startUrl) {
    const key = sessionKey(userId, scenarioId)

    // Check if already recording
    if (sessions.has(key)) {
      const existing = sessions.get(key)
      if (existing.browser?.isConnected()) {
        throw new Error('Recording sudah berjalan untuk skenario ini')
      }
      // Stale session, clean it up
      sessions.delete(key)
    }

    // Validate scenario belongs to user
    const scenario = await prisma.scenario.findFirst({
      where: { id: scenarioId, userId }
    })
    if (!scenario) throw new Error('Scenario tidak ditemukan')

    const url = startUrl || scenario.url || 'about:blank'

    // Launch headed browser (user can see and interact)
    const browser = await chromium.launch({
      headless: false,
      args: ['--start-maximized'],
      ...(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {})
    })

    const context = await browser.newContext({
      viewport: null, // full window
      ignoreHTTPSErrors: true
    })
    const page = await context.newPage()

    const session = {
      browser,
      context,
      page,
      steps: [],
      status: 'recording',   // recording | paused | stopped
      startedAt: new Date(),
      scenarioId,
      userId,
      startUrl: url
    }

    // Expose function so injected JS can send steps back to Node
    // Use BOTH exposeFunction AND console.log listener for maximum compatibility
    let exposeWorking = false
    try {
      await page.exposeFunction('__recordStep', (step) => {
        if (session.status !== 'recording') return
        session.steps.push({ ...step, stepNumber: session.steps.length + 1 })
      })
      exposeWorking = true
    } catch { /* some contexts don't support exposeFunction */ }

    // PRIMARY communication: listen for console.log messages from injected script
    // This works even when exposeFunction fails (CSP, cross-origin, etc.)
    // Listen on ALL frames (main + iframes)
    const handleConsoleMsg = (msg) => {
      if (session.status !== 'recording') return
      const text = msg.text()
      if (!text.startsWith('__REC__')) return
      try {
        const step = JSON.parse(text.slice(7))
        session.steps.push({ ...step, stepNumber: session.steps.length + 1 })
      } catch { /* ignore parse errors */ }
    }
    page.on('console', handleConsoleMsg)

    // Inject recorder script — use addInitScript for initial load (all frames)
    await context.addInitScript(getRecorderScript())

    // ALSO re-inject on every navigation via evaluate (redundant but reliable)
    const injectScript = async (targetPage) => {
      try {
        await targetPage.evaluate(getRecorderScript())
      } catch { /* page might not be ready */ }
      // Also inject into all current iframes
      try {
        const frames = targetPage.frames()
        for (const frame of frames) {
          if (frame === targetPage.mainFrame()) continue
          try { await frame.evaluate(getRecorderScript()) } catch { /* cross-origin iframes may block this */ }
        }
      } catch { /* frames iteration might fail */ }
    }

    page.on('load', () => {
      setTimeout(() => injectScript(page), 300)
    })
    page.on('domcontentloaded', () => {
      setTimeout(() => injectScript(page), 100)
    })

    // Listen for new iframes appearing and inject recorder into them
    page.on('frameattached', (frame) => {
      frame.waitForLoadState('domcontentloaded').then(() => {
        try { frame.evaluate(getRecorderScript()) } catch { /* may be cross-origin */ }
      }).catch(() => {})
    })

    // Track navigations as NAVIGATE steps — only real page navigations, not SPA route changes
    let lastNavUrl = url
    let lastNavTime = Date.now()
    let navDebounceTimer = null

    page.on('framenavigated', (frame) => {
      if (frame !== page.mainFrame()) return
      if (session.status !== 'recording') return
      const navUrl = frame.url()
      if (!navUrl || navUrl === 'about:blank' || navUrl.startsWith('data:')) return

      // Skip if same URL (or only hash/query changed)
      try {
        const prev = new URL(lastNavUrl)
        const curr = new URL(navUrl)
        // Same origin + pathname = SPA route or hash change, skip
        if (prev.origin === curr.origin && prev.pathname === curr.pathname) return
      } catch { /* invalid URL, let it through */ }

      // Skip if same URL as last navigate step
      const lastStep = session.steps[session.steps.length - 1]
      if (lastStep && lastStep.type === 'NAVIGATE' && lastStep.value === navUrl) return

      // Skip if a CLICK happened less than 1 second ago (the click caused this navigation)
      const now = Date.now()
      const recentClick = session.steps.filter(s => s.type === 'CLICK' && (now - s.timestamp) < 1000)
      if (recentClick.length > 0) {
        lastNavUrl = navUrl
        return
      }

      // Debounce rapid navigations (redirects chain)
      if (navDebounceTimer) clearTimeout(navDebounceTimer)
      navDebounceTimer = setTimeout(() => {
        // Re-check: get the actual current URL after debounce
        const currentUrl = frame.url()
        if (!currentUrl || currentUrl === 'about:blank') return
        const lastStepNow = session.steps[session.steps.length - 1]
        if (lastStepNow && lastStepNow.type === 'NAVIGATE' && lastStepNow.value === currentUrl) return

        session.steps.push({
          type: 'NAVIGATE',
          selector: '',
          value: currentUrl,
          description: 'Navigate to ' + currentUrl,
          tagName: '',
          timestamp: Date.now(),
          stepNumber: session.steps.length + 1
        })
        lastNavUrl = currentUrl
      }, 500)
    })

    // When browser is closed manually by user, mark session stopped
    browser.on('disconnected', () => {
      session.status = 'stopped'
    })

    sessions.set(key, session)

    // Navigate to start URL
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    } catch (err) {
      // Don't fail the whole recording if initial nav fails (e.g. firewall)
      console.error('Initial navigation warning:', err.message)
    }

    return {
      status: 'recording',
      startUrl: url,
      scenarioId,
      message: 'Browser terbuka — silakan berinteraksi dengan halaman. Steps akan tercatat otomatis.'
    }
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
   * Stop recording: close browser, return recorded steps
   */
  async stopRecording(userId, scenarioId) {
    const key = sessionKey(userId, scenarioId)
    const session = sessions.get(key)

    if (!session) {
      throw new Error('Tidak ada recording aktif')
    }

    session.status = 'stopped'

    // Take a final screenshot before closing
    let finalScreenshot = null
    try {
      if (session.browser.isConnected()) {
        finalScreenshot = await session.page.screenshot({ type: 'png' }).catch(() => null)
        await session.browser.close().catch(() => {})
      }
    } catch {
      // Browser might already be closed
    }

    const steps = [...session.steps]
    sessions.delete(key)

    return {
      status: 'stopped',
      steps,
      stepCount: steps.length,
      message: `Recording selesai — ${steps.length} steps tercatat`
    }
  },

  /**
   * Save recorded steps to the scenario's test steps in DB
   */
  async saveRecordedSteps(userId, scenarioId, recordedSteps) {
    const scenario = await prisma.scenario.findFirst({
      where: { id: scenarioId, userId },
      include: { testSteps: { orderBy: { stepNumber: 'asc' } } }
    })
    if (!scenario) throw new Error('Scenario tidak ditemukan')

    // Start numbering after existing steps
    const existingCount = scenario.testSteps.length

    const stepsToCreate = recordedSteps.map((step, idx) => ({
      scenarioId,
      stepNumber: existingCount + idx + 1,
      type: step.type,
      description: step.description || `${step.type} step`,
      selector: step.selector || null,
      value: step.value || null,
      metadata: null
    }))

    // Batch create
    const created = await prisma.$transaction(
      stepsToCreate.map(s => prisma.testStep.create({ data: s }))
    )

    return {
      stepsCreated: created.length,
      totalSteps: existingCount + created.length,
      message: `${created.length} recorded steps berhasil disimpan`
    }
  }
}
