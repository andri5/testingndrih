import ExcelJS from 'exceljs'
import { prisma } from '../lib/prisma.js'

/**
 * Build an .xlsx buffer of execution history for the user (optional scenario filter).
 */
export async function buildExecutionReportWorkbook(userId, { scenarioId = null, limit = 1000 } = {}) {
  const where = {
    userId,
    ...(scenarioId ? { scenarioId } : {}),
  }

  const executions = await prisma.execution.findMany({
    where,
    include: {
      scenario: { select: { name: true, url: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: Math.min(Math.max(limit, 1), 5000),
  })

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Test Sambil Ngopi'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Execution Report', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  sheet.columns = [
    { header: 'Scenario', key: 'scenario', width: 32 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Duration (ms)', key: 'duration', width: 14 },
    { header: 'Passed Steps', key: 'passed', width: 14 },
    { header: 'Failed Steps', key: 'failed', width: 14 },
    { header: 'Total Steps', key: 'total', width: 12 },
    { header: 'Browser', key: 'browser', width: 12 },
    { header: 'Start Time', key: 'start', width: 22 },
    { header: 'End Time', key: 'end', width: 22 },
    { header: 'URL', key: 'url', width: 40 },
    { header: 'Error', key: 'error', width: 40 },
  ]

  sheet.getRow(1).font = { bold: true }
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE2E8F0' },
  }

  for (const e of executions) {
    sheet.addRow({
      scenario: e.scenario?.name || '',
      status: e.status,
      duration: e.duration ?? 0,
      passed: e.passedSteps ?? 0,
      failed: e.failedSteps ?? 0,
      total: e.totalSteps ?? 0,
      browser: e.browser || '',
      start: e.startTime ? new Date(e.startTime).toISOString() : '',
      end: e.endTime ? new Date(e.endTime).toISOString() : '',
      url: e.scenario?.url || '',
      error: e.errorMessage || '',
    })
  }

  return workbook.xlsx.writeBuffer()
}
