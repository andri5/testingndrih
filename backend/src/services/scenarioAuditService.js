import { prisma } from '../lib/prisma.js'

function trunc(v, max = 500) {
  if (v == null) return null
  const s = typeof v === 'string' ? v : JSON.stringify(v)
  return s.length > max ? `${s.slice(0, max)}…` : s
}

export async function writeScenarioAudit(scenarioId, userId, entries = []) {
  const rows = (entries || [])
    .filter((e) => e && e.action)
    .map((e) => ({
      scenarioId,
      userId,
      action: String(e.action),
      field: e.field != null ? String(e.field) : null,
      oldValue: trunc(e.oldValue),
      newValue: trunc(e.newValue),
    }))
  if (!rows.length) return []
  await prisma.scenarioAuditLog.createMany({ data: rows })
  return rows
}

export async function listScenarioHistory(scenarioId, userId, { limit = 50, offset = 0 } = {}) {
  const scenario = await prisma.scenario.findFirst({
    where: { id: scenarioId, userId },
    select: { id: true },
  })
  if (!scenario) {
    throw Object.assign(new Error('Scenario not found'), { status: 404 })
  }

  const take = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100)
  const skip = Math.max(parseInt(offset, 10) || 0, 0)

  const [logs, total] = await Promise.all([
    prisma.scenarioAuditLog.findMany({
      where: { scenarioId },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.scenarioAuditLog.count({ where: { scenarioId } }),
  ])

  return { logs, total, limit: take, offset: skip }
}
