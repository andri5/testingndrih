import { prisma } from '../lib/prisma.js'
import { createManualIssue } from './issueService.js'

const MANUAL_OUTCOMES = new Set(['PASSED', 'FAILED', 'BLOCKED', 'SKIPPED'])
const NOTES_REQUIRED = new Set(['FAILED', 'BLOCKED'])

function httpError(message, status = 400) {
  return Object.assign(new Error(message), { status })
}

async function getOwnedManualExecution(userId, executionId) {
  const execution = await prisma.execution.findFirst({
    where: { id: executionId, userId },
    include: {
      scenario: { select: { id: true, name: true, url: true } },
      stepResults: {
        include: {
          testStep: {
            select: {
              id: true,
              stepNumber: true,
              type: true,
              description: true,
              expectedResult: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  if (!execution) throw httpError('Execution not found', 404)
  if (execution.testType !== 'MANUAL') throw httpError('Not a manual execution', 400)
  return execution
}

function progressFromResults(results, totalSteps) {
  return {
    recorded: results.length,
    total: totalSteps,
    passed: results.filter((r) => r.status === 'PASSED').length,
    failed: results.filter((r) => r.status === 'FAILED').length,
    blocked: results.filter((r) => r.status === 'BLOCKED').length,
    skipped: results.filter((r) => r.status === 'SKIPPED').length,
  }
}

/**
 * Start a manual QA checklist run (no Playwright).
 */
export async function startManualExecution(userId, scenarioId) {
  const scenario = await prisma.scenario.findFirst({
    where: { id: scenarioId, userId },
    include: { testSteps: { orderBy: { stepNumber: 'asc' } } },
  })
  if (!scenario) throw httpError('Scenario not found', 404)
  if (!scenario.testSteps.length) throw httpError('Scenario has no test steps', 400)

  const existing = await prisma.execution.findFirst({
    where: { userId, scenarioId, testType: 'MANUAL', status: 'RUNNING' },
    select: { id: true },
  })
  if (existing) {
    throw httpError('Manual run already in progress for this scenario. Finish or cancel it first.', 409)
  }

  const execution = await prisma.execution.create({
    data: {
      userId,
      scenarioId,
      status: 'RUNNING',
      startTime: new Date(),
      totalSteps: scenario.testSteps.length,
      passedSteps: 0,
      failedSteps: 0,
      browser: 'manual',
      headless: true,
      testType: 'MANUAL',
    },
  })

  return {
    execution,
    steps: scenario.testSteps,
    scenario: {
      id: scenario.id,
      name: scenario.name,
      precondition: scenario.precondition,
      priority: scenario.priority,
      caseType: scenario.caseType,
      ownerId: scenario.ownerId,
    },
  }
}

/**
 * Record manual outcome for one step.
 * FAILED/BLOCKED require notes. Optional createBug on FAILED (and BLOCKED).
 */
export async function recordManualStep(userId, executionId, testStepId, payload = {}) {
  const execution = await getOwnedManualExecution(userId, executionId)
  if (execution.status !== 'RUNNING') {
    throw httpError('Manual run is not active', 400)
  }

  const status = String(payload.status || '').toUpperCase()
  if (!MANUAL_OUTCOMES.has(status)) {
    throw httpError('status must be PASSED, FAILED, BLOCKED, or SKIPPED', 400)
  }

  const notes = payload.notes != null ? String(payload.notes).trim() : ''
  if (NOTES_REQUIRED.has(status) && !notes) {
    throw httpError(`Notes are required when marking a step as ${status}`, 400)
  }

  const testStep = await prisma.testStep.findFirst({
    where: { id: testStepId, scenarioId: execution.scenarioId },
  })
  if (!testStep) throw httpError('Test step not found in this scenario', 404)

  const existing = await prisma.stepResult.findFirst({
    where: { executionId, testStepId },
  })

  const stepData = {
    status,
    errorMessage: notes || null,
    duration: null,
  }

  const stepResult = existing
    ? await prisma.stepResult.update({ where: { id: existing.id }, data: stepData })
    : await prisma.stepResult.create({
        data: { executionId, testStepId, ...stepData },
      })

  let issue = null
  const wantBug = Boolean(payload.createBug)
  if ((status === 'FAILED' || status === 'BLOCKED') && wantBug) {
    const title =
      String(payload.bugTitle || '').trim() ||
      `Manual ${status.toLowerCase()}: ${execution.scenario?.name || 'scenario'} — step ${testStep.stepNumber}`
    const description = [
      notes,
      testStep.description ? `Step: ${testStep.description}` : null,
      testStep.expectedResult ? `Expected: ${testStep.expectedResult}` : null,
      testStep.selector ? `Selector: ${testStep.selector}` : null,
      execution.scenario?.url ? `URL: ${execution.scenario.url}` : null,
      'Source: MANUAL_RUN checklist',
    ]
      .filter(Boolean)
      .join('\n')

    issue = await createManualIssue(userId, {
      title,
      description,
      severity: payload.severity || (status === 'BLOCKED' ? 'MEDIUM' : 'HIGH'),
      stepNumber: testStep.stepNumber,
      scenarioId: execution.scenarioId,
      executionId: execution.id,
    })
  }

  const results = await prisma.stepResult.findMany({
    where: { executionId },
    select: { status: true },
  })

  return {
    stepResult,
    issue,
    progress: progressFromResults(results, execution.totalSteps),
  }
}

/**
 * Finish manual run.
 * FAILED if any FAILED/BLOCKED; else PASSED (SKIPPED counts as done, not fail).
 */
export async function finishManualExecution(userId, executionId) {
  const execution = await getOwnedManualExecution(userId, executionId)
  if (execution.status !== 'RUNNING') {
    throw httpError('Manual run is not active', 400)
  }

  const results = await prisma.stepResult.findMany({
    where: { executionId },
    include: { testStep: { select: { stepNumber: true, description: true } } },
  })

  if (results.length < execution.totalSteps) {
    throw httpError(
      `Mark all steps first (${results.length}/${execution.totalSteps} recorded)`,
      400
    )
  }

  const progress = progressFromResults(results, execution.totalSteps)
  const endTime = new Date()
  const start = execution.startTime || execution.createdAt
  const duration = Math.max(0, endTime.getTime() - new Date(start).getTime())
  const hasHardFail = progress.failed > 0 || progress.blocked > 0
  const status = hasHardFail ? 'FAILED' : 'PASSED'
  const firstBad = results.find((r) => r.status === 'FAILED' || r.status === 'BLOCKED')

  const updated = await prisma.execution.update({
    where: { id: executionId },
    data: {
      status,
      endTime,
      duration,
      passedSteps: progress.passed + progress.skipped,
      failedSteps: progress.failed + progress.blocked,
      errorMessage: hasHardFail
        ? firstBad?.errorMessage ||
          `Manual run ${firstBad?.status || 'FAILED'} at step ${firstBad?.testStep?.stepNumber || '?'}`
        : null,
    },
    include: {
      stepResults: {
        include: { testStep: true },
        orderBy: { createdAt: 'asc' },
      },
      issues: true,
      scenario: { select: { id: true, name: true } },
    },
  })

  return updated
}

export async function cancelManualExecution(userId, executionId) {
  const execution = await getOwnedManualExecution(userId, executionId)
  if (execution.status !== 'RUNNING') {
    throw httpError('Manual run is not active', 400)
  }

  const results = await prisma.stepResult.findMany({ where: { executionId } })
  const progress = progressFromResults(results, execution.totalSteps)
  const endTime = new Date()
  const start = execution.startTime || execution.createdAt

  return prisma.execution.update({
    where: { id: executionId },
    data: {
      status: 'FAILED',
      endTime,
      duration: Math.max(0, endTime.getTime() - new Date(start).getTime()),
      passedSteps: progress.passed + progress.skipped,
      failedSteps: progress.failed + progress.blocked,
      errorMessage: 'Manual run cancelled by user',
    },
  })
}

export async function getActiveManualExecution(userId, scenarioId) {
  return prisma.execution.findFirst({
    where: { userId, scenarioId, testType: 'MANUAL', status: 'RUNNING' },
    include: {
      stepResults: {
        select: {
          id: true,
          status: true,
          errorMessage: true,
          testStepId: true,
        },
      },
      scenario: {
        select: {
          id: true,
          name: true,
          precondition: true,
          priority: true,
          caseType: true,
          ownerId: true,
        },
      },
    },
  })
}
