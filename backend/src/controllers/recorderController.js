import { recorderService, getRecorderScript } from '../services/recorderService.js'

function escHTML(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export const recorderController = {
  async startRecording(req, res, next) {
    try {
      const userId = req.user.id
      const { scenarioId, url } = req.body
      if (!scenarioId) {
        return res.status(400).json({ error: 'scenarioId diperlukan' })
      }
      const result = await recorderService.startRecording(userId, scenarioId, url)
      res.json(result)
    } catch (err) {
      if (err.message.includes('sudah berjalan') || err.message.includes('tidak ditemukan')) {
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
      res.json(result)
    } catch (err) {
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

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
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
      const earlyCapture = `<script>window.__nativeFetch=window.fetch.bind(window);window.__recOrigin=window.location.origin;</script>`

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
      var abs = new URL(href, location.href).href;
      var t = new URL(abs);
      if (t.protocol !== 'http:' && t.protocol !== 'https:') return;
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
      res.status(500).send(`<html><body style="font-family:sans-serif;padding:20px;background:#f9fafb">
        <div style="max-width:600px;margin:40px auto;background:white;padding:24px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <h2 style="color:#dc2626">Gagal Memuat Halaman</h2>
          <p><strong>URL:</strong> ${escHTML(url)}</p>
          <p><strong>Error:</strong> ${escHTML(err.message)}</p>
          <p style="color:#6b7280;font-size:14px">Pastikan URL dapat diakses.</p>
        </div></body></html>`)
    }
  },

  /**
   * POST /api/recorder/step/:scenarioId
   * Receives a step from the client-side recorder running in the proxy page.
   */
  receiveStep(req, res) {
    const userId = req.user.id
    const { scenarioId } = req.params
    const step = req.body
    if (!step || !step.type) return res.json({ ok: false, reason: 'no type' })
    console.log(`[RECORDER] receiveStep user=${userId} scenario=${scenarioId} type=${step.type}`)
    const added = recorderService.addStep(userId, scenarioId, step)
    res.json({ ok: added })
  }
}
