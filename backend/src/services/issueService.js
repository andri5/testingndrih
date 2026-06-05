import { prisma } from '../lib/prisma.js'

export async function listIssues(userId, { status, limit = 50, offset = 0 } = {}) {
  const where = {
    execution: { userId },
    ...(status ? { status } : {})
  }
  const [issues, total] = await Promise.all([
    prisma.issue.findMany({
      where,
      include: {
        execution: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            scenario: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.issue.count({ where })
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
            include: { testStep: { select: { stepNumber: true, description: true, type: true } } }
          }
        }
      }
    }
  })
  if (!issue || issue.execution.userId !== userId) {
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
      ...(data.description !== undefined && { description: data.description })
    }
  })
}

export async function createIssueFromExecution(executionId) {
  const execution = await prisma.execution.findUnique({
    where: { id: executionId },
    include: {
      scenario: { select: { name: true } },
      stepResults: {
        where: { status: 'FAILED' },
        include: { testStep: { select: { stepNumber: true } } },
        take: 1
      }
    }
  })
  if (!execution || execution.status !== 'FAILED') return null

  const existing = await prisma.issue.findFirst({
    where: { executionId, status: { in: ['OPEN', 'IN_PROGRESS'] } }
  })
  if (existing) return existing

  const failedStep = execution.stepResults[0]?.testStep?.stepNumber
  const title = `Test failed: ${execution.scenario.name}`
  const description = [
    execution.errorMessage,
    failedStep ? `Failed at step ${failedStep}` : null
  ].filter(Boolean).join('\n')

  return prisma.issue.create({
    data: {
      title,
      description: description || 'Execution failed',
      status: 'OPEN',
      severity: 'HIGH',
      stepNumber: failedStep ?? null,
      executionId
    }
  })
}
