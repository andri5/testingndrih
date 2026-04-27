import { chromium } from 'playwright'
import { prisma } from '../lib/prisma.js'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const SCREENSHOTS_DIR = path.resolve(__dir, '../../uploads/screenshots')

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
  async buildHtml(execution) {
    const { scenario, stepResults, status, startTime, endTime, errorMessage, browser, headless } = execution
    const duration = startTime && endTime
      ? ((new Date(endTime) - new Date(startTime)) / 1000).toFixed(2) + 's'
      : '—'
    const passCount = stepResults.filter(r => r.status === 'PASSED').length
    const failCount = stepResults.filter(r => r.status === 'FAILED').length
    const skipCount = stepResults.filter(r => r.status === 'SKIPPED').length
    const totalSteps = stepResults.length
    const passRate = totalSteps > 0 ? Math.round((passCount / totalSteps) * 100) : 0
    const statusColor  = status === 'PASSED' ? '#16a34a' : status === 'FAILED' ? '#dc2626' : '#d97706'
    const statusBg     = status === 'PASSED' ? '#f0fdf4' : status === 'FAILED' ? '#fef2f2' : '#fffbeb'
    const accentLight  = status === 'PASSED' ? '#bbf7d0' : status === 'FAILED' ? '#fecaca' : '#fde68a'
    const generatedAt  = new Date().toLocaleString()
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' }) : '—'
    const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit', second:'2-digit' }) : '—'
    const reportDate = startTime ? fmtDate(startTime) : fmtDate(new Date())

    // ── Browser icon (inline SVG) ────────────────────────────────────────────
    const browserName = (browser || 'chromium').toLowerCase()
    const browserLabel = browserName.includes('firefox') ? 'Firefox'
      : browserName.includes('webkit') || browserName.includes('safari') ? 'WebKit / Safari'
      : 'Chromium'
    const browserIcon = browserName.includes('firefox')
      ? `<svg width="28" height="28" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="15" fill="#FF9500"/><circle cx="16" cy="16" r="9" fill="#FF5722"/><circle cx="16" cy="16" r="5" fill="#FFC107"/></svg>`
      : browserName.includes('webkit') || browserName.includes('safari')
      ? `<svg width="28" height="28" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="wg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#00C8FF"/><stop offset="100%" stop-color="#1E90FF"/></linearGradient></defs><circle cx="16" cy="16" r="15" fill="url(#wg)"/><circle cx="16" cy="16" r="8" fill="none" stroke="white" stroke-width="1.5"/><line x1="16" y1="8" x2="16" y2="24" stroke="white" stroke-width="1"/><line x1="8" y1="16" x2="24" y2="16" stroke="white" stroke-width="1"/><polygon points="16,7 19,19 16,17 13,19" fill="white"/></svg>`
      : `<svg width="28" height="28" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="15" fill="#4285F4"/><circle cx="16" cy="16" r="7" fill="white"/><circle cx="16" cy="16" r="4.5" fill="#4285F4"/><path d="M16 9h10.4A15.96 15.96 0 0016 0v9z" fill="#EA4335"/><path d="M26.4 23A16 16 0 0026.4 9H16l5.2 9z" fill="#FBBC05"/><path d="M21.2 18l-5.2 9A16 16 0 005.6 23l5.2-9H21.2z" fill="#34A853"/></svg>`

    // ── Donut / pie chart (pure inline SVG) ──────────────────────────────────
    const pieHtml = (() => {
      const R = 52, cx = 70, cy = 70
      const segments = [
        { count: passCount, color: '#22c55e', label: 'Passed' },
        { count: failCount, color: '#ef4444', label: 'Failed' },
        { count: skipCount, color: '#f59e0b', label: 'Skipped' },
      ]
      const active = segments.filter(s => s.count > 0)
      let startAngle = -Math.PI / 2
      const paths = active.length === 1
        ? `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${active[0].color}"/>`
        : active.map(seg => {
          const angle = (seg.count / totalSteps) * 2 * Math.PI
          const endAngle = startAngle + angle
          const x1 = cx + R * Math.cos(startAngle), y1 = cy + R * Math.sin(startAngle)
          const x2 = cx + R * Math.cos(endAngle),   y2 = cy + R * Math.sin(endAngle)
          const d = `M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${R},${R} 0 ${angle > Math.PI ? 1 : 0},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`
          startAngle = endAngle
          return `<path d="${d}" fill="${seg.color}"/>`
        }).join('')
      const legendRows = segments.filter(s => s.count > 0).map(seg =>
        `<tr>
          <td style="padding:4px 0"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${seg.color};vertical-align:middle"></span></td>
          <td style="padding:4px 8px;font-size:12px;color:#374151">${seg.label}</td>
          <td style="padding:4px 0;font-size:12px;font-weight:700;color:#111827">${seg.count}</td>
          <td style="padding:4px 0 4px 6px;font-size:11px;color:#6b7280">${Math.round(seg.count/totalSteps*100)}%</td>
        </tr>`
      ).join('')
      return `
        <svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0">
          ${paths}
          <circle cx="${cx}" cy="${cy}" r="30" fill="white"/>
          <text x="${cx}" y="${cy - 5}" text-anchor="middle" font-size="17" font-weight="800" fill="#111827">${passRate}%</text>
          <text x="${cx}" y="${cy + 13}" text-anchor="middle" font-size="10" fill="#6b7280">passed</text>
        </svg>
        <table style="border:none;border-collapse:collapse;background:transparent;margin-left:8px">
          <tbody>${legendRows}</tbody>
        </table>`
    })()

    // ── Pre-load screenshots from disk as base64 ────────────────────────────
    const screenshotMap = {}
    for (const r of stepResults) {
      if (r.screenshot?.url) {
        const filename = r.screenshot.url.split('/').pop()
        try {
          const buf = await fs.readFile(path.join(SCREENSHOTS_DIR, filename))
          screenshotMap[r.id] = buf.toString('base64')
        } catch { /* file missing — skip */ }
      }
    }

    // ── Step rows ─────────────────────────────────────────────────────────────
    const stepRows = stepResults.map((r, i) => {
      const ts = r.testStep
      const sc = statusColor_(r.status)
      const rowBg = i % 2 === 0 ? '#ffffff' : '#f9fafb'
      const badge = `<span style="display:inline-block;background:${sc.bg};color:${sc.fg};padding:2px 9px;border-radius:9999px;font-size:10px;font-weight:700;letter-spacing:.3px">${r.status}</span>`
      const errHtml = r.errorMessage
        ? `<div style="margin-top:5px;background:#fff1f2;border-left:3px solid #ef4444;padding:5px 9px;font-size:11px;color:#991b1b;white-space:pre-wrap;word-break:break-word;border-radius:0 4px 4px 0">${escHtml(r.errorMessage)}</div>`
        : ''
      const b64 = screenshotMap[r.id]
      const screenshotHtml = b64
        ? `<div style="margin-top:6px">
            <img class="sc-thumb" src="data:image/png;base64,${b64}" alt="screenshot"
              style="max-height:72px;width:auto;max-width:120px;border:1px solid #e2e8f0;border-radius:4px;cursor:zoom-in;display:block"
              onclick="window.__lb&&window.__lb(this.src)"
            />
          </div>`
        : ''
      return `<tr style="background:${rowBg}">
        <td style="padding:9px 10px;color:#9ca3af;font-size:11px;font-weight:600;text-align:center;width:32px">${ts.stepNumber}</td>
        <td style="padding:9px 10px;width:90px"><span style="background:#eff6ff;color:#1d4ed8;padding:2px 7px;border-radius:5px;font-size:10px;font-weight:700;white-space:nowrap">${escHtml(ts.type)}</span></td>
        <td style="padding:9px 10px;font-size:12px;color:#1f2937">${escHtml(ts.description || '—')}</td>
        <td style="padding:9px 10px;font-size:11px;color:#6b7280;word-break:break-all;max-width:140px">${escHtml(ts.selector || '')}</td>
        <td style="padding:9px 10px;font-size:11px;color:#6b7280;word-break:break-all;max-width:100px">${escHtml(ts.value || '')}</td>
        <td style="padding:9px 10px">${badge}${errHtml}${screenshotHtml}</td>
      </tr>`
    }).join('')

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Test Report — ${escHtml(scenario.name)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f1f5f9; color: #1e293b; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .wrap { max-width: 960px; margin: 0 auto; padding: 28px 24px 56px; }
  table { width: 100%; border-collapse: collapse; }
  @media print { body { background: #f1f5f9; } .wrap { padding: 16px; } }
</style>
</head>
<body>
<div class="wrap">

  <!-- ═══ HERO HEADER ═══════════════════════════════════════════════════════ -->
  <div style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);border-radius:16px;padding:28px 32px;margin-bottom:20px;position:relative;overflow:hidden">
    <div style="position:absolute;top:-30px;right:-30px;width:160px;height:160px;border-radius:50%;background:${statusColor};opacity:.12"></div>
    <div style="position:absolute;bottom:-20px;right:60px;width:80px;height:80px;border-radius:50%;background:${statusColor};opacity:.08"></div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;position:relative">
      <div>
        <div style="font-size:11px;font-weight:600;letter-spacing:1.5px;color:#94a3b8;text-transform:uppercase;margin-bottom:8px">Execution Report</div>
        <div style="font-size:20px;font-weight:800;color:#f8fafc;line-height:1.3;max-width:500px">${escHtml(scenario.name)}</div>
        <div style="margin-top:6px;font-size:12px;color:#94a3b8">${escHtml(scenario.url || '')}</div>
        <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px">
          <span style="display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:6px;padding:4px 9px;font-size:11px;color:#cbd5e1">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="3" width="14" height="11" rx="2" stroke="#94a3b8" stroke-width="1.5"/><path d="M5 1v3M11 1v3M1 7h14" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/></svg>
            ${reportDate}
          </span>
          <span style="display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:6px;padding:4px 9px;font-size:11px;color:#cbd5e1">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6.5" stroke="#94a3b8" stroke-width="1.5"/><path d="M8 4.5V8l2.5 2" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Mulai: <strong style="color:#f1f5f9">${fmtTime(startTime)}</strong>
          </span>
          <span style="display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:6px;padding:4px 9px;font-size:11px;color:#cbd5e1">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6.5" stroke="#94a3b8" stroke-width="1.5"/><path d="M8 4.5V8l2.5 2" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8" cy="8" r="1" fill="#94a3b8"/></svg>
            Selesai: <strong style="color:#f1f5f9">${fmtTime(endTime)}</strong>
          </span>
          <span style="display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:6px;padding:4px 9px;font-size:11px;color:#cbd5e1">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 2v4l2.5 2.5" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="9" r="5.5" stroke="#94a3b8" stroke-width="1.5"/></svg>
            Durasi: <strong style="color:#f1f5f9">${duration}</strong>
          </span>
        </div>
      </div>
      <div style="text-align:center;flex-shrink:0">
        <div style="background:${statusColor};color:#fff;font-size:13px;font-weight:800;letter-spacing:.5px;padding:7px 20px;border-radius:999px;margin-bottom:8px">${status}</div>
        <div style="font-size:28px;font-weight:900;color:#fff;line-height:1">${passRate}%</div>
        <div style="font-size:11px;color:#94a3b8;margin-top:2px">pass rate</div>
      </div>
    </div>
    <!-- progress bar -->
    <div style="margin-top:18px;background:rgba(255,255,255,.12);border-radius:999px;height:6px;overflow:hidden">
      <div style="height:6px;border-radius:999px;background:${statusColor};width:${passRate}%"></div>
    </div>
    <div style="margin-top:5px;font-size:11px;color:#94a3b8">${passCount} of ${totalSteps} steps passed</div>
  </div>

  <!-- ═══ STAT CARDS ROW ════════════════════════════════════════════════════ -->
  <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:20px">
    ${[
      { label:'Total',   value: totalSteps, color:'#1e293b' },
      { label:'Passed',  value: passCount,  color:'#16a34a' },
      { label:'Failed',  value: failCount,  color:'#dc2626' },
      { label:'Skipped', value: skipCount,  color:'#d97706' },
      { label:'Duration',value: duration,   color:'#1e293b', small: true },
      { label:'Start',   value: startTime ? new Date(startTime).toLocaleTimeString() : '—', color:'#1e293b', small: true },
    ].map(c => `
      <div style="background:#fff;border-radius:12px;padding:14px 16px;border:1px solid #e2e8f0;text-align:center">
        <div style="font-size:10px;font-weight:600;letter-spacing:.8px;color:#94a3b8;text-transform:uppercase;margin-bottom:6px">${c.label}</div>
        <div style="font-size:${c.small ? '16px' : '24px'};font-weight:800;color:${c.color};line-height:1">${c.value}</div>
      </div>`).join('')}
  </div>

  <!-- ═══ BROWSER + PIE CHART ROW ══════════════════════════════════════════ -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">

    <!-- Browser card -->
    <div style="background:#fff;border-radius:12px;padding:20px 24px;border:1px solid #e2e8f0;display:flex;align-items:center;gap:16px">
      ${browserIcon}
      <div>
        <div style="font-size:10px;font-weight:600;letter-spacing:.8px;color:#94a3b8;text-transform:uppercase;margin-bottom:4px">Browser</div>
        <div style="font-size:16px;font-weight:700;color:#1e293b">${browserLabel}</div>
        ${headless ? '<div style="font-size:11px;color:#94a3b8;margin-top:2px">Headless mode</div>' : ''}
      </div>
    </div>

    <!-- Pie chart card -->
    <div style="background:#fff;border-radius:12px;padding:20px 24px;border:1px solid #e2e8f0">
      <div style="font-size:10px;font-weight:600;letter-spacing:.8px;color:#94a3b8;text-transform:uppercase;margin-bottom:14px">Result Distribution</div>
      <div style="display:flex;align-items:center;gap:8px">
        ${pieHtml}
      </div>
    </div>
  </div>

  ${errorMessage ? `
  <div style="background:#fff1f2;border:1px solid #fecaca;border-radius:12px;padding:14px 18px;margin-bottom:20px;display:flex;gap:10px;align-items:flex-start">
    <span style="font-size:16px;flex-shrink:0">⚠️</span>
    <div><div style="font-size:12px;font-weight:700;color:#dc2626;margin-bottom:3px">Execution Error</div><div style="font-size:12px;color:#991b1b">${escHtml(errorMessage)}</div></div>
  </div>` : ''}

  <!-- ═══ STEPS TABLE ══════════════════════════════════════════════════════ -->
  <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#64748b;text-transform:uppercase;margin-bottom:10px">Test Steps</div>
  <div style="background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden">
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0">
          <th style="padding:10px;font-size:10px;font-weight:700;color:#64748b;letter-spacing:.5px;text-align:center;width:32px">#</th>
          <th style="padding:10px;font-size:10px;font-weight:700;color:#64748b;letter-spacing:.5px;text-align:left;width:90px">TYPE</th>
          <th style="padding:10px;font-size:10px;font-weight:700;color:#64748b;letter-spacing:.5px;text-align:left">DESCRIPTION</th>
          <th style="padding:10px;font-size:10px;font-weight:700;color:#64748b;letter-spacing:.5px;text-align:left;max-width:140px">SELECTOR</th>
          <th style="padding:10px;font-size:10px;font-weight:700;color:#64748b;letter-spacing:.5px;text-align:left;max-width:100px">VALUE</th>
          <th style="padding:10px;font-size:10px;font-weight:700;color:#64748b;letter-spacing:.5px;text-align:left">STATUS</th>
        </tr>
      </thead>
      <tbody>
        ${stepRows || '<tr><td colspan="6" style="padding:20px;text-align:center;color:#94a3b8;font-size:13px">No step results available</td></tr>'}
      </tbody>
    </table>
  </div>

  <!-- footer -->
  <div style="margin-top:28px;text-align:center;font-size:11px;color:#94a3b8">
    Generated by TestingNDRI &nbsp;·&nbsp; ${generatedAt}
  </div>

</div>

<!-- ═══ LIGHTBOX (HTML view only, ignored in PDF) ════════════════════════ -->
<dialog id="__lb" style="padding:0;border:none;border-radius:12px;box-shadow:0 25px 60px rgba(0,0,0,.55);background:#111;max-width:92vw;max-height:92vh">
  <img id="__lb_img" src="" alt="screenshot" style="display:block;max-width:90vw;max-height:88vh;border-radius:10px"/>
  <button id="__lb_close" style="position:absolute;top:10px;right:10px;background:rgba(0,0,0,.65);color:#fff;border:none;border-radius:50%;width:30px;height:30px;font-size:18px;line-height:1;cursor:pointer">×</button>
</dialog>
<script>
(function(){
  var d=document.getElementById('__lb'),img=document.getElementById('__lb_img'),btn=document.getElementById('__lb_close');
  if(!d)return;
  btn.onclick=function(){d.close();};
  d.onclick=function(e){if(e.target===d)d.close();};
  window.__lb=function(src){img.src=src;d.showModal();};
})();
</script>

</body>
</html>`
  },

  /**
   * Generate PDF bytes from an HTML report using headless Chromium.
   */
  async buildPdf(htmlContent) {
    let browser
    try {
      browser = await chromium.launch({ headless: true })
      const page = await browser.newPage()
      await page.setContent(htmlContent, { waitUntil: 'networkidle' })

      // Resize embedded screenshots via canvas to keep PDF file size small
      await page.evaluate(() => {
        const MAX_W = 500
        document.querySelectorAll('img.sc-thumb').forEach(img => {
          if (!img.naturalWidth || img.naturalWidth <= MAX_W) return
          const ratio = MAX_W / img.naturalWidth
          const c = document.createElement('canvas')
          c.width = Math.round(img.naturalWidth * ratio)
          c.height = Math.round(img.naturalHeight * ratio)
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
          img.src = c.toDataURL('image/jpeg', 0.72)
        })
      })

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
