/**
 * Durable hybrid local-agent job queue (P2).
 * Jobs survive API restarts; results are written into Execution + StepResult.
 */
import { prisma } from '../lib/prisma.js'

function parseJson(raw, fallback = null) {
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function serializeJob(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.userId,
    scenarioId: row.scenarioId,
    executionId: row.executionId,
    status: row.status,
    options: parseJson(row.optionsJson, {}),
    result: parseJson(row.resultJson, null),
    error: row.errorMessage,
    claimedAt: row.claimedAt?.toISOString?.() || row.claimedAt || null,
    completedAt: row.completedAt?.toISOString?.() || row.completedAt || null,
    createdAt: row.createdAt?.toISOString?.() || row.createdAt,
    updatedAt: row.updatedAt?.toISOString?.() || row.updatedAt,
    execution: row.execution
      ? {
          id: row.execution.id,
          status: row.execution.status,
          passedSteps: row.execution.passedSteps,
          failedSteps: row.execution.failedSteps,
          totalSteps: row.execution.totalSteps,
          browser: row.execution.browser,
          startTime: row.execution.startTime,
          endTime: row.execution.endTime,
        }
      : undefined,
    scenario: row.scenario
      ? { id: row.scenario.id, name: row.scenario.name, url: row.scenario.url }
      : undefined,
  }
}

export async function enqueueAgentJob({ userId, scenarioId, options = {}, totalSteps = 0 }) {
  const opts = {
    browser: options.browser || 'chromium',
    headless: options.headless !== false,
    environmentId: options.environmentId || null,
  }

  const execution = await prisma.execution.create({
    data: {
      userId,
      scenarioId,
      status: 'PENDING',
      totalSteps,
      passedSteps: 0,
      failedSteps: 0,
      browser: opts.browser,
      headless: opts.headless,
      testType: 'AGENT',
    },
  })

  const job = await prisma.agentJob.create({
    data: {
      userId,
      scenarioId,
      executionId: execution.id,
      status: 'QUEUED',
      optionsJson: JSON.stringify(opts),
    },
    include: { execution: true, scenario: { select: { id: true, name: true, url: true } } },
  })

  return serializeJob(job)
}

export async function listJobsForUser(userId, { scenarioId = null, limit = 20 } = {}) {
  const rows = await prisma.agentJob.findMany({
    where: {
      userId,
      ...(scenarioId ? { scenarioId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: Math.min(Number(limit) || 20, 100),
    include: {
      execution: true,
      scenario: { select: { id: true, name: true, url: true } },
    },
  })
  return rows.map(serializeJob)
}

export async function getJob(jobId, userId) {
  const row = await prisma.agentJob.findFirst({
    where: { id: jobId, userId },
    include: {
      execution: true,
      scenario: { select: { id: true, name: true, url: true } },
    },
  })
  return serializeJob(row)
}

export async function claimNextJob(userId) {
  // Optimistic claim with status guard to avoid double-claim races
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const next = await prisma.agentJob.findFirst({
      where: { userId, status: 'QUEUED' },
      orderBy: { createdAt: 'asc' },
    })
    if (!next) return null

    const claimedAt = new Date()
    const claimed = await prisma.agentJob.updateMany({
      where: { id: next.id, status: 'QUEUED' },
      data: { status: 'CLAIMED', claimedAt },
    })
    if (claimed.count === 0) continue

    await prisma.execution.update({
      where: { id: next.executionId },
      data: { status: 'RUNNING', startTime: claimedAt },
    })

    const job = await prisma.agentJob.findUnique({
      where: { id: next.id },
      include: { execution: true },
    })
    return serializeJob(job)
  }
  return null
}

/**
 * Persist agent step results into Execution / StepResult and close the job.
 */
export async function completeJob(jobId, userId, payload = {}) {
  const existing = await prisma.agentJob.findFirst({
    where: { id: jobId, userId },
  })
  if (!existing) return null
  if (existing.status === 'COMPLETED' || existing.status === 'FAILED') {
    return getJob(jobId, userId)
  }

  const success = payload.success !== false
  const result = payload.result || {}
  const steps = Array.isArray(result.steps) ? result.steps : []
  const passed = steps.filter((s) => s.status === 'PASSED').length
  const failed = steps.filter((s) => s.status === 'FAILED').length
  const endTime = new Date()
  const start = existing.claimedAt || existing.createdAt
  const duration = Math.max(0, endTime.getTime() - new Date(start).getTime())

  await prisma.$transaction(async (tx) => {
    for (const step of steps) {
      if (!step.stepId) continue
      const status = step.status === 'PASSED' ? 'PASSED' : 'FAILED'
      await tx.stepResult.create({
        data: {
          executionId: existing.executionId,
          testStepId: step.stepId,
          status,
          duration: typeof step.duration === 'number' ? step.duration : null,
          errorMessage: step.error
            ? JSON.stringify({ message: step.error, source: 'local-agent' })
            : null,
        },
      })
    }

    await tx.execution.update({
      where: { id: existing.executionId },
      data: {
        status: success && failed === 0 ? 'PASSED' : 'FAILED',
        endTime,
        duration,
        passedSteps: passed,
        failedSteps: failed || (success ? 0 : Math.max(failed, 1)),
        errorMessage: payload.error || null,
      },
    })

    await tx.agentJob.update({
      where: { id: jobId },
      data: {
        status: success && failed === 0 ? 'COMPLETED' : 'FAILED',
        completedAt: endTime,
        resultJson: JSON.stringify(result),
        errorMessage: payload.error || null,
      },
    })
  })

  return getJob(jobId, userId)
}

export async function getAgentJobStats(userId) {
  const groups = await prisma.agentJob.groupBy({
    by: ['status'],
    where: { userId },
    _count: { _all: true },
  })
  const counts = { queued: 0, claimed: 0, completed: 0, failed: 0, cancelled: 0 }
  for (const g of groups) {
    const key = String(g.status).toLowerCase()
    if (key in counts) counts[key] = g._count._all
  }
  return counts
}

export async function cancelQueuedJob(jobId, userId) {
  const job = await prisma.agentJob.findFirst({
    where: { id: jobId, userId, status: 'QUEUED' },
  })
  if (!job) return null

  await prisma.$transaction([
    prisma.agentJob.update({
      where: { id: jobId },
      data: { status: 'CANCELLED', completedAt: new Date(), errorMessage: 'Cancelled by user' },
    }),
    prisma.execution.update({
      where: { id: job.executionId },
      data: {
        status: 'FAILED',
        endTime: new Date(),
        errorMessage: 'Local agent job cancelled',
      },
    }),
  ])

  return getJob(jobId, userId)
}
