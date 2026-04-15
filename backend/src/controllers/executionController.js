import { executionService, executionEvents } from '../services/executionService.js'
import { reportService } from '../services/reportService.js'

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
      const { browser, headless } = req.body

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

      // Return execution ID immediately so the live viewer can connect
      // Execution runs in the background
      const options = {
        browser: browser || 'firefox',
        headless: headless === true || headless === 'true'
      }

      // Fire and forget — execution runs in background
      const executionPromise = executionService.executeScenario(userId, scenarioId, options)

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
        const result = await executionPromise
        return res.status(200).json({
          success: true,
          message: 'Scenario executed successfully',
          execution: result.execution
        })
      }

      // Let the execution continue in background
      executionPromise.then(() => {
        console.log(`[EXECUTION] Scenario ${scenarioId} completed`)
      }).catch(err => {
        console.error(`[EXECUTION] Scenario ${scenarioId} failed:`, err.message)
      })

      res.status(200).json({
        success: true,
        message: 'Eksekusi dimulai — buka Live Viewer untuk melihat progress',
        execution: {
          id: latestExec.id,
          status: 'RUNNING',
          totalSteps: scenario.testSteps.length,
          scenarioId
        },
        liveViewUrl: `/api/executions/${latestExec.id}/live-view`
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
      const html = reportService.buildHtml(execution)

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
  liveStream(req, res) {
    const { executionId } = req.params

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    })

    res.write(`data: ${JSON.stringify({ event: 'connected', executionId })}\n\n`)

    const handler = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`)
      if (data.event === 'execution-done') {
        setTimeout(() => res.end(), 500)
      }
    }

    executionEvents.on(`exec:${executionId}`, handler)

    req.on('close', () => {
      executionEvents.removeListener(`exec:${executionId}`, handler)
    })
  },

  /**
   * Live execution viewer HTML page
   * GET /api/executions/:executionId/live-view
   */
  liveView(req, res) {
    const { executionId } = req.params
    const token = req.query.token || ''

    const html = `<!DOCTYPE html>
<html lang="id"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Live Execution — testingndrih</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh}
.header{background:#1e293b;padding:12px 20px;display:flex;align-items:center;gap:12px;border-bottom:1px solid #334155}
.header h1{font-size:16px;font-weight:600}
.badge{padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600}
.badge-running{background:#3b82f6;color:white;animation:pulse 1.5s infinite}
.badge-passed{background:#22c55e;color:white}
.badge-failed{background:#ef4444;color:white}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
.main{display:flex;height:calc(100vh - 49px)}
.viewer{flex:1;display:flex;align-items:center;justify-content:center;padding:16px;background:#0f172a}
.viewer img{max-width:100%;max-height:100%;border-radius:8px;box-shadow:0 4px 24px rgba(0,0,0,.5);transition:opacity .3s}
.sidebar{width:320px;background:#1e293b;border-left:1px solid #334155;overflow-y:auto;padding:12px}
.step-card{padding:10px 12px;border-radius:8px;margin-bottom:8px;border:1px solid #334155;transition:all .2s}
.step-card.active{border-color:#3b82f6;background:#1e3a5f}
.step-card.passed{border-color:#22c55e;background:rgba(34,197,94,.08)}
.step-card.failed{border-color:#ef4444;background:rgba(239,68,68,.08)}
.step-num{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;font-size:11px;font-weight:700;margin-right:8px}
.step-num.active{background:#3b82f6;color:white}
.step-num.passed{background:#22c55e;color:white}
.step-num.failed{background:#ef4444;color:white}
.step-num.pending{background:#475569;color:#94a3b8}
.step-type{font-weight:600;font-size:13px}
.step-desc{font-size:12px;color:#94a3b8;margin-top:2px}
.step-dur{font-size:11px;color:#64748b;margin-top:2px}
.step-err{font-size:11px;color:#fca5a5;margin-top:4px;padding:6px 8px;background:rgba(239,68,68,.1);border-radius:4px;word-break:break-word}
.progress{height:4px;background:#334155;border-radius:2px;margin:8px 0}
.progress-bar{height:100%;border-radius:2px;transition:width .3s}
.summary{padding:12px;background:#0f172a;border-radius:8px;margin-bottom:12px;text-align:center}
.summary-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
.summary-item{padding:8px;border-radius:6px;font-size:20px;font-weight:700}
.no-screenshot{color:#64748b;font-size:14px}
.done-banner{padding:16px;text-align:center;border-radius:8px;margin:12px 0}
.done-banner.passed{background:rgba(34,197,94,.15);color:#4ade80}
.done-banner.failed{background:rgba(239,68,68,.15);color:#fca5a5}
.video-link{display:inline-block;margin-top:8px;padding:6px 16px;background:#3b82f6;color:white;border-radius:6px;text-decoration:none;font-size:13px}
</style>
</head>
<body>
<div class="header">
  <span style="font-size:20px">🔴</span>
  <h1>Live Execution Viewer</h1>
  <span id="statusBadge" class="badge badge-running">RUNNING</span>
  <span style="flex:1"></span>
  <span id="stepInfo" style="font-size:13px;color:#94a3b8">Menunggu...</span>
</div>
<div class="main">
  <div class="viewer">
    <img id="liveImg" src="" alt="Screenshot" style="display:none">
    <p id="noImg" class="no-screenshot">Menunggu eksekusi dimulai...</p>
  </div>
  <div class="sidebar">
    <div class="summary">
      <div id="progressText" style="font-size:13px;color:#94a3b8">0 / ? steps</div>
      <div class="progress"><div id="progressBar" class="progress-bar" style="width:0;background:#3b82f6"></div></div>
      <div class="summary-grid">
        <div class="summary-item" style="background:rgba(34,197,94,.1);color:#4ade80"><span id="passCount">0</span><div style="font-size:11px;font-weight:400;color:#94a3b8">Passed</div></div>
        <div class="summary-item" style="background:rgba(239,68,68,.1);color:#fca5a5"><span id="failCount">0</span><div style="font-size:11px;font-weight:400;color:#94a3b8">Failed</div></div>
      </div>
    </div>
    <div id="stepsList"></div>
    <div id="doneBanner"></div>
  </div>
</div>
<script>
(function(){
  var execId = ${JSON.stringify(executionId)};
  var steps = {};
  var totalSteps = 0;
  var es = new EventSource('/api/executions/' + execId + '/live-stream');

  es.onmessage = function(e) {
    var d;
    try { d = JSON.parse(e.data); } catch(_){ return; }

    if (d.event === 'step-start') {
      totalSteps = d.totalSteps || totalSteps;
      steps[d.stepNumber] = { status: 'active', type: d.type, description: d.description, selector: d.selector };
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
        duration: d.duration,
        screenshotUrl: d.screenshotUrl,
        errorMessage: d.errorMessage
      });

      // Update screenshot
      if (d.screenshotUrl) {
        var img = document.getElementById('liveImg');
        img.src = d.screenshotUrl + '?t=' + Date.now();
        img.style.display = 'block';
        document.getElementById('noImg').style.display = 'none';
      }

      // Counters
      document.getElementById('passCount').textContent = d.passedSteps || 0;
      document.getElementById('failCount').textContent = d.failedSteps || 0;

      var done = Object.keys(steps).filter(function(k){ return steps[k].status !== 'active'; }).length;
      document.getElementById('progressText').textContent = done + ' / ' + totalSteps + ' steps';
      var pct = totalSteps > 0 ? Math.round(done / totalSteps * 100) : 0;
      var bar = document.getElementById('progressBar');
      bar.style.width = pct + '%';
      bar.style.background = d.status === 'FAILED' ? '#ef4444' : '#22c55e';
      document.getElementById('stepInfo').textContent = 'Step ' + d.stepNumber + '/' + totalSteps + ': ' + d.status;

      renderSteps();
    }

    if (d.event === 'execution-done') {
      es.close();
      var badge = document.getElementById('statusBadge');
      badge.textContent = d.status;
      badge.className = 'badge badge-' + d.status.toLowerCase();
      document.getElementById('stepInfo').textContent = 'Selesai — ' + (d.duration ? (d.duration/1000).toFixed(1) + 's' : '');

      var banner = document.getElementById('doneBanner');
      var cls = d.status === 'PASSED' ? 'passed' : 'failed';
      banner.innerHTML = '<div class="done-banner ' + cls + '">'
        + '<div style="font-size:24px;margin-bottom:4px">' + (d.status === 'PASSED' ? '✅' : '❌') + '</div>'
        + '<div style="font-size:16px;font-weight:600">' + d.status + '</div>'
        + '<div style="font-size:12px;margin-top:4px">' + (d.passedSteps||0) + ' passed, ' + (d.failedSteps||0) + ' failed</div>'
        + (d.videoPath ? '<a class="video-link" href="' + d.videoPath + '" target="_blank">🎥 Lihat Video</a>' : '')
        + '</div>';

      // Final progress
      var done = d.passedSteps + d.failedSteps;
      document.getElementById('progressText').textContent = done + ' / ' + (d.totalSteps||totalSteps) + ' steps — DONE';
      document.getElementById('progressBar').style.width = '100%';
      document.getElementById('passCount').textContent = d.passedSteps || 0;
      document.getElementById('failCount').textContent = d.failedSteps || 0;
    }
  };

  es.onerror = function() {
    document.getElementById('stepInfo').textContent = 'Koneksi terputus';
  };

  function renderSteps() {
    var el = document.getElementById('stepsList');
    var html = '';
    for (var i = 1; i <= Math.max(totalSteps, Object.keys(steps).length); i++) {
      var s = steps[i];
      if (!s) {
        html += '<div class="step-card"><span class="step-num pending">' + i + '</span><span class="step-type" style="color:#64748b">Menunggu...</span></div>';
        continue;
      }
      html += '<div class="step-card ' + s.status + '">'
        + '<span class="step-num ' + s.status + '">' + i + '</span>'
        + '<span class="step-type">' + (s.type || '') + '</span>'
        + '<div class="step-desc">' + (s.description || '') + '</div>';
      if (s.duration) html += '<div class="step-dur">' + s.duration + 'ms</div>';
      if (s.errorMessage) {
        var errMsg = s.errorMessage;
        try { errMsg = JSON.parse(s.errorMessage).message; } catch(_){}
        html += '<div class="step-err">❌ ' + errMsg.substring(0, 200) + '</div>';
      }
      html += '</div>';
    }
    el.innerHTML = html;
    // Auto-scroll ke step terbaru
    var cards = el.querySelectorAll('.step-card');
    if (cards.length > 0) cards[cards.length-1].scrollIntoView({block:'nearest'});
  }
})();
</script>
</body></html>`

    res.set('Content-Type', 'text/html; charset=utf-8')
    res.send(html)
  }
}
