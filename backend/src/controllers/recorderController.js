import { recorderService, getRecorderScript } from '../services/recorderService.js'
import {
  analyzeTargetReachability,
  formatFetchNetworkError,
} from '../utils/networkReachability.js'

function escHTML(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function escAttr(str) {
  return escHTML(str).replace(/'/g, '&#39;')
}

function setRecorderCors(req, res) {
  const origin = req.get('origin')
  if (origin) {
    res.set('Access-Control-Allow-Origin', origin)
    res.set('Vary', 'Origin')
  } else {
    res.set('Access-Control-Allow-Origin', '*')
  }
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Record-Token')
}

/** Prefer https behind Caddy/nginx (X-Forwarded-Proto). */
function resolveAppOrigin(req) {
  const xfProto = String(req.get('x-forwarded-proto') || '').split(',')[0].trim()
  const proto = xfProto || req.protocol || 'https'
  const host = req.get('x-forwarded-host') || req.get('host')
  return `${proto}://${host}`.replace(/\/$/, '')
}

/**
 * Full recorder bootstrap as inline JS (no external <script src>).
 * Needed when the target site CSP blocks third-party script-src.
 * @param {string} [bridgeUrl] client-gate URL — opened via user gesture if opener is missing
 */
function buildClientInjectPayload(sessionId, recordToken, appOrigin, bridgeUrl = null) {
  const bootstrap = `window.__recOrigin=${JSON.stringify(appOrigin)};window.__recRecordToken=${JSON.stringify(String(recordToken))};window.__recBridgeUrl=${JSON.stringify(bridgeUrl || '')};`
  const script = getRecorderScript(String(sessionId), { recordToken: String(recordToken) })
  const toolbar = `
(function(){
  if (document.getElementById('__rec_toolbar')) return;
  var bar=document.createElement('div');
  bar.id='__rec_toolbar';
  bar.style.cssText='position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#dc2626;color:#fff;font:13px/1 sans-serif;padding:8px 16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;box-shadow:0 2px 8px rgba(0,0,0,.3)';
  bar.innerHTML='<strong>RECORDING</strong><span id="__rec_count">0 steps</span><span id="__rec_status" style="opacity:.85">Menunggu bridge…</span><button type="button" id="__rec_bridge_btn" style="margin-left:auto;background:#fff;color:#b91c1c;border:0;border-radius:6px;padding:8px 12px;font-weight:700;cursor:pointer">Hubungkan bridge</button>';
  (document.body||document.documentElement).appendChild(bar);
  if (document.body) document.body.style.paddingTop='40px';

  function setStatus(msg, ok) {
    var el=document.getElementById('__rec_status');
    if (!el) return;
    el.textContent=msg;
    if (ok === true) el.style.background='#10b981';
    else if (ok === 'wait') el.style.background='#d97706';
    else el.style.background='#b91c1c';
  }

  // about:blank first — modern Chrome often returns null from window.open(crossOrigin)
  // when noopener is implied; keeping the WindowProxy lets postMessage work under COOP.
  window.__recConnectBridge = function() {
    var url=window.__recBridgeUrl;
    if (!url) {
      alert('Bridge URL kosong — Start Recording ulang dari aplikasi Test Sambil Ngopi.');
      return false;
    }
    var w=null;
    try { w=window.open('about:blank', 'tsn_rec_bridge'); } catch (e) {}
    if (!w) {
      try { w=window.open(url, 'tsn_rec_bridge'); } catch (e2) {}
    }
    if (!w) {
      alert('Popup diblokir.\\n\\nIzinkan popup untuk situs ini, lalu klik Hubungkan bridge lagi.');
      setStatus('Bridge putus — izinkan popup', false);
      return false;
    }
    window.__recBridgeWin=w;
    try { w.location.href=url; } catch (e3) {
      try { w.location=url; } catch (e4) {}
    }
    setStatus('Bridge dibuka — menunggu READY…', 'wait');
    return true;
  };

  var btn=document.getElementById('__rec_bridge_btn');
  if (btn) btn.addEventListener('click', function(ev){
    ev.preventDefault();
    ev.stopPropagation();
    window.__recConnectBridge();
  }, true);

  window.addEventListener('message', function(ev){
    var d=ev.data;
    if (!d) return;
    if (d.type==='__REC_BRIDGE_READY__') {
      setStatus('Bridge siap — menunggu step', 'wait');
      if (window.__recFlushBridgeQueue) window.__recFlushBridgeQueue();
      return;
    }
    if (d.type==='__REC_STEP_ACK__' && d.stored !== false) {
      setStatus('Connected (bridge)', true);
    }
  });

  // Queue initial NAVIGATE; if opener missing (COOP), user must click Hubungkan (user gesture)
  function tryInitialNavigate() {
    if (!window.__recSendStep) return;
    var hasBridge=false;
    try { hasBridge=!!(window.opener && !window.opener.closed); } catch(e) {}
    try { hasBridge=hasBridge||!!(window.__recBridgeWin && !window.__recBridgeWin.closed); } catch(e2) {}
    if (window.__recRecordToken && !hasBridge) {
      setStatus('Klik Hubungkan bridge (izinkan popup)', false);
    }
    window.__recSendStep({type:'NAVIGATE',selector:'',value:location.href,description:'Navigate to '+location.href,tagName:'',timestamp:Date.now()});
  }
  setTimeout(tryInitialNavigate, 400);
})();`
  return `${bootstrap}\n${script}\n${toolbar}`
}

function sanitizeIncomingStep(step) {
  return {
    type: step.type,
    selector: step.selector || '',
    value: step.value ? String(step.value).substring(0, 10000) : '',
    description: step.description ? String(step.description).substring(0, 500) : '',
    tagName: step.tagName ? String(step.tagName).substring(0, 50) : '',
    timestamp: Number.isInteger(step.timestamp) ? step.timestamp : Date.now(),
    contentEditable: Boolean(step.contentEditable),
  }
}

function validateIncomingStep(step, scenarioId) {
  if (!step || typeof step !== 'object') {
    return 'Invalid step format'
  }
  if (!step.type || typeof step.type !== 'string') {
    return 'Missing or invalid step.type'
  }
  if (!scenarioId) {
    return 'Missing scenarioId parameter'
  }
  const validTypes = [
    'CLICK', 'FILL', 'HOVER', 'SCROLL', 'DRAG', 'FILE_UPLOAD',
    'SUBMIT', 'PASTE', 'CHANGE', 'NAVIGATE',
  ]
  if (!validTypes.includes(step.type)) {
    return `Invalid step type: ${step.type}`
  }
  if (['CLICK', 'FILL', 'HOVER', 'DRAG', 'FILE_UPLOAD'].includes(step.type)) {
    if (!step.selector || typeof step.selector !== 'string') {
      return `step.selector required for ${step.type}`
    }
  }
  return null
}

export const recorderController = {
  async startRecording(req, res, next) {
    try {
      const userId = req.user.id
      const { scenarioId, url, mode } = req.body
      if (!scenarioId) {
        return res.status(400).json({ error: 'scenarioId diperlukan' })
      }
      const result = await recorderService.startRecording(userId, scenarioId, url, mode)

      const appOrigin = resolveAppOrigin(req).replace(/^http:\/\/testsambilngopi\.com/i, 'https://testsambilngopi.com')
      let clientGateUrl = result.clientGateUrl || null
      let proxyUrl = result.proxyUrl || null
      if (clientGateUrl && clientGateUrl.startsWith('/')) {
        clientGateUrl = `${appOrigin}${clientGateUrl}`
      }
      if (proxyUrl && proxyUrl.startsWith('/')) {
        proxyUrl = `${appOrigin}${proxyUrl}`
      }

      res.status(202).json({
        success: true,
        status: result.status,
        scenarioId: result.scenarioId,
        message: result.message,
        method: result.method || 'proxy',
        proxyUrl,
        clientGateUrl,
        recordToken: result.recordToken || null,
        browserPid: result.browserPid,
        targetKind: result.targetKind || null,
        reachability: result.reachability || null,
        modeRequested: result.modeRequested || null,
        modeForced: Boolean(result.modeForced),
      })
    } catch (err) {
      console.error(`[RECORDER] startRecording error: ${err.message}`)
      if (
        err.message.includes('sudah berjalan') ||
        err.message.includes('tidak ditemukan') ||
        err.message.includes('URL target') ||
        err.message.includes('Failed to start recording')
      ) {
        return res.status(400).json({ error: err.message, message: err.message })
      }
      next(err)
    }
  },

  /**
   * GET /api/recorder/target-info?url=
   * Classify target as public vs internal before recording starts.
   */
  async getTargetInfo(req, res, next) {
    try {
      const url = String(req.query.url || '').trim()
      if (!url) {
        return res.status(400).json({ error: 'url diperlukan' })
      }
      const info = await recorderService.probeTarget(url)
      res.json({ success: true, url, ...info })
    } catch (err) {
      if (
        err.message.includes('URL target') ||
        err.message.includes('tidak valid') ||
        err.message.includes('http/https')
      ) {
        return res.status(400).json({ error: err.message })
      }
      next(err)
    }
  },

  async stopRecording(req, res, next) {
    try {
      const userId = req.user.id
      const { scenarioId } = req.body
      if (!scenarioId) {
        return res.status(400).json({ error: 'scenarioId diperlukan' })
      }
      const result = await recorderService.stopRecording(userId, scenarioId)
      res.json({
        success: true,
        status: result.status,
        stepCount: result.stepCount,
        steps: result.steps,
        duration: result.duration,
        message: result.message
      })
    } catch (err) {
      console.error(`[RECORDER] stopRecording error: ${err.message}`)
      if (err.message.includes('Tidak ada recording')) {
        return res.status(400).json({ error: err.message })
      }
      next(err)
    }
  },

  getStatus(req, res) {
    const userId = req.user.id
    const scenarioId = req.query.scenarioId || req.params.scenarioId
    if (!scenarioId) {
      return res.status(400).json({ error: 'scenarioId diperlukan' })
    }
    const result = recorderService.getStatus(userId, scenarioId)
    res.json(result)
  },

  async saveSteps(req, res, next) {
    try {
      const userId = req.user.id
      const { scenarioId } = req.params
      const { steps } = req.body
      if (!steps || !Array.isArray(steps) || steps.length === 0) {
        return res.status(400).json({ error: 'steps array diperlukan' })
      }
      const result = await recorderService.saveRecordedSteps(userId, scenarioId, steps)
      res.json(result)
    } catch (err) {
      if (err.message.includes('tidak ditemukan')) {
        return res.status(404).json({ error: err.message })
      }
      next(err)
    }
  },

  /**
   * GET /api/recorder/proxy?url=TARGET_URL&sessionId=SCENARIO_ID
   * Proxies the target page with the recorder script injected.
   * No auth required here — the recorder script inside uses localStorage.authToken.
   */
  async proxyPage(req, res) {
    const { url, sessionId } = req.query
    if (!url || !sessionId) {
      return res.status(400).send('<p>Missing url or sessionId</p>')
    }

    let targetUrl
    try {
      targetUrl = new URL(url)
      if (!['http:', 'https:'].includes(targetUrl.protocol)) {
        return res.status(400).send('<p>Only http/https URLs allowed</p>')
      }
    } catch {
      return res.status(400).send(`<p>Invalid URL: ${escHTML(url)}</p>`)
    }

    const session = recorderService.findActiveSessionByScenarioId(String(sessionId))
    const recordToken = session?.recordToken

    const redirectToClientGate = (reason) => {
      if (recordToken) {
        const params = new URLSearchParams({
          url: String(url),
          sessionId: String(sessionId),
          rt: recordToken,
        })
        if (reason) params.set('reason', reason)
        return res.redirect(302, `/api/recorder/client-gate?${params.toString()}`)
      }
      return null
    }

    // Private / internal hosts cannot be fetched from a public VPS — use client-direct.
    const reach = await analyzeTargetReachability(url)
    if (reach.privateNetwork) {
      const redirected = redirectToClientGate(reach.message || 'private_network')
      if (redirected) return redirected
    }

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(15000)
      })

      const contentType = response.headers.get('content-type') || 'text/html'

      if (!contentType.includes('text/html')) {
        const buffer = await response.arrayBuffer()
        res.set('content-type', contentType)
        return res.send(Buffer.from(buffer))
      }

      let html = await response.text()
      const finalUrl = response.url

      // Remove CSP meta tags
      html = html.replace(/<meta[^>]+http-equiv=["']?content-security-policy["']?[^>]*>/gi, '')

      // Capture native fetch BEFORE any target page scripts can override it
      // Also patch history.pushState/replaceState so SPA navigation (React Router, Vue Router, etc.)
      // gets routed through the proxy instead of navigating to localhost
      const earlyCapture = `<script>
window.__nativeFetch=window.fetch.bind(window);
window.__recOrigin=window.location.origin;
window.__targetBase=${JSON.stringify(url)};
(function(){
  var _sid=${JSON.stringify(String(sessionId))};
  var _proxyOrigin=window.location.origin;
  var _base=window.__targetBase;
  var _interacted=false;
  var _inProxyNav=false;

  function _isFlightUrl(u){
    try{
      var s=String(u||'');
      if(/[?&]_rsc=/.test(s)) return true;
      if(/[?&]_next(?:OutputTree|Data|Scroll)=/.test(s)) return true;
      var a=new URL(s,_base);
      if(a.searchParams.has('_rsc')) return true;
      return false;
    }catch(e){ return /_rsc=/.test(String(u||'')); }
  }

  function _unwrapRecorderUrl(u){
    try{
      var a=new URL(String(u),_proxyOrigin);
      if(a.origin===_proxyOrigin && a.pathname.indexOf('/api/recorder/asset')===0){
        var inner=a.searchParams.get('url');
        if(inner) return inner;
      }
      if(a.origin===_proxyOrigin && a.pathname.indexOf('/api/recorder/proxy')===0){
        var inner2=a.searchParams.get('url');
        if(inner2) return inner2;
      }
    }catch(e){}
    return String(u);
  }

  function _normalizeDocUrl(u){
    var raw=_unwrapRecorderUrl(u);
    var a=new URL(String(raw),_base);
    a.searchParams.delete('_rsc');
    ['_nextOutputTree','_nextData','_nextScroll'].forEach(function(k){ a.searchParams.delete(k); });
    return a.href;
  }

  // ── Fetch/XHR intercept: forward same-origin requests to actual target ──
  // Asset proxy is ONLY for subresource fetch — never for document navigation.
  var _nFetch=window.__nativeFetch;
  window.fetch=function(input,init){
    try{
      var _url=typeof input==='string'?input:(input&&input.url?input.url:String(input));
      _url=_unwrapRecorderUrl(_url);
      var _u=new URL(_url,window.location.href);
      if(_u.origin===_proxyOrigin&&!_u.pathname.startsWith('/api/recorder/')){
        var _tp=new URL(_u.pathname+_u.search+_u.hash,_base).href;
        if(new URL(_tp).origin!==_proxyOrigin){
          var _au=_proxyOrigin+'/api/recorder/asset?url='+encodeURIComponent(_tp);
          input=(input instanceof Request)?new Request(_au,input):_au;
        }
      }
    }catch(_e){}
    return _nFetch(input,init);
  };
  var _NativeXHR=window.XMLHttpRequest;
  window.XMLHttpRequest=function(){
    var _xhr=new _NativeXHR();
    var _xOpen=_xhr.open.bind(_xhr);
    _xhr.open=function(method,url,async,user,pass){
      try{
        url=_unwrapRecorderUrl(url);
        var _u=new URL(String(url),window.location.href);
        if(_u.origin===_proxyOrigin&&!_u.pathname.startsWith('/api/recorder/')){
          var _tp=new URL(_u.pathname+_u.search+_u.hash,_base).href;
          if(new URL(_tp).origin!==_proxyOrigin){
            url=_proxyOrigin+'/api/recorder/asset?url='+encodeURIComponent(_tp);
          }
        }
      }catch(_e){}
      return _xOpen(method,url,async===undefined?true:async,user,pass);
    };
    return _xhr;
  };
  document.addEventListener('click',function(){_interacted=true;},{capture:true,once:true,passive:true});
  document.addEventListener('input',function(){_interacted=true;},{capture:true,once:true,passive:true});
  function _proxyNav(u){
    if(!_interacted)return;
    try{
      if(_isFlightUrl(u)) return; // Next.js RSC soft updates must not reload the page
      var abs=_normalizeDocUrl(u);
      if(abs.indexOf('/api/recorder/proxy')!==-1)return;
      if(abs.indexOf('/api/recorder/asset')!==-1){
        abs=_normalizeDocUrl(abs);
      }
      var t=new URL(abs);
      if(t.origin===_proxyOrigin)return;
      if(t.protocol!=='http:'&&t.protocol!=='https:')return;
      _inProxyNav=true;
      window.location.href=_proxyOrigin+'/api/recorder/proxy?url='+encodeURIComponent(abs)+'&sessionId='+encodeURIComponent(_sid);
    }catch(e){}
  }

  // Prevent accidental top-level navigation to /api/recorder/asset?...
  try{
    var _loc=window.location;
    var _assign=_loc.assign.bind(_loc);
    var _replace=_loc.replace.bind(_loc);
    function _guardNav(href, via){
      try{
        var abs=String(href);
        if(abs.indexOf('/api/recorder/asset')!==-1 || _isFlightUrl(abs)){
          var fixed=_normalizeDocUrl(abs);
          var t=new URL(fixed,_base);
          if(t.protocol==='http:'||t.protocol==='https:'){
            _inProxyNav=true;
            via.call(_loc,_proxyOrigin+'/api/recorder/proxy?url='+encodeURIComponent(t.href)+'&sessionId='+encodeURIComponent(_sid));
            return;
          }
        }
      }catch(e){}
      via.call(_loc,href);
    }
    _loc.assign=function(h){ _guardNav(h,_assign); };
    _loc.replace=function(h){ _guardNav(h,_replace); };
  }catch(e){}

  var _op=history.pushState;
  var _or=history.replaceState;
  history.pushState=function(s,t,u){
    if(u!=null){
      try{
        if(_isFlightUrl(u)) return _op.apply(history,arguments);
        var a=new URL(String(u),_base);
        if(a.origin!==_proxyOrigin){_proxyNav(String(u));if(_interacted)return;}
      }catch(e){}
    }
    return _op.apply(history,arguments);
  };
  history.replaceState=function(s,t,u){
    if(u!=null){
      try{
        if(_isFlightUrl(u)) return _or.apply(history,arguments);
        var a=new URL(String(u),_base);
        if(a.origin!==_proxyOrigin){_proxyNav(String(u));if(_interacted)return;}
      }catch(e){}
    }
    return _or.apply(history,arguments);
  };
  if(window.navigation){
    window.navigation.addEventListener('navigate',function(e){
      if(_inProxyNav){_inProxyNav=false;return;}
      if(!_interacted)return;
      if(e.navigationType==='traverse'||e.navigationType==='reload')return;
      var dest=e.destination.url;
      if(dest.indexOf('/api/recorder/proxy')!==-1)return;
      if(_isFlightUrl(dest)) return;
      try{
        // If browser tries to open asset URL as a document, reroute to proxy page
        if(dest.indexOf('/api/recorder/asset')!==-1){
          e.preventDefault();
          _proxyNav(dest);
          return;
        }
        var t=new URL(dest);
        if(t.protocol!=='http:'&&t.protocol!=='https:')return;
        var targetUrl;
        if(t.origin!==_proxyOrigin){
          targetUrl=dest;
        }else{
          targetUrl=new URL(t.pathname+t.search+t.hash,_base).href;
          if(targetUrl.indexOf('/api/recorder/proxy')!==-1)return;
          if(new URL(targetUrl).origin===_proxyOrigin)return;
        }
        e.preventDefault();
        _inProxyNav=true;
        window.location.href=_proxyOrigin+'/api/recorder/proxy?url='+encodeURIComponent(_normalizeDocUrl(targetUrl))+'&sessionId='+encodeURIComponent(_sid);
      }catch(_){}
    });
  }
  // ── SPA router URL fix ──
  // Next.js, Nuxt, Vue Router etc. read window.location.pathname for initialization.
  // Without this, they see '/api/recorder/proxy' instead of the real page path.
  try{
    var _tu=new URL(_base);
    var _tp2=_tu.pathname+_tu.search+_tu.hash;
    if(window.location.pathname.indexOf('/api/recorder/')===0&&_tp2&&_tp2!=='/'){
      _or.call(history,null,document.title,_tp2);
    }
  }catch(_){}
})();
</script>`

      // Add <base> so relative URLs resolve to the target origin
      const baseTag = `<base href="${escHTML(finalUrl)}">`
      if (/<head[^>]*>/i.test(html)) {
        html = html.replace(/<head[^>]*>/i, `$&\n  ${earlyCapture}\n  ${baseTag}`)
      } else {
        html = baseTag + html
      }

      // Build recorder script — uses fetch to POST steps back to our API
      const recScript = getRecorderScript(sessionId)
      // Add link interception for multi-page proxy navigation
      const linkIntercept = `
(function(){
  document.addEventListener('click', function(e) {
    var el = e.composedPath ? e.composedPath()[0] : e.target;
    while (el && el.tagName !== 'A') el = el.parentElement;
    if (!el || el.tagName !== 'A') return;
    var href = el.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    try {
      // Gunakan document.baseURI (di-set dari <base href="TARGET_URL">) agar URL relatif
      // seperti "/about" di-resolve ke target origin, bukan ke proxy origin (localhost:3000)
      var abs = new URL(href, document.baseURI).href;
      if (abs.indexOf('/api/recorder/proxy') !== -1) return;
      var t = new URL(abs);
      if (t.protocol !== 'http:' && t.protocol !== 'https:') return;
      // Jangan intercept URL yang mengarah ke proxy origin itu sendiri
      if (t.origin === window.location.origin) return;
      e.preventDefault();
      window.location.href = window.location.origin + '/api/recorder/proxy?url=' + encodeURIComponent(abs) + '&sessionId=' + encodeURIComponent(${JSON.stringify(String(sessionId))});
    } catch(_) {}
  }, false);
})();`

      const scriptTag = `<script>${recScript}\n${linkIntercept}\n;(function(){if(window.__recSendStep)window.__recSendStep({type:'NAVIGATE',selector:'',value:${JSON.stringify(url)},description:'Navigate to ${escHTML(url)}',tagName:'',timestamp:Date.now()});})()</script>`

      if (/<\/body>/i.test(html)) {
        html = html.replace(/<\/body>/i, `${scriptTag}\n</body>`)
      } else {
        html += scriptTag
      }

      // Toolbar overlay — simple, no window.fetch override
      const toolbar = `<div id="__rec_toolbar" style="position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#dc2626;color:white;font:13px/1 sans-serif;padding:8px 16px;display:flex;align-items:center;gap:12px;box-shadow:0 2px 8px rgba(0,0,0,0.3)">
  <span style="width:10px;height:10px;border-radius:50%;background:white;display:inline-block;animation:__rec_blink 1s infinite"></span>
  <strong>RECORDING</strong>
  <span id="__rec_count" data-n="0" style="opacity:0.85">0 steps</span>
  <span id="__rec_status" style="opacity:0.75;font-size:11px">— tutup jendela ini atau klik Stop di aplikasi utama untuk selesai</span>
  <style>@keyframes __rec_blink{0%,100%{opacity:1}50%{opacity:0.2}}</style>
</div>
<script>(function(){ document.body && (document.body.style.paddingTop='34px'); })();</script>`

      html = html.replace(/<body[^>]*>/i, `$&\n${toolbar}`)

      res.removeHeader('x-frame-options')
      res.removeHeader('content-security-policy')
      res.set('content-type', 'text/html; charset=utf-8')
      res.set('content-security-policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:")
      res.send(html)

    } catch (err) {
      const detail = formatFetchNetworkError(err)
      console.error(`[RECORDER] proxyPage fetch failed for ${url}: ${detail}`)
      const redirected = redirectToClientGate(detail)
      if (redirected) return redirected

      res.status(500).send(`<html><body style="font-family:sans-serif;padding:20px;background:#0f172a">
        <div style="max-width:640px;margin:40px auto;background:white;padding:24px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <h2 style="color:#dc2626;margin:0 0 12px">Gagal Memuat Halaman</h2>
          <p><strong>URL:</strong> ${escHTML(url)}</p>
          <p><strong>Error:</strong> ${escHTML(detail)}</p>
          <p style="color:#6b7280;font-size:14px">
            Jika URL hanya bisa diakses dari jaringan/VPN internal, mulai ulang recording dari aplikasi
            — sistem akan membuka mode rekam langsung di browser Anda.
          </p>
        </div></body></html>`)
    }
  },

  /**
   * GET /api/recorder/client-gate?url=&sessionId=&rt=
   * Guide page for recording internal/private URLs that the VPS cannot fetch.
   */
  clientGate(req, res) {
    const { url, sessionId, rt, reason } = req.query
    if (!url || !sessionId || !rt) {
      return res.status(400).send('<p>Missing url, sessionId, or rt</p>')
    }

    const session = recorderService.findActiveSessionByScenarioId(String(sessionId))
    if (!session || session.recordToken !== String(rt)) {
      return res.status(409).send(`<html><body style="font-family:system-ui;padding:40px;background:#0f172a;color:#e2e8f0">
        <h2>Sesi recording tidak aktif</h2>
        <p>Kembali ke aplikasi dan klik Start Recording lagi.</p>
      </body></html>`)
    }

    const appOrigin = resolveAppOrigin(req).replace(/^http:\/\/testsambilngopi\.com/i, 'https://testsambilngopi.com')
    // Full inline payload — never fetch inject.js (target CSP connect-src blocks it)
    const gateParams = new URLSearchParams({
      url: String(url),
      sessionId: String(sessionId),
      rt: String(rt),
    })
    const bridgeUrl = `${appOrigin}/api/recorder/client-gate?${gateParams.toString()}`
    const inlinePayload = buildClientInjectPayload(String(sessionId), String(rt), appOrigin, bridgeUrl)
    // Safe for embedding in HTML <script type="application/json"> (avoid </script> breakouts)
    const payloadJson = JSON.stringify(inlinePayload).replace(/</g, '\\u003c')
    const targetName = `tsn_rec_target_${String(sessionId).replace(/[^a-zA-Z0-9_-]/g, '_')}`

    res.removeHeader('content-security-policy')
    res.removeHeader('Content-Security-Policy')
    res.set('content-type', 'text/html; charset=utf-8')
    res.set('cache-control', 'no-store')
    // Allow inline boot script + JSON payload on this guide page (Helmet default CSP blocks it)
    res.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'self'; form-action 'self'"
    )
    res.send(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Client Recording — Test Sambil Ngopi</title>
  <style>
    :root { color-scheme: dark; }
    body { margin:0; font-family: "Segoe UI", system-ui, sans-serif; background: linear-gradient(160deg,#0f172a,#1e293b 50%,#0f766e22); color:#e2e8f0; min-height:100vh; }
    .wrap { max-width:720px; margin:0 auto; padding:40px 24px 64px; position:relative; z-index:1; }
    h1 { font-size:1.5rem; margin:0 0 8px; }
    .muted { color:#94a3b8; line-height:1.5; }
    .card { background:#1e293b; border:1px solid #334155; border-radius:12px; padding:20px; margin:20px 0; }
    .url { word-break:break-all; font-family:ui-monospace,monospace; font-size:13px; color:#67e8f9; }
    .steps { margin:0; padding-left:1.2rem; line-height:1.7; }
    .row { display:flex; flex-wrap:wrap; gap:10px; margin-top:16px; }
    a.btn, button.btn {
      appearance:none; border:0; border-radius:8px; padding:12px 16px; font-weight:600; cursor:pointer;
      text-decoration:none; display:inline-flex; align-items:center; gap:8px; pointer-events:auto; position:relative; z-index:2;
    }
    .primary { background:#dc2626; color:#fff; }
    .primary:hover { background:#b91c1c; }
    .secondary { background:#0f766e; color:#fff; }
    .secondary:hover { background:#0d9488; }
    pre { background:#0f172a; border:1px solid #334155; border-radius:8px; padding:12px; overflow:auto; font-size:11px; max-height:180px; white-space:pre-wrap; word-break:break-all; }
    .warn { color:#fbbf24; font-size:14px; }
    .ok { color:#6ee7b7; font-size:14px; }
    .bridge { font-size:13px; color:#a5b4fc; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Rekam di browser Anda</h1>
    <p class="muted">Mode client-direct: rekam di situs asli. Halaman ini menjadi <strong>jembatan</strong> step
      (postMessage) karena CSP target sering memblokir koneksi ke testsambilngopi.com.</p>
    <p class="warn"><strong>Jangan tutup tab panduan ini</strong> selama recording — biarkan tetap terbuka di belakang.</p>
    <p class="ok">Jangan paste URL <code>inject.js</code> / jangan fetch script. Hanya paste <strong>script inline</strong> dari tombol di bawah.</p>
    ${reason ? `<p class="warn">${escHTML(String(reason))}</p>` : ''}

    <div class="card">
      <div class="muted" style="font-size:12px;margin-bottom:6px">TARGET</div>
      <div class="url">${escHTML(String(url))}</div>
      <div class="row">
        <a class="btn primary" id="openTarget"
           href="${escAttr(String(url))}"
           target="${escAttr(targetName)}"
           rel="opener">1. Buka halaman target</a>
        <button type="button" class="btn secondary" id="copyConsole">2. Salin script inline (CSP-safe)</button>
      </div>
      <p class="bridge" id="bridgeStatus" style="margin-top:14px">Bridge: menunggu step dari tab target…</p>
    </div>

    <div class="card">
      <strong>Langkah (Garuda / CSP ketat)</strong>
      <ol class="steps">
        <li>Biarkan tab <em>panduan ini</em> tetap terbuka.</li>
        <li>Klik <strong>Buka halaman target</strong> (tab baru — harus dibuka dari tautan ini agar <code>window.opener</code> terhubung).</li>
        <li>Klik <strong>Salin script inline</strong>.</li>
        <li>Di tab target: <strong>F12</strong> → <strong>Console</strong>.</li>
        <li class="warn" style="list-style:none;margin:8px 0 8px -1.2rem;padding:10px 12px;border:1px solid #f59e0b55;border-radius:8px;background:#78350f33">
          Jika Chrome menulis <em>“type allow pasting”</em>: ketik tepat
          <kbd>allow pasting</kbd> lalu <strong>Enter</strong> (sekali per tab). Baru boleh paste script.
        </li>
        <li>Paste script: <kbd>Ctrl+V</kbd> → <strong>Enter</strong>.</li>
        <li class="warn" style="list-style:none;margin:8px 0 8px -1.2rem;padding:10px 12px;border:1px solid #f59e0b55;border-radius:8px;background:#78350f33">
          Jika toolbar bilang <strong>Klik Hubungkan bridge</strong>: klik tombol itu di toolbar merah
          (izinkan popup). Status harus jadi <em>Bridge siap</em>, lalu hijau
          <em>Connected (bridge)</em> setelah interaksi pertama. Jangan tutup tab panduan.
          Angka step di aplikasi utama harus ikut naik.
        </li>
        <li>Toolbar merah muncul; angka bridge di halaman ini naik saat Anda berinteraksi.</li>
        <li>Di aplikasi utama → <strong>Stop</strong>.</li>
      </ol>
    </div>

    <p class="muted" style="font-size:12px">Pratinjau script (clipboard berisi penuh):</p>
    <pre id="snippet"></pre>
  </div>
  <script type="application/json" id="rec-payload">${payloadJson}</script>
  <script>
    (function(){
      var payloadEl = document.getElementById('rec-payload');
      var snippet = '';
      try { snippet = JSON.parse(payloadEl.textContent || '""'); } catch (e) { snippet = ''; }
      var sessionId = ${JSON.stringify(String(sessionId))};
      var recordToken = ${JSON.stringify(String(rt))};
      var targetUrl = ${JSON.stringify(String(url))};
      var appOrigin = ${JSON.stringify(appOrigin)};
      var targetName = ${JSON.stringify(targetName)};
      var bridgeCount = 0;

      var preview = document.getElementById('snippet');
      if (preview) {
        preview.textContent = String(snippet).slice(0, 800) + '\\n\\n/* … ' + String(snippet).length + ' chars — salin via tombol … */';
      }

      function openTarget(ev) {
        // Prefer named window.open so opener stays connected (bridge)
        try {
          var w = window.open(targetUrl, targetName);
          if (w) {
            if (ev) ev.preventDefault();
            try { w.focus(); } catch (_) {}
            return w;
          }
        } catch (e) {}
        // Fall through to default <a target> navigation if popup blocked
        return null;
      }

      var openBtn = document.getElementById('openTarget');
      if (openBtn) {
        openBtn.addEventListener('click', function(ev) {
          var w = openTarget(ev);
          if (!w && !ev.defaultPrevented) {
            // let the <a> navigate
            return;
          }
          if (!w) {
            alert('Popup diblokir. Izinkan popup untuk testsambilngopi.com, lalu klik lagi.');
          }
        });
      }

      var copyBtn = document.getElementById('copyConsole');
      if (copyBtn) {
        copyBtn.addEventListener('click', function(){
          if (!snippet) {
            alert('Script kosong — mulai ulang recording dari aplikasi.');
            return;
          }
          navigator.clipboard.writeText(snippet).then(function(){
            alert('Script inline disalin (' + snippet.length + ' karakter).\\n\\nDi tab target:\\n1) F12 → Console\\n2) Jika diminta: ketik allow pasting lalu Enter\\n3) Ctrl+V → Enter\\n\\nJangan paste URL inject.js.');
          }).catch(function(){
            prompt('Salin script ini (Ctrl+A, Ctrl+C):', snippet);
          });
        });
      }

      window.addEventListener('message', function(ev) {
        var d = ev.data;
        if (!d || d.type !== '__REC_STEP__') return;
        if (String(d.sessionId) !== String(sessionId)) return;
        var step = d.data;
        if (!step || typeof step !== 'object') return;
        var stepKey = d.stepKey || ((step.selector || '') + '_' + (step.timestamp || Date.now()));
        // Relative URL — same origin as this gate page (avoids wrong appOrigin / mixed content)
        fetch('/api/recorder/client-step/' + encodeURIComponent(sessionId), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Record-Token': recordToken
          },
          body: JSON.stringify(step),
          credentials: 'same-origin'
        }).then(function(r) {
          return r.json().then(function(body) {
            return { httpOk: r.ok, status: r.status, body: body || {} };
          }).catch(function() {
            return { httpOk: false, status: r.status, body: { ok: false, error: 'non-json response' } };
          });
        }).then(function(result) {
          var el = document.getElementById('bridgeStatus');
          var body = result.body || {};
          var stored = result.httpOk && body.ok === true && body.stored === true;
          if (stored) {
            bridgeCount = typeof body.stepCount === 'number' ? body.stepCount : (bridgeCount + 1);
            if (el) el.textContent = 'Bridge OK: ' + bridgeCount + ' step diterima (jangan tutup tab ini)';
            try {
              if (ev.source) {
                ev.source.postMessage({ type: '__REC_STEP_ACK__', sessionId: sessionId, stepKey: stepKey, stored: true }, '*');
                ev.source.postMessage({ type: '__REC_BRIDGE_READY__', sessionId: sessionId }, '*');
              }
            } catch (_) {}
            var syncMsg = {
              type: '__REC_UI_SYNC__',
              sessionId: sessionId,
              step: step,
              steps: body.steps || null,
              stepCount: bridgeCount,
              timestamp: Date.now()
            };
            try {
              if (window.opener && !window.opener.closed) {
                window.opener.postMessage(syncMsg, '*');
              }
            } catch (_) {}
            try {
              if (!window.__recUiChannel) {
                window.__recUiChannel = new BroadcastChannel('tsn-recorder-' + sessionId);
              }
              window.__recUiChannel.postMessage(syncMsg);
            } catch (_) {}
          } else if (result.httpOk && body.ok === true && body.ignored) {
            if (el) el.textContent = 'Bridge aktif (noise diabaikan) — lanjut interaksi';
            try {
              if (ev.source) ev.source.postMessage({ type: '__REC_BRIDGE_READY__', sessionId: sessionId }, '*');
            } catch (_) {}
          } else {
            if (el) el.textContent = 'Bridge gagal: step tidak tersimpan (HTTP ' + result.status + ') — Start Recording ulang';
          }
        }).catch(function(e) {
          var el = document.getElementById('bridgeStatus');
          if (el) el.textContent = 'Bridge error: ' + e.message;
        });
      });

      // If this gate was opened via Hubungkan bridge from the target tab, tell opener we're ready
      function announceReady() {
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: '__REC_BRIDGE_READY__', sessionId: sessionId }, '*');
            var el = document.getElementById('bridgeStatus');
            if (el) el.textContent = 'Bridge aktif — kembali ke tab target dan lanjut rekam';
          }
        } catch (_) {}
      }
      announceReady();
      setTimeout(announceReady, 500);
      setTimeout(announceReady, 1500);
    })();
  </script>
</body>
</html>`)
  },

  /**
   * GET /api/recorder/inject.js?sessionId=&rt=&origin=
   * Cross-origin injectable recorder bootstrap for client-direct mode.
   * Prefer loading via fetch+textContent (not <script src>) under strict CSP.
   */
  injectScript(req, res) {
    setRecorderCors(req, res)
    const { sessionId, rt, origin } = req.query
    if (!sessionId || !rt) {
      res.status(400)
      res.type('application/javascript')
      return res.send('console.error("[testingndrih] missing sessionId or rt");')
    }

    const session = recorderService.findActiveSessionByScenarioId(String(sessionId))
    if (!session || session.recordToken !== String(rt)) {
      res.status(403)
      res.type('application/javascript')
      return res.send('console.error("[testingndrih] invalid or expired record token");')
    }

    const appOrigin = String(origin || resolveAppOrigin(req)).replace(/\/$/, '')
    // Force https origin when request came as http behind TLS terminator
    const safeOrigin = appOrigin.replace(/^http:\/\/testsambilngopi\.com/i, 'https://testsambilngopi.com')
    const gateParams = new URLSearchParams({
      url: String(session.startUrl || req.query.url || ''),
      sessionId: String(sessionId),
      rt: String(rt),
    })
    const bridgeUrl = `${safeOrigin}/api/recorder/client-gate?${gateParams.toString()}`

    res.set('content-type', 'application/javascript; charset=utf-8')
    res.set('cache-control', 'no-store')
    res.send(buildClientInjectPayload(String(sessionId), String(rt), safeOrigin, bridgeUrl))
  },

  /**
   * OPTIONS / POST /api/recorder/client-step/:scenarioId
   * Cross-origin step ingest authenticated by X-Record-Token.
   */
  optionsClientStep(req, res) {
    setRecorderCors(req, res)
    res.status(204).end()
  },

  receiveClientStep(req, res) {
    setRecorderCors(req, res)
    try {
      const { scenarioId } = req.params
      const recordToken = req.get('x-record-token') || req.body?.recordToken
      const step = req.body

      if (!recordToken) {
        return res.status(401).json({ ok: false, error: 'Missing X-Record-Token' })
      }

      const validationError = validateIncomingStep(step, scenarioId)
      if (validationError) {
        return res.status(400).json({ ok: false, error: validationError })
      }

      const sanitized = sanitizeIncomingStep(step)
      console.log(
        `[RECORDER] receiveClientStep scenario=${scenarioId} type=${sanitized.type} selector=${sanitized.selector.substring(0, 50)}`
      )
      const added = recorderService.addStepByRecordToken(scenarioId, String(recordToken), sanitized)
      if (!added || !added.ok) {
        return res.status(409).json({
          ok: false,
          stored: false,
          error: 'Recording session not active. Please restart recording.',
        })
      }
      const session = recorderService.findActiveSessionByScenarioId(String(scenarioId))
      return res.json({
        ok: true,
        stored: Boolean(added.stored),
        ignored: Boolean(added.ignored),
        stepCount: session?.steps?.length || 0,
        steps: session?.steps || [],
      })
    } catch (err) {
      console.error('[RECORDER] receiveClientStep error:', err)
      return res.status(500).json({ ok: false, error: 'Internal server error' })
    }
  },

  /**
   * GET /api/recorder/asset?url=TARGET_URL
   * Proxies non-HTML resources (JSON, JS, CSS, images) from the target site.
   * Required so Next.js /_next/data, API calls, and static assets work in the proxy.
   * No auth required — URL is validated to be http/https only.
   */
  async proxyAsset(req, res) {
    const { url } = req.query
    if (!url) return res.status(400).json({ error: 'Missing url' })

    let targetUrl
    try {
      targetUrl = new URL(url)
      if (!['http:', 'https:'].includes(targetUrl.protocol)) {
        return res.status(400).json({ error: 'Only http/https URLs allowed' })
      }
    } catch {
      return res.status(400).json({ error: 'Invalid URL' })
    }

    // Top-level document navigations must never land on /asset (RSC/_rsc soft nav bug).
    // Send the user back to the HTML proxy page instead.
    const dest = String(req.get('sec-fetch-dest') || '').toLowerCase()
    const mode = String(req.get('sec-fetch-mode') || '').toLowerCase()
    const isDocumentNav = dest === 'document' || mode === 'navigate'
    if (isDocumentNav) {
      let sessionId = req.query.sessionId
      if (!sessionId) {
        try {
          const referer = new URL(req.get('referer') || '', `http://${req.get('host') || 'localhost'}`)
          sessionId = referer.searchParams.get('sessionId')
        } catch { /* ignore */ }
      }
      targetUrl.searchParams.delete('_rsc')
      ;['_nextOutputTree', '_nextData', '_nextScroll'].forEach((k) => targetUrl.searchParams.delete(k))
      if (sessionId) {
        return res.redirect(
          302,
          `/api/recorder/proxy?url=${encodeURIComponent(targetUrl.href)}&sessionId=${encodeURIComponent(String(sessionId))}`
        )
      }
      return res.status(400).send(
        '<p>Recorder asset URLs are for fetch/XHR only. Re-open recording from the app.</p>'
      )
    }

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': req.get('accept') || '*/*',
          'Accept-Language': 'en-US,en;q=0.5',
          ...(req.get('rsc') ? { RSC: req.get('rsc') } : {}),
          ...(req.get('next-router-state-tree')
            ? { 'Next-Router-State-Tree': req.get('next-router-state-tree') }
            : {}),
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(15000)
      })

      const contentType = response.headers.get('content-type') || 'application/octet-stream'
      res.set('content-type', contentType)
      res.set('access-control-allow-origin', '*')
      res.set('cache-control', 'no-store')

      const buffer = await response.arrayBuffer()
      res.status(response.status).send(Buffer.from(buffer))
    } catch (err) {
      res.status(502).json({ error: err.message })
    }
  },

  /**
   * POST /api/recorder/step/:scenarioId
   * Receives a step from the client-side recorder (via console.log or postMessage).
   * 
   * Request body (from injected script):
   * {
   *   type: 'CLICK'|'FILL'|'HOVER'|'SCROLL'|'DRAG'|'FILE_UPLOAD',
   *   selector: string (CSS selector or shadow DOM path),
   *   value?: string (for FILL),
   *   description?: string (human-readable),
   *   tagName?: string,
   *   timestamp?: number (unix ms),
   *   contentEditable?: boolean (for FILL)
   * }
   * 
   * Returns: { ok: true } or { ok: false, error: string }
   * Supports both legacy console.log and new postMessage communication.
   */
  receiveStep(req, res) {
    try {
      const userId = req.user.id
      const { scenarioId } = req.params
      const step = req.body

      // ═══ VALIDATION ═══
      if (!step || typeof step !== 'object') {
        return res.status(400).json({ ok: false, error: 'Invalid step format' })
      }

      if (!step.type || typeof step.type !== 'string') {
        return res.status(400).json({ ok: false, error: 'Missing or invalid step.type' })
      }

      if (!scenarioId) {
        return res.status(400).json({ ok: false, error: 'Missing scenarioId parameter' })
      }

      // Validate step type
      const validTypes = ['CLICK', 'FILL', 'HOVER', 'SCROLL', 'DRAG', 'FILE_UPLOAD', 'SUBMIT', 'PASTE', 'CHANGE', 'NAVIGATE']
      if (!validTypes.includes(step.type)) {
        return res.status(400).json({ ok: false, error: `Invalid step type: ${step.type}` })
      }

      // Validate selector (required for most step types)
      if (['CLICK', 'FILL', 'HOVER', 'DRAG', 'FILE_UPLOAD'].includes(step.type)) {
        if (!step.selector || typeof step.selector !== 'string') {
          return res.status(400).json({ ok: false, error: `step.selector required for ${step.type}` })
        }
      }

      // ═══ SANITIZE ═══
      const sanitized = {
        type: step.type,
        selector: step.selector || '',
        value: step.value ? String(step.value).substring(0, 10000) : '',
        description: step.description ? String(step.description).substring(0, 500) : '',
        tagName: step.tagName ? String(step.tagName).substring(0, 50) : '',
        timestamp: Number.isInteger(step.timestamp) ? step.timestamp : Date.now(),
        contentEditable: Boolean(step.contentEditable)
      }

      // ═══ ADD STEP ═══
      console.log(`[RECORDER] receiveStep user=${userId} scenario=${scenarioId} type=${sanitized.type} selector=${sanitized.selector.substring(0, 50)}`)
      const added = recorderService.addStep(userId, scenarioId, sanitized)

      if (!added || !added.ok) {
        // Session not found or not recording
        return res.status(409).json({
          ok: false,
          error: 'Recording session not active. Please restart recording.'
        })
      }

      res.json({ ok: true, stored: Boolean(added.stored), ignored: Boolean(added.ignored), stepNumber: sanitized.stepNumber })
    } catch (err) {
      console.error(`[RECORDER] receiveStep error:`, err)
      res.status(500).json({ ok: false, error: 'Internal server error' })
    }
  }
}
