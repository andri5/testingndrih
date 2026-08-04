import { executionService, executionEvents } from '../services/executionService.js'
import { reportService } from '../services/reportService.js'
import {
  collectExecutionTargetUrls,
  preflightExecutionTargets,
} from '../utils/networkReachability.js'
import { beginUserRun } from '../services/runQuotaService.js'

/**
 * Execution Controller
 * Handles HTTP requests for test execution
 */

export const executionController = {
  /**
   * Execute a scenario
   * POST /api/executions/scenarios/:scenarioId
   */
  async executeScenario(req, res) {
    try {
      const { scenarioId } = req.params
      const userId = req.user.id
      const { browser, headless, device, environmentId } = req.body || {}

      if (!scenarioId) {
        return res.status(400).json({ message: 'Scenario ID is required' })
      }

      // Validate scenario & create execution record first, then run async
      const { prisma } = await import('../lib/prisma.js')
      const scenario = await prisma.scenario.findFirst({
        where: { id: scenarioId, userId },
        include: { testSteps: { orderBy: { stepNumber: 'asc' } } }
      })

      if (!scenario) {
        return res.status(404).json({ success: false, message: 'Scenario not found' })
      }
      if (scenario.testSteps.length === 0) {
        return res.status(400).json({ success: false, message: 'Scenario has no test steps' })
      }

      // P0: block cloud Run for private/VPN targets before starting Playwright
      const targetUrls = collectExecutionTargetUrls(scenario, scenario.testSteps)
      const preflight = await preflightExecutionTargets(targetUrls)
      if (preflight.blocked) {
        return res.status(400).json({
          success: false,
          code: preflight.code || 'PRIVATE_NETWORK',
          message: preflight.message,
          targetKind: preflight.targetKind || 'internal',
          url: preflight.url,
          executionBlocked: true,
        })
      }

      let releaseQuota
      try {
        releaseQuota = beginUserRun(userId)
      } catch (quotaErr) {
        return res.status(429).json({
          success: false,
          code: quotaErr.code || 'RUN_QUOTA',
          message: quotaErr.message,
        })
      }

      // Return execution ID immediately so the live viewer can connect
      // Execution runs in the background
      // Preserve explicit true/false; omit → service picks production-safe default
      let headlessOpt
      if (headless === true || headless === 'true') headlessOpt = true
      else if (headless === false || headless === 'false') headlessOpt = false
      else headlessOpt = undefined

      const options = {
        browser: browser || 'chromium',
        headless: headlessOpt,
        device: device || null,
        environmentId: environmentId || null,
        reachabilityWarning: preflight.privateNetwork ? preflight.message : null,
      }

      // Fire and forget — execution runs in background
      const executionPromise = executionService.executeScenario(userId, scenarioId, options)
      // Keep a settled handler attached during the short wait so rejections are not "unhandled"
      const tracked = executionPromise.finally(() => {
        try { releaseQuota?.() } catch { /* ignore */ }
      })
      tracked.catch(() => {})

      // Wait briefly for the execution record to be created (it's created at the start of executeScenario)
      // so we can get the execution ID
      await new Promise(r => setTimeout(r, 500))

      // Get the latest execution for this scenario
      const latestExec = await prisma.execution.findFirst({
        where: { scenarioId, userId },
        orderBy: { createdAt: 'desc' }
      })

      if (!latestExec) {
        // Fallback: wait for the promise (old behavior)
        try {
          const result = await executionPromise
          return res.status(200).json({
            success: true,
            message: 'Scenario executed successfully',
            execution: result.execution,
            ...(preflight.privateNetwork ? { warning: preflight.message } : {}),
          })
        } catch (err) {
          return res.status(400).json({
            success: false,
            message: err.message || 'Execution failed',
          })
        }
      }

      // Let the execution continue in background (errors logged, not thrown to client)
      executionPromise.then(() => {
        console.log(`[EXECUTION] Scenario ${scenarioId} completed`)
      }).catch(err => {
        console.error(`[EXECUTION] Scenario ${scenarioId} failed:`, err.message)
      })

      return res.status(200).json({
        success: true,
        message: 'Eksekusi dimulai — jendela Browser Runner menampilkan proses secara live',
        execution: {
          id: latestExec.id,
          status: 'RUNNING',
          totalSteps: scenario.testSteps.length,
          scenarioId
        },
        liveViewUrl: `/api/executions/${latestExec.id}/live-view`,
        ...(preflight.privateNetwork ? { warning: preflight.message, targetKind: 'internal' } : {}),
      })
    } catch (error) {
      console.error('Execution error:', error)

      res.status(400).json({
        success: false,
        message: error.message || 'Execution failed'
      })
    }
  },

  /**
   * Get execution history
   * GET /api/executions
   */
  async getExecutionHistory(req, res) {
    try {
      const userId = req.user.id
      const { scenarioId, limit = '20', offset = '0' } = req.query

      const result = await executionService.getExecutionHistory(
        userId,
        scenarioId || null,
        parseInt(limit),
        parseInt(offset)
      )

      res.status(200).json({
        success: true,
        ...result
      })
    } catch (error) {
      console.error('Error fetching execution history:', error)
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  },

  /**
   * Get execution details
   * GET /api/executions/:executionId
   */
  async getExecutionDetails(req, res) {
    try {
      const userId = req.user.id
      const { executionId } = req.params

      if (!executionId) {
        return res.status(400).json({ message: 'Execution ID is required' })
      }

      const execution = await executionService.getExecutionDetails(
        userId,
        executionId
      )

      res.status(200).json({
        success: true,
        execution
      })
    } catch (error) {
      console.error('Error fetching execution details:', error)
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  },

  /**
   * Cancel execution
   * POST /api/executions/:executionId/cancel
   */
  async cancelExecution(req, res) {
    try {
      const userId = req.user.id
      const { executionId } = req.params

      if (!executionId) {
        return res.status(400).json({ message: 'Execution ID is required' })
      }

      const result = await executionService.cancelExecution(userId, executionId)

      res.status(200).json({
        success: true,
        message: result.message
      })
    } catch (error) {
      console.error('Error cancelling execution:', error)
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  },

  /**
   * Delete execution
   * DELETE /api/executions/:executionId
   */
  async deleteExecution(req, res) {
    try {
      const userId = req.user.id
      const { executionId } = req.params

      if (!executionId) {
        return res.status(400).json({ message: 'Execution ID is required' })
      }

      const result = await executionService.deleteExecution(userId, executionId)

      res.status(200).json({
        success: true,
        message: result.message
      })
    } catch (error) {
      console.error('Error deleting execution:', error)
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  },

  /**
   * Export execution report
   * GET /api/executions/:executionId/export?format=html|pdf
   */
  async exportReport(req, res) {
    try {
      const userId = req.user.id
      const { executionId } = req.params
      const format = (req.query.format || 'html').toLowerCase()

      if (!['html', 'pdf'].includes(format)) {
        return res.status(400).json({ success: false, message: "format must be 'html' or 'pdf'" })
      }

      const execution = await reportService.fetchExecution(userId, executionId)
      const html = await reportService.buildHtml(execution)

      if (format === 'pdf') {
        const pdfBuffer = await reportService.buildPdf(html)
        const filename = `execution-report-${executionId}.pdf`
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': pdfBuffer.length
        })
        return res.end(pdfBuffer)
      }

      // HTML
      const filename = `execution-report-${executionId}.html`
      res.set({
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      })
      return res.send(html)
    } catch (error) {
      console.error('Error exporting report:', error)
      res.status(400).json({ success: false, message: error.message })
    }
  },

  /**
   * Get execution statistics
   * GET /api/executions/stats/summary
   */
  async getExecutionStats(req, res) {
    try {
      const userId = req.user.id
      const { scenarioId } = req.query

      const stats = await executionService.getExecutionStats(
        userId,
        scenarioId || null
      )

      res.status(200).json({
        success: true,
        stats
      })
    } catch (error) {
      console.error('Error fetching execution stats:', error)
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  },

  /**
   * SSE live execution stream
   * GET /api/executions/:executionId/live-stream
   */
  async liveStream(req, res) {
    const { executionId } = req.params

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    })

    const safeSend = (data) => {
      try { res.write(`data: ${JSON.stringify(data)}\n\n`) } catch (_) {}
    }

    safeSend({ event: 'connected', executionId })

    // Subscribe to future events BEFORE DB query so we don't miss any
    const pendingBuffer = []
    let dbDone = false

    const handler = (data) => {
      if (!dbDone) {
        pendingBuffer.push(data)
      } else {
        safeSend(data)
        if (data.event === 'execution-done') {
          setTimeout(() => { try { res.end() } catch (_) {} }, 500)
        }
      }
    }

    executionEvents.on(`exec:${executionId}`, handler)

    // Replay existing state from DB for late-connecting clients
    try {
      const { prisma } = await import('../lib/prisma.js')
      const execution = await prisma.execution.findUnique({
        where: { id: executionId },
        include: {
          stepResults: {
            include: { testStep: true, screenshot: true },
            orderBy: { createdAt: 'asc' }
          }
        }
      })

      if (execution) {
        const totalSteps = execution.totalSteps || execution.stepResults.length
        let replayPassed = 0
        let replayFailed = 0

        for (const sr of execution.stepResults) {
          const stepNum = sr.testStep?.stepNumber
          if (stepNum == null) continue

          safeSend({
            event: 'step-start',
            stepNumber: stepNum,
            totalSteps,
            type: sr.testStep?.type,
            description: sr.testStep?.description,
            selector: sr.testStep?.selector
          })

          if (sr.status === 'PASSED') replayPassed++
          else replayFailed++

          safeSend({
            event: 'step-done',
            stepNumber: stepNum,
            totalSteps,
            status: sr.status,
            type: sr.testStep?.type,
            description: sr.testStep?.description,
            duration: sr.duration,
            screenshotUrl: sr.screenshot?.url || null,
            errorMessage: sr.errorMessage,
            passedSteps: replayPassed,
            failedSteps: replayFailed
          })
        }

        // If execution is already finished, send done event and close
        if (execution.status !== 'RUNNING' && execution.status !== 'PENDING') {
          safeSend({
            event: 'execution-done',
            status: execution.status,
            passedSteps: execution.passedSteps || 0,
            failedSteps: execution.failedSteps || 0,
            totalSteps,
            duration: execution.duration,
            videoPath: execution.videoPath
          })
          executionEvents.removeListener(`exec:${executionId}`, handler)
          setTimeout(() => { try { res.end() } catch (_) {} }, 500)
          return
        }
      }
    } catch (err) {
      console.error('Error replaying execution state for SSE:', err.message)
    }

    // DB query done — flush buffered events and continue live streaming
    dbDone = true
    for (const event of pendingBuffer) {
      safeSend(event)
      if (event.event === 'execution-done') {
        executionEvents.removeListener(`exec:${executionId}`, handler)
        setTimeout(() => { try { res.end() } catch (_) {} }, 500)
        return
      }
    }
    pendingBuffer.length = 0

    req.on('close', () => {
      executionEvents.removeListener(`exec:${executionId}`, handler)
    })
  },

  /**
   * Browser Runner — live Playwright page stream + Pause/Stop
   * GET /api/executions/:executionId/live-view
   */
  liveView(req, res) {
    const { executionId } = req.params

    const html = `<!DOCTYPE html>
<html lang="id"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Browser Runner — Test Sambil Ngopi</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Segoe UI,system-ui,sans-serif;background:#111827;color:#e5e7eb;height:100vh;overflow:hidden}
.shell{display:flex;flex-direction:column;height:100vh}
.chrome{background:#1f2937;border-bottom:1px solid #374151;padding:10px 14px;display:flex;align-items:center;gap:10px}
.dots{display:flex;gap:6px}
.dot{width:10px;height:10px;border-radius:50%}
.dot.r{background:#ef4444}.dot.y{background:#f59e0b}.dot.g{background:#22c55e}
.title{font-size:13px;font-weight:600;white-space:nowrap}
.badge{padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700}
.badge-running{background:#2563eb;color:#fff;animation:pulse 1.4s infinite}
.badge-paused{background:#d97706;color:#fff}
.badge-passed{background:#16a34a;color:#fff}
.badge-failed{background:#dc2626;color:#fff}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.55}}
.urlbar{flex:1;min-width:0;background:#111827;border:1px solid #374151;border-radius:8px;padding:7px 12px;font-size:12px;color:#9ca3af;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.controls{display:flex;gap:8px}
.btn{border:0;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;color:#fff;cursor:pointer}
.btn:disabled{opacity:.5;cursor:not-allowed}
.btn-pause{background:#d97706}.btn-resume{background:#16a34a;display:none}.btn-stop{background:#dc2626}
.main{flex:1;display:flex;min-height:0}
.stage{flex:1;display:flex;align-items:center;justify-content:center;background:#0b1220;padding:16px;position:relative}
.browser-frame{width:min(100%,1280px);height:100%;max-height:100%;background:#000;border-radius:12px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.45);border:1px solid #1f2937;display:flex;align-items:center;justify-content:center}
.browser-frame img{width:100%;height:100%;object-fit:contain;background:#000}
.waiting{color:#6b7280;font-size:14px;text-align:center;padding:24px}
.sidebar{width:300px;background:#1f2937;border-left:1px solid #374151;overflow:auto;padding:12px}
.meta{font-size:12px;color:#9ca3af;margin-bottom:10px}
.progress{height:4px;background:#374151;border-radius:999px;margin:8px 0 12px}
.bar{height:100%;width:0;border-radius:999px;background:#2563eb;transition:width .25s}
.step{padding:8px 10px;border:1px solid #374151;border-radius:8px;margin-bottom:8px;font-size:12px}
.step.active{border-color:#2563eb;background:#172554}
.step.passed{border-color:#16a34a;background:rgba(22,163,74,.08)}
.step.failed{border-color:#dc2626;background:rgba(220,38,38,.08)}
.step .t{font-weight:700}.step .d{color:#9ca3af;margin-top:2px}
.done{margin-top:12px;padding:12px;border-radius:8px;text-align:center;display:none}
.done.ok{background:rgba(22,163,74,.15);color:#4ade80;display:block}
.done.bad{background:rgba(220,38,38,.15);color:#fca5a5;display:block}
</style>
</head>
<body>
<div class="shell">
  <div class="chrome">
    <div class="dots"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span></div>
    <div class="title">Browser Runner</div>
    <span id="statusBadge" class="badge badge-running">RUNNING</span>
    <div id="urlBar" class="urlbar">Menunggu browser Playwright...</div>
    <div id="controlBtns" class="controls">
      <button id="btnPause" class="btn btn-pause">Pause</button>
      <button id="btnResume" class="btn btn-resume">Resume</button>
      <button id="btnStop" class="btn btn-stop">Stop</button>
    </div>
  </div>
  <div class="main">
    <div class="stage">
      <div class="browser-frame">
        <img id="liveImg" alt="Browser" style="display:none">
        <p id="noImg" class="waiting">Menunggu proses testing dimulai...<br><span style="font-size:12px">Halaman target akan tampil di sini secara live</span></p>
      </div>
    </div>
    <aside class="sidebar">
      <div class="meta" id="stepInfo">Step: menunggu...</div>
      <div class="meta" id="progressText">0 / ? steps</div>
      <div class="progress"><div id="progressBar" class="bar"></div></div>
      <div id="stepsList"></div>
      <div id="doneBanner" class="done"></div>
    </aside>
  </div>
</div>
<script>
(function(){
  var execId = ${JSON.stringify(executionId)};
  var steps = {};
  var totalSteps = 0;
  var es = new EventSource('/api/executions/' + execId + '/live-stream');

  function setBadge(text, cls) {
    var b = document.getElementById('statusBadge');
    b.textContent = text;
    b.className = 'badge ' + cls;
  }

  function showFrame(dataUrl) {
    var img = document.getElementById('liveImg');
    img.src = dataUrl;
    img.style.display = 'block';
    document.getElementById('noImg').style.display = 'none';
  }

  es.onmessage = function(e) {
    var d; try { d = JSON.parse(e.data); } catch(_){ return; }

    if (d.event === 'browser-frame' && d.data) {
      showFrame('data:image/jpeg;base64,' + d.data);
      if (d.url) document.getElementById('urlBar').textContent = d.url;
      return;
    }

    if (d.event === 'execution-paused') {
      document.getElementById('btnPause').style.display = 'none';
      document.getElementById('btnResume').style.display = 'inline-block';
      setBadge('PAUSED', 'badge-paused');
      document.getElementById('stepInfo').textContent = 'Paused after step ' + d.stepNumber;
    }

    if (d.event === 'execution-resumed') {
      document.getElementById('btnPause').style.display = 'inline-block';
      document.getElementById('btnResume').style.display = 'none';
      document.getElementById('btnPause').disabled = false;
      document.getElementById('btnPause').textContent = 'Pause';
      setBadge('RUNNING', 'badge-running');
    }

    if (d.event === 'step-start') {
      totalSteps = d.totalSteps || totalSteps;
      steps[d.stepNumber] = { status: 'active', type: d.type, description: d.description };
      document.getElementById('stepInfo').textContent = 'Step ' + d.stepNumber + '/' + totalSteps + ': ' + d.type;
      renderSteps();
    }

    if (d.event === 'step-done') {
      totalSteps = d.totalSteps || totalSteps;
      steps[d.stepNumber] = steps[d.stepNumber] || {};
      Object.assign(steps[d.stepNumber], {
        status: d.status === 'PASSED' ? 'passed' : 'failed',
        type: d.type,
        description: d.description,
        errorMessage: d.errorMessage
      });
      if (d.screenshotUrl && !document.getElementById('liveImg').src.startsWith('data:')) {
        showFrame(d.screenshotUrl + '?t=' + Date.now());
      }
      var done = Object.keys(steps).filter(function(k){ return steps[k].status !== 'active'; }).length;
      document.getElementById('progressText').textContent = done + ' / ' + totalSteps + ' steps';
      document.getElementById('progressBar').style.width = (totalSteps ? Math.round(done / totalSteps * 100) : 0) + '%';
      document.getElementById('stepInfo').textContent = 'Step ' + d.stepNumber + '/' + totalSteps + ': ' + d.status;
      renderSteps();
    }

    if (d.event === 'execution-done') {
      try { es.close(); } catch(_){}
      document.getElementById('controlBtns').style.display = 'none';
      setBadge(d.status, d.status === 'PASSED' ? 'badge-passed' : 'badge-failed');
      document.getElementById('stepInfo').textContent = 'Selesai';
      document.getElementById('progressBar').style.width = '100%';
      var banner = document.getElementById('doneBanner');
      banner.className = 'done ' + (d.status === 'PASSED' ? 'ok' : 'bad');
      banner.textContent = d.status + ' — ' + (d.passedSteps||0) + ' passed, ' + (d.failedSteps||0) + ' failed';
    }
  };

  es.onerror = function() {
    document.getElementById('stepInfo').textContent = 'Koneksi stream terputus — mencoba menyambung ulang...';
  };

  document.getElementById('btnPause').onclick = function(){ sendCtrl('pause'); };
  document.getElementById('btnResume').onclick = function(){ sendCtrl('resume'); };
  document.getElementById('btnStop').onclick = function(){ sendCtrl('stop'); };

  function sendCtrl(action) {
    fetch('/api/executions/' + execId + '/viewer-' + action, { method: 'POST' }).catch(function(){});
    if (action === 'pause') {
      document.getElementById('btnPause').disabled = true;
      document.getElementById('btnPause').textContent = 'Pausing...';
    } else if (action === 'stop') {
      document.getElementById('btnStop').disabled = true;
      document.getElementById('btnStop').textContent = 'Stopping...';
    } else if (action === 'resume') {
      document.getElementById('btnResume').style.display = 'none';
      document.getElementById('btnPause').style.display = 'inline-block';
    }
  }

  function renderSteps() {
    var el = document.getElementById('stepsList');
    var html = '';
    var max = Math.max(totalSteps, Object.keys(steps).length);
    for (var i = 1; i <= max; i++) {
      var s = steps[i];
      if (!s) {
        html += '<div class="step"><div class="t">#' + i + ' Menunggu...</div></div>';
        continue;
      }
      html += '<div class="step ' + s.status + '"><div class="t">#' + i + ' ' + (s.type||'') + '</div>'
        + '<div class="d">' + (s.description||'') + '</div></div>';
    }
    el.innerHTML = html;
  }
})();
</script>
</body></html>`

    res.set({
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'"
    })
    res.send(html)
  },

  /**
   * Test a selector on the currently running execution page
   * POST /api/executions/:executionId/test-selector
   * Body: { selector: string }
   */
  async testSelector(req, res) {
    try {
      const { executionId } = req.params
      const { selector } = req.body

      if (!selector) {
        return res.status(400).json({ success: false, message: 'Selector is required' })
      }

      const result = await executionService.testSelector(executionId, selector)
      res.status(200).json({ success: true, result })
    } catch (error) {
      console.error('Error testing selector:', error)
      res.status(400).json({ success: false, message: error.message })
    }
  },

  /**
   * Clear highlight from the currently running execution page
   * POST /api/executions/:executionId/clear-highlight
   */
  async clearHighlight(req, res) {
    try {
      const { executionId } = req.params
      await executionService.clearHighlight(executionId)
      res.status(200).json({ success: true })
    } catch (error) {
      console.error('Error clearing highlight:', error)
      res.status(400).json({ success: false, message: error.message })
    }
  },

  /**
   * Get available browsers for cross-browser testing
   * GET /api/executions/browsers
   */
  async getAvailableBrowsers(req, res) {
    try {
      const { getAvailableBrowsers, MOBILE_DEVICES } = await import('../services/browserService.js')
      const browsers = getAvailableBrowsers()
      
      res.status(200).json({
        success: true,
        browsers: browsers.map(b => ({
          key: b.key,
          displayName: b.displayName,
          description: b.description,
          isDefault: b.isDefault
        })),
        mobileDevices: MOBILE_DEVICES.map(d => ({
          key: d.key,
          displayName: d.displayName,
          description: d.description,
          engine: d.engine,
          type: d.type,
          viewport: d.viewport
        }))
      })
    } catch (error) {
      console.error('Error fetching available browsers:', error)
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  },

  /**
   * Stop a running execution from live viewer (no auth required)
   * POST /api/executions/:executionId/viewer-stop
   */
  async viewerStop(req, res) {
    try {
      const { executionId } = req.params
      executionService.viewerStop(executionId)
      res.status(200).json({ success: true, message: 'Stop signal sent' })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  },

  /**
   * Pause a running execution from live viewer (no auth required)
   * POST /api/executions/:executionId/viewer-pause
   */
  async viewerPause(req, res) {
    try {
      const { executionId } = req.params
      executionService.viewerPause(executionId)
      res.status(200).json({ success: true, message: 'Pause signal sent' })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  },

  /**
   * Resume a paused execution from live viewer (no auth required)
   * POST /api/executions/:executionId/viewer-resume
   */
  async viewerResume(req, res) {
    try {
      const { executionId } = req.params
      executionService.viewerResume(executionId)
      res.status(200).json({ success: true, message: 'Resume signal sent' })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }
}
