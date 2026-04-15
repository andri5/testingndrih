import { firefox } from 'playwright'
import { prisma } from '../lib/prisma.js'

/**
 * Report Service — generate HTML / PDF execution reports
 */
export const reportService = {

  /**
   * Fetch execution data (same projection used by getExecutionDetails)
   */
  async fetchExecution(userId, executionId) {
    const execution = await prisma.execution.findFirst({
      where: { id: executionId, userId },
      include: {
        scenario: { select: { name: true, url: true } },
        stepResults: {
          include: { testStep: true, screenshot: true },
          orderBy: { testStep: { stepNumber: 'asc' } }
        }
      }
    })
    if (!execution) throw new Error('Execution not found')
    return execution
  },

  /**
   * Build a standalone HTML report string for an execution.
   */
  buildHtml(execution) {
    const { scenario, stepResults, status, startTime, endTime, errorMessage, browser, headless } = execution
    const duration = startTime && endTime
      ? ((new Date(endTime) - new Date(startTime)) / 1000).toFixed(2) + 's'
      : '—'
    const passCount = stepResults.filter(r => r.status === 'PASSED').length
    const failCount = stepResults.filter(r => r.status === 'FAILED').length
    const skipCount = stepResults.filter(r => r.status === 'SKIPPED').length
    const totalSteps = stepResults.length
    const passRate = totalSteps > 0 ? Math.round((passCount / totalSteps) * 100) : 0
    const statusColor = status === 'PASSED' ? '#22c55e' : status === 'FAILED' ? '#ef4444' : '#f59e0b'
    const generatedAt = new Date().toLocaleString()

    const stepRows = stepResults.map(r => {
      const ts = r.testStep
      const sc = statusColor_(r.status)
      const badge = `<span style="background:${sc.bg};color:${sc.fg};padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600">${r.status}</span>`
      const errHtml = r.errorMessage
        ? `<div style="margin-top:6px;background:#fff1f2;border-left:3px solid #ef4444;padding:6px 10px;font-size:12px;color:#991b1b;white-space:pre-wrap;word-break:break-word">${escHtml(r.errorMessage)}</div>`
        : ''
      const screenshotHtml = r.screenshot
        ? `<div style="margin-top:6px"><img src="data:image/png;base64,${r.screenshot.data || ''}" alt="screenshot" style="max-width:100%;border:1px solid #e5e7eb;border-radius:4px" loading="lazy"/></div>`
        : ''
      return `
        <tr>
          <td style="padding:8px 12px;color:#6b7280;font-size:12px;vertical-align:top">${ts.stepNumber}</td>
          <td style="padding:8px 12px;font-size:12px;vertical-align:top">
            <span style="background:#eff6ff;color:#1d4ed8;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:600">${escHtml(ts.type)}</span>
          </td>
          <td style="padding:8px 12px;font-size:13px;vertical-align:top;color:#1f2937">${escHtml(ts.description || '—')}</td>
          <td style="padding:8px 12px;font-size:12px;vertical-align:top;color:#6b7280;word-break:break-all">${escHtml(ts.selector || '')}</td>
          <td style="padding:8px 12px;font-size:12px;vertical-align:top;color:#6b7280;word-break:break-all">${escHtml(ts.value || '')}</td>
          <td style="padding:8px 12px;vertical-align:top">${badge}${errHtml}${screenshotHtml}</td>
        </tr>`
    }).join('')

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Execution Report — ${escHtml(scenario.name)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; color: #1f2937; }
  .page { max-width: 1100px; margin: 32px auto; padding: 0 16px 64px; }
  h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
  .meta { font-size: 13px; color: #6b7280; margin-bottom: 24px; }
  .cards { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 28px; }
  .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px 22px; flex: 1 1 160px; }
  .card-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
  .card-value { font-size: 24px; font-weight: 700; }
  .section-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
  thead tr { background: #f3f4f6; }
  th { padding: 10px 12px; font-size: 12px; font-weight: 600; color: #374151; text-align: left; border-bottom: 1px solid #e5e7eb; }
  tr:not(:last-child) td { border-bottom: 1px solid #f3f4f6; }
  .err-box { background: #fff1f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 16px; margin-top: 24px; color: #991b1b; font-size: 13px; }
  .progress-bar-outer { background: #e5e7eb; border-radius: 9999px; height: 8px; overflow: hidden; margin-bottom: 6px; }
  .progress-bar-inner { height: 8px; border-radius: 9999px; background: ${statusColor}; transition: width 0.3s; }
  @media print { body { background: #fff; } .page { margin: 0; } }
</style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px 28px;margin-bottom:24px">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
      <div>
        <h1>${escHtml(scenario.name)}</h1>
        <div class="meta">${escHtml(scenario.url || '')} &bull; Generated ${generatedAt}</div>
      </div>
      <span style="background:${statusColor};color:#fff;padding:6px 18px;border-radius:9999px;font-size:14px;font-weight:700">${status}</span>
    </div>
    <div style="margin-top:12px">
      <div class="progress-bar-outer"><div class="progress-bar-inner" style="width:${passRate}%"></div></div>
      <div style="font-size:12px;color:#6b7280">${passRate}% passed (${passCount}/${totalSteps} steps)</div>
    </div>
  </div>

  <!-- Summary cards -->
  <div class="cards">
    <div class="card">
      <div class="card-label">Total Steps</div>
      <div class="card-value">${totalSteps}</div>
    </div>
    <div class="card">
      <div class="card-label">Passed</div>
      <div class="card-value" style="color:#22c55e">${passCount}</div>
    </div>
    <div class="card">
      <div class="card-label">Failed</div>
      <div class="card-value" style="color:#ef4444">${failCount}</div>
    </div>
    <div class="card">
      <div class="card-label">Skipped</div>
      <div class="card-value" style="color:#f59e0b">${skipCount}</div>
    </div>
    <div class="card">
      <div class="card-label">Duration</div>
      <div class="card-value" style="font-size:18px">${duration}</div>
    </div>
    <div class="card">
      <div class="card-label">Browser</div>
      <div class="card-value" style="font-size:16px">${escHtml(browser || 'chromium')}${headless ? '<span style="font-size:11px;font-weight:400;color:#6b7280;margin-left:4px">(headless)</span>' : ''}</div>
    </div>
    <div class="card">
      <div class="card-label">Start Time</div>
      <div class="card-value" style="font-size:14px">${startTime ? new Date(startTime).toLocaleString() : '—'}</div>
    </div>
  </div>

  ${errorMessage ? `<div class="err-box"><strong>Error:</strong> ${escHtml(errorMessage)}</div><br/>` : ''}

  <!-- Steps table -->
  <div class="section-title">Test Steps</div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Type</th>
        <th>Description</th>
        <th>Selector</th>
        <th>Value</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${stepRows || '<tr><td colspan="6" style="padding:16px;text-align:center;color:#6b7280">No step results</td></tr>'}
    </tbody>
  </table>
</div>
</body>
</html>`
  },

  /**
   * Generate PDF bytes from an HTML report using headless Chromium.
   */
  async buildPdf(htmlContent) {
    let browser
    try {
      browser = await firefox.launch({ headless: true })
      const page = await browser.newPage()
      await page.setContent(htmlContent, { waitUntil: 'networkidle' })
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' }
      })
      return pdfBuffer
    } finally {
      if (browser) await browser.close()
    }
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function statusColor_(status) {
  switch (status) {
    case 'PASSED':  return { bg: '#dcfce7', fg: '#16a34a' }
    case 'FAILED':  return { bg: '#fee2e2', fg: '#dc2626' }
    case 'SKIPPED': return { bg: '#fef3c7', fg: '#d97706' }
    default:        return { bg: '#f3f4f6', fg: '#374151' }
  }
}
