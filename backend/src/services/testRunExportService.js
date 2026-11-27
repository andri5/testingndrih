/**
 * Test Run report export — Excel (.xlsx) and PDF (via HTML → Chromium).
 */
import ExcelJS from 'exceljs'
import { getTestRun } from './testRunService.js'
import { reportService } from './reportService.js'

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatWhen(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('id-ID')
  } catch {
    return String(value)
  }
}

function groupByFolder(items = []) {
  const map = new Map()
  for (const item of items) {
    const folder = item.scenario?.folder
    const key = folder?.id || '__unfiled__'
    const label = folder?.name || 'No folder'
    if (!map.has(key)) map.set(key, { key, label, items: [] })
    map.get(key).items.push(item)
  }
  const groups = [...map.values()]
  groups.sort((a, b) => {
    if (a.key === '__unfiled__') return 1
    if (b.key === '__unfiled__') return -1
    return a.label.localeCompare(b.label, 'id')
  })
  return groups
}

function statusColor(status) {
  switch (status) {
    case 'PASSED':
      return '#059669'
    case 'FAILED':
      return '#DC2626'
    case 'BLOCKED':
      return '#D97706'
    case 'SKIPPED':
      return '#64748B'
    default:
      return '#94A3B8'
  }
}

export async function buildTestRunExcel(userId, runId) {
  const run = await getTestRun(userId, runId)
  const p = run.progress || {}

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Test Sambil Ngopi'
  workbook.created = new Date()

  const summary = workbook.addWorksheet('Summary', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })
  summary.columns = [
    { header: 'Field', key: 'field', width: 22 },
    { header: 'Value', key: 'value', width: 48 },
  ]
  summary.getRow(1).font = { bold: true }
  summary.addRows([
    { field: 'Title', value: run.title },
    { field: 'Status', value: run.status },
    { field: 'Created', value: formatWhen(run.createdAt) },
    { field: 'Closed', value: formatWhen(run.closedAt) },
    { field: 'Created by', value: run.createdBy?.name || run.createdBy?.email || '' },
    { field: 'Total cases', value: p.total ?? 0 },
    { field: 'Passed', value: p.passed ?? 0 },
    { field: 'Failed', value: p.failed ?? 0 },
    { field: 'Blocked', value: p.blocked ?? 0 },
    { field: 'Skipped', value: p.skipped ?? 0 },
    { field: 'Not run', value: p.notRun ?? 0 },
    { field: 'Progress %', value: p.percentComplete ?? 0 },
  ])

  const cases = workbook.addWorksheet('Cases', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })
  cases.columns = [
    { header: '#', key: 'num', width: 6 },
    { header: 'Feature folder', key: 'folder', width: 28 },
    { header: 'Test case', key: 'name', width: 40 },
    { header: 'Code', key: 'code', width: 14 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Type', key: 'type', width: 14 },
    { header: 'PIC', key: 'pic', width: 22 },
    { header: 'Result', key: 'result', width: 12 },
    { header: 'Notes', key: 'notes', width: 36 },
  ]
  cases.getRow(1).font = { bold: true }
  cases.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE2E8F0' },
  }

  const groups = groupByFolder(run.items || [])
  let n = 0
  for (const group of groups) {
    for (const item of group.items) {
      n += 1
      cases.addRow({
        num: n,
        folder: group.label,
        name: item.scenario?.name || '',
        code: item.scenario?.scenarioCode || '',
        priority: item.scenario?.priority || '',
        type: item.scenario?.caseType || '',
        pic: item.assignee?.name || item.assignee?.email || '',
        result: item.status,
        notes: item.notes || '',
      })
    }
  }

  return {
    buffer: await workbook.xlsx.writeBuffer(),
    filename: `test-run-${slugify(run.title)}-${run.id.slice(0, 8)}.xlsx`,
    run,
  }
}

export function buildTestRunHtml(run) {
  const p = run.progress || {}
  const groups = groupByFolder(run.items || [])
  const pct = p.percentComplete ?? 0

  const rowsHtml = groups
    .map((group) => {
      const header = `<tr class="group"><td colspan="5">${escapeHtml(group.label)} (${group.items.length})</td></tr>`
      const body = group.items
        .map((item, idx) => {
          const color = statusColor(item.status)
          return `<tr>
            <td class="num">${idx + 1}</td>
            <td>
              <div class="name">${escapeHtml(item.scenario?.name || '—')}</div>
              <div class="meta">${escapeHtml(item.scenario?.priority || '')} · ${escapeHtml(item.scenario?.caseType || '')}</div>
            </td>
            <td>${escapeHtml(item.assignee?.name || item.assignee?.email || '—')}</td>
            <td><span class="badge" style="color:${color};border-color:${color}33;background:${color}14">${escapeHtml(item.status)}</span></td>
            <td class="notes">${escapeHtml(item.notes || '')}</td>
          </tr>`
        })
        .join('')
      return header + body
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(run.title)} — Test Run Report</title>
<style>
  body{font-family:Segoe UI,system-ui,sans-serif;color:#0f172a;margin:0;padding:24px;background:#fff}
  h1{font-size:22px;margin:0 0 4px}
  .sub{color:#64748b;font-size:12px;margin:0 0 16px}
  .stats{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;font-size:12px;color:#475569}
  .bar{height:8px;background:#e2e8f0;border-radius:999px;overflow:hidden;margin-bottom:20px}
  .bar>i{display:block;height:100%;background:#0d9488;width:${pct}%}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:#64748b;border-bottom:1px solid #e2e8f0;padding:8px 6px}
  td{border-bottom:1px solid #f1f5f9;padding:8px 6px;vertical-align:top}
  tr.group td{background:#f8fafc;font-weight:600;padding:10px 6px}
  .num{color:#94a3b8;width:28px}
  .name{font-weight:600}
  .meta{color:#94a3b8;font-size:10px;margin-top:2px}
  .notes{color:#64748b;max-width:180px}
  .badge{display:inline-block;font-weight:700;font-size:10px;padding:2px 8px;border-radius:999px;border:1px solid}
  .foot{margin-top:20px;font-size:10px;color:#94a3b8}
</style>
</head>
<body>
  <h1>${escapeHtml(run.title)}</h1>
  <p class="sub">Test Run report · ${escapeHtml(run.status)} · Generated ${escapeHtml(formatWhen(new Date()))}</p>
  <div class="stats">
    <span>${p.passed || 0}P</span>
    <span>${p.failed || 0}F</span>
    <span>${p.blocked || 0}B</span>
    <span>${p.skipped || 0}S</span>
    <span>${p.notRun || 0} not run</span>
    <span>${pct}%</span>
  </div>
  <div class="bar"><i></i></div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Test case</th>
        <th>PIC</th>
        <th>Result</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || '<tr><td colspan="5">Belum ada case</td></tr>'}
    </tbody>
  </table>
  <p class="foot">Test Sambil Ngopi · ${escapeHtml(run.createdBy?.name || run.createdBy?.email || '')}</p>
</body>
</html>`
}

export async function buildTestRunPdf(userId, runId) {
  const run = await getTestRun(userId, runId)
  const html = buildTestRunHtml(run)
  const buffer = await reportService.buildPdf(html)
  return {
    buffer,
    filename: `test-run-${slugify(run.title)}-${run.id.slice(0, 8)}.pdf`,
    run,
  }
}

function slugify(value) {
  return String(value || 'run')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'run'
}
