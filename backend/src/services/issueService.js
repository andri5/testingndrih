import { prisma } from '../lib/prisma.js'

function issueInclude() {
  return {
    execution: {
      select: {
        id: true,
        status: true,
        createdAt: true,
        scenario: { select: { id: true, name: true } },
      },
    },
    scenario: { select: { id: true, name: true, url: true } },
    attachments: {
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        filename: true,
        originalName: true,
        mimeType: true,
        size: true,
        url: true,
        createdAt: true,
      },
    },
  }
}

export async function listIssues(userId, { status, source, limit = 50, offset = 0 } = {}) {
  const where = {
    AND: [
      {
        OR: [
          { userId },
          { execution: { userId } },
          { scenario: { userId } },
        ],
      },
      ...(status ? [{ status }] : []),
      ...(source ? [{ source }] : []),
    ],
  }
  const [issues, total] = await Promise.all([
    prisma.issue.findMany({
      where,
      include: issueInclude(),
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.issue.count({ where }),
  ])
  return { issues, total, limit, offset }
}

export async function getIssueById(userId, issueId) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      execution: {
        select: {
          id: true,
          status: true,
          errorMessage: true,
          failedSteps: true,
          userId: true,
          scenario: { select: { id: true, name: true, url: true } },
          stepResults: {
            where: { status: 'FAILED' },
            include: { testStep: { select: { stepNumber: true, description: true, type: true } } },
          },
        },
      },
      scenario: { select: { id: true, name: true, url: true, userId: true } },
      user: { select: { id: true, name: true, email: true } },
      attachments: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          filename: true,
          originalName: true,
          mimeType: true,
          size: true,
          url: true,
          createdAt: true,
        },
      },
    },
  })
  const owned =
    issue &&
    (issue.userId === userId ||
      issue.execution?.userId === userId ||
      issue.scenario?.userId === userId)
  if (!owned) {
    throw Object.assign(new Error('Issue not found'), { status: 404 })
  }
  return issue
}

export async function updateIssue(userId, issueId, data) {
  await getIssueById(userId, issueId)
  return prisma.issue.update({
    where: { id: issueId },
    data: {
      ...(data.status !== undefined && { status: data.status }),
      ...(data.severity !== undefined && { severity: data.severity }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
    },
    include: issueInclude(),
  })
}

/**
 * Manual bug report by QA (optional scenario / execution link).
 */
export async function createManualIssue(userId, payload = {}) {
  const title = String(payload.title || '').trim()
  if (!title) {
    throw Object.assign(new Error('Title is required'), { status: 400 })
  }

  let scenarioId = payload.scenarioId || null
  let executionId = payload.executionId || null

  if (executionId) {
    const execution = await prisma.execution.findFirst({
      where: { id: executionId, userId },
      select: { id: true, scenarioId: true },
    })
    if (!execution) {
      throw Object.assign(new Error('Execution not found'), { status: 404 })
    }
    executionId = execution.id
    scenarioId = scenarioId || execution.scenarioId
  }

  if (scenarioId) {
    const scenario = await prisma.scenario.findFirst({
      where: { id: scenarioId, userId },
      select: { id: true },
    })
    if (!scenario) {
      throw Object.assign(new Error('Scenario not found'), { status: 404 })
    }
  }

  const severity = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(payload.severity)
    ? payload.severity
    : 'MEDIUM'

  const stepNumber =
    payload.stepNumber != null && !Number.isNaN(Number(payload.stepNumber))
      ? Number(payload.stepNumber)
      : null

  return prisma.issue.create({
    data: {
      title,
      description: payload.description ? String(payload.description) : null,
      status: 'OPEN',
      severity,
      stepNumber,
      source: 'MANUAL',
      userId,
      scenarioId,
      executionId,
    },
    include: issueInclude(),
  })
}

export async function createIssueFromExecution(executionId) {
  const execution = await prisma.execution.findUnique({
    where: { id: executionId },
    include: {
      scenario: { select: { name: true, id: true } },
      stepResults: {
        where: { status: 'FAILED' },
        include: { testStep: { select: { stepNumber: true } } },
        take: 1,
      },
    },
  })
  if (!execution || execution.status !== 'FAILED') return null

  const existing = await prisma.issue.findFirst({
    where: { executionId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
  })
  if (existing) return existing

  const failedStep = execution.stepResults[0]?.testStep?.stepNumber
  const title = `Test failed: ${execution.scenario.name}`
  const description = [
    execution.errorMessage,
    failedStep ? `Failed at step ${failedStep}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  return prisma.issue.create({
    data: {
      title,
      description: description || 'Execution failed',
      status: 'OPEN',
      severity: 'HIGH',
      stepNumber: failedStep ?? null,
      source: 'AUTO',
      executionId,
      scenarioId: execution.scenarioId,
      userId: execution.userId,
    },
  })
}
