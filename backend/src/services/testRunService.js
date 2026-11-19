import { prisma } from '../lib/prisma.js'
import { startManualExecution } from './manualExecutionService.js'

const ITEM_STATUSES = new Set(['NOT_RUN', 'PASSED', 'FAILED', 'BLOCKED', 'SKIPPED'])
const NOTES_REQUIRED = new Set(['FAILED', 'BLOCKED'])

function httpError(message, status = 400) {
  return Object.assign(new Error(message), { status })
}

function progressFromItems(items = []) {
  const total = items.length
  const counts = {
    notRun: 0,
    passed: 0,
    failed: 0,
    blocked: 0,
    skipped: 0,
  }
  for (const it of items) {
    if (it.status === 'PASSED') counts.passed++
    else if (it.status === 'FAILED') counts.failed++
    else if (it.status === 'BLOCKED') counts.blocked++
    else if (it.status === 'SKIPPED') counts.skipped++
    else counts.notRun++
  }
  const done = total - counts.notRun
  const percentComplete = total > 0 ? Math.round((done / total) * 100) : 0
  return { total, done, percentComplete, ...counts }
}

const itemInclude = {
  scenario: {
    select: {
      id: true,
      name: true,
      scenarioCode: true,
      priority: true,
      caseType: true,
      steps: true,
      url: true,
      folderId: true,
      folder: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true, email: true } },
    },
  },
  assignee: { select: { id: true, name: true, email: true } },
}

async function getOwnedRun(userId, runId) {
  const run = await prisma.testRun.findFirst({
    where: { id: runId, createdById: userId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      items: {
        orderBy: { sortOrder: 'asc' },
        include: itemInclude,
      },
    },
  })
  if (!run) throw httpError('Test run not found', 404)
  return run
}

function withProgress(run) {
  const progress = progressFromItems(run.items || [])
  return { ...run, progress }
}

export async function createTestRun(userId, data = {}) {
  const title = String(data.title || '').trim()
  if (!title) throw httpError('Title is required')

  const scenarioIds = [...new Set((data.scenarioIds || []).filter(Boolean))]
  if (!scenarioIds.length) throw httpError('Select at least one test case')

  const owned = await prisma.scenario.findMany({
    where: { userId, id: { in: scenarioIds } },
    select: { id: true, ownerId: true },
  })
  if (owned.length !== scenarioIds.length) {
    throw httpError('One or more scenarios were not found', 404)
  }

  const assigneeId = data.assigneeId || null
  if (assigneeId) {
    const user = await prisma.user.findFirst({
      where: { id: assigneeId, isActive: true },
      select: { id: true },
    })
    if (!user) throw httpError('Assignee not found', 404)
  }

  const byId = Object.fromEntries(owned.map((s) => [s.id, s]))

  const run = await prisma.testRun.create({
    data: {
      title,
      description: data.description ? String(data.description).trim() : null,
      createdById: userId,
      items: {
        create: scenarioIds.map((scenarioId, idx) => ({
          scenarioId,
          sortOrder: idx,
          assigneeId: assigneeId || byId[scenarioId]?.ownerId || userId,
        })),
      },
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      items: { orderBy: { sortOrder: 'asc' }, include: itemInclude },
    },
  })

  return withProgress(run)
}

export async function listTestRuns(userId, { status, limit = 20, offset = 0 } = {}) {
  const where = { createdById: userId }
  if (status === 'OPEN' || status === 'CLOSED') where.status = status

  const take = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100)
  const skip = Math.max(parseInt(offset, 10) || 0, 0)

  const [rows, total] = await Promise.all([
    prisma.testRun.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        items: { select: { status: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.testRun.count({ where }),
  ])

  const runs = rows.map((r) => {
    const progress = progressFromItems(r.items)
    const { items, ...rest } = r
    return { ...rest, progress }
  })

  return { runs, total, limit: take, offset: skip }
}

export async function getTestRun(userId, runId) {
  return withProgress(await getOwnedRun(userId, runId))
}

export async function closeTestRun(userId, runId) {
  const run = await getOwnedRun(userId, runId)
  if (run.status === 'CLOSED') return withProgress(run)

  const updated = await prisma.testRun.update({
    where: { id: runId },
    data: { status: 'CLOSED', closedAt: new Date() },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      items: { orderBy: { sortOrder: 'asc' }, include: itemInclude },
    },
  })
  return withProgress(updated)
}

export async function updateTestRunItem(userId, runId, itemId, payload = {}) {
  const run = await getOwnedRun(userId, runId)
  if (run.status === 'CLOSED') {
    throw httpError('Test run is closed (sealed). Results cannot be changed.', 400)
  }

  const item = run.items.find((i) => i.id === itemId)
  if (!item) throw httpError('Run item not found', 404)

  const data = {}
  if (payload.status != null) {
    const status = String(payload.status).toUpperCase()
    if (!ITEM_STATUSES.has(status)) {
      throw httpError('status must be NOT_RUN, PASSED, FAILED, BLOCKED, or SKIPPED')
    }
    data.status = status
    const notes = payload.notes != null ? String(payload.notes).trim() : item.notes || ''
    if (NOTES_REQUIRED.has(status) && !notes) {
      throw httpError(`Notes are required when marking as ${status}`)
    }
    if (payload.notes != null) data.notes = notes || null
  } else if (payload.notes != null) {
    data.notes = String(payload.notes).trim() || null
  }

  if (payload.assigneeId !== undefined) {
    if (payload.assigneeId === null || payload.assigneeId === '') {
      data.assigneeId = null
    } else {
      const user = await prisma.user.findFirst({
        where: { id: payload.assigneeId, isActive: true },
        select: { id: true },
      })
      if (!user) throw httpError('Assignee not found', 404)
      data.assigneeId = user.id
    }
  }

  await prisma.testRunItem.update({ where: { id: itemId }, data })
  return withProgress(await getOwnedRun(userId, runId))
}

export async function addCasesToRun(userId, runId, scenarioIds = []) {
  const run = await getOwnedRun(userId, runId)
  if (run.status === 'CLOSED') throw httpError('Test run is closed', 400)

  const ids = [...new Set((scenarioIds || []).filter(Boolean))]
  if (!ids.length) throw httpError('No scenarios provided')

  const owned = await prisma.scenario.findMany({
    where: { userId, id: { in: ids } },
    select: { id: true, ownerId: true },
  })
  if (!owned.length) throw httpError('No valid scenarios', 404)

  const existing = new Set(run.items.map((i) => i.scenarioId))
  const toAdd = owned.filter((s) => !existing.has(s.id))
  if (!toAdd.length) return withProgress(run)

  const startOrder = run.items.length
  await prisma.testRunItem.createMany({
    data: toAdd.map((s, idx) => ({
      testRunId: runId,
      scenarioId: s.id,
      sortOrder: startOrder + idx,
      assigneeId: s.ownerId || userId,
    })),
  })

  return withProgress(await getOwnedRun(userId, runId))
}

export async function removeRunItem(userId, runId, itemId) {
  const run = await getOwnedRun(userId, runId)
  if (run.status === 'CLOSED') throw httpError('Test run is closed', 400)
  const item = run.items.find((i) => i.id === itemId)
  if (!item) throw httpError('Run item not found', 404)
  await prisma.testRunItem.delete({ where: { id: itemId } })
  return withProgress(await getOwnedRun(userId, runId))
}

/**
 * Start (or resume) a manual checklist for a run item and link executionId.
 */
export async function startItemManualChecklist(userId, runId, itemId) {
  const run = await getOwnedRun(userId, runId)
  if (run.status === 'CLOSED') throw httpError('Test run is closed', 400)
  const item = run.items.find((i) => i.id === itemId)
  if (!item) throw httpError('Run item not found', 404)

  try {
    const started = await startManualExecution(userId, item.scenarioId)
    await prisma.testRunItem.update({
      where: { id: itemId },
      data: { executionId: started.execution.id, status: 'NOT_RUN' },
    })
    return {
      run: withProgress(await getOwnedRun(userId, runId)),
      execution: started.execution,
      scenarioId: item.scenarioId,
    }
  } catch (err) {
    if (err.status === 409) {
      // Already running — link existing if possible
      const active = await prisma.execution.findFirst({
        where: {
          userId,
          scenarioId: item.scenarioId,
          testType: 'MANUAL',
          status: 'RUNNING',
        },
        select: { id: true },
      })
      if (active) {
        await prisma.testRunItem.update({
          where: { id: itemId },
          data: { executionId: active.id },
        })
      }
      return {
        run: withProgress(await getOwnedRun(userId, runId)),
        execution: active ? { id: active.id } : null,
        scenarioId: item.scenarioId,
        resumed: true,
      }
    }
    throw err
  }
}

export async function bulkAssignScenarioOwner(userId, scenarioIds = [], ownerId) {
  const ids = [...new Set((scenarioIds || []).filter(Boolean))]
  if (!ids.length) throw httpError('No scenarios selected')
  if (!ownerId) throw httpError('ownerId is required')

  const owner = await prisma.user.findFirst({
    where: { id: ownerId, isActive: true },
    select: { id: true, name: true, email: true },
  })
  if (!owner) throw httpError('Owner not found', 404)

  const owned = await prisma.scenario.findMany({
    where: { userId, id: { in: ids } },
    select: { id: true, ownerId: true },
  })
  if (!owned.length) throw httpError('No scenarios found', 404)

  await prisma.scenario.updateMany({
    where: { userId, id: { in: owned.map((s) => s.id) } },
    data: { ownerId: owner.id },
  })

  // Audit each change
  const auditRows = owned
    .filter((s) => s.ownerId !== owner.id)
    .map((s) => ({
      scenarioId: s.id,
      userId,
      action: 'update',
      field: 'ownerId',
      oldValue: s.ownerId || null,
      newValue: owner.id,
    }))
  if (auditRows.length) {
    await prisma.scenarioAuditLog.createMany({ data: auditRows })
  }

  return { updated: owned.length, owner }
}
