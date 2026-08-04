import {
  enqueueAgentJob,
  claimNextJob,
  completeJob,
  listJobsForUser,
  getJob,
  cancelQueuedJob,
  getAgentJobStats,
} from '../agentJobService.js'
import { prisma } from '../../lib/prisma.js'

describe('agentJobService (P2 durable queue)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('enqueueAgentJob creates PENDING execution and QUEUED job', async () => {
    prisma.execution.create.mockResolvedValueOnce({
      id: 'exec-agent-1',
      status: 'PENDING',
      totalSteps: 2,
    })
    prisma.agentJob.create.mockResolvedValueOnce({
      id: 'job-1',
      userId: 'user-1',
      scenarioId: 'sc-1',
      executionId: 'exec-agent-1',
      status: 'QUEUED',
      optionsJson: JSON.stringify({ browser: 'chromium', headless: true, environmentId: null }),
      createdAt: new Date('2026-08-04T10:00:00Z'),
      updatedAt: new Date('2026-08-04T10:00:00Z'),
      execution: { id: 'exec-agent-1', status: 'PENDING', passedSteps: 0, failedSteps: 0, totalSteps: 2 },
      scenario: { id: 'sc-1', name: 'Internal', url: 'http://10.0.0.5' },
    })

    const job = await enqueueAgentJob({
      userId: 'user-1',
      scenarioId: 'sc-1',
      options: { browser: 'chromium', headless: true },
      totalSteps: 2,
    })

    expect(prisma.execution.create).toHaveBeenCalled()
    expect(prisma.agentJob.create).toHaveBeenCalled()
    expect(job.status).toBe('QUEUED')
    expect(job.executionId).toBe('exec-agent-1')
    expect(job.options.browser).toBe('chromium')
  })

  test('claimNextJob marks job CLAIMED and execution RUNNING', async () => {
    prisma.agentJob.findFirst.mockResolvedValueOnce({
      id: 'job-1',
      executionId: 'exec-1',
      userId: 'user-1',
      status: 'QUEUED',
    })
    prisma.agentJob.updateMany.mockResolvedValueOnce({ count: 1 })
    prisma.execution.update.mockResolvedValueOnce({ id: 'exec-1', status: 'RUNNING' })
    prisma.agentJob.findUnique.mockResolvedValueOnce({
      id: 'job-1',
      userId: 'user-1',
      scenarioId: 'sc-1',
      executionId: 'exec-1',
      status: 'CLAIMED',
      optionsJson: '{}',
      claimedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      execution: { id: 'exec-1', status: 'RUNNING' },
    })

    const job = await claimNextJob('user-1')
    expect(job.status).toBe('CLAIMED')
    expect(prisma.agentJob.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job-1', status: 'QUEUED' },
      })
    )
    expect(prisma.execution.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'exec-1' },
        data: expect.objectContaining({ status: 'RUNNING' }),
      })
    )
  })

  test('claimNextJob returns null when queue empty', async () => {
    prisma.agentJob.findFirst.mockResolvedValueOnce(null)
    expect(await claimNextJob('user-1')).toBeNull()
  })

  test('completeJob writes step results and closes execution', async () => {
    const claimedAt = new Date(Date.now() - 5000)
    prisma.agentJob.findFirst
      .mockResolvedValueOnce({
        id: 'job-1',
        userId: 'user-1',
        executionId: 'exec-1',
        status: 'CLAIMED',
        claimedAt,
        createdAt: claimedAt,
      })
      .mockResolvedValueOnce({
        id: 'job-1',
        userId: 'user-1',
        scenarioId: 'sc-1',
        executionId: 'exec-1',
        status: 'COMPLETED',
        optionsJson: '{}',
        resultJson: '{}',
        completedAt: new Date(),
        createdAt: claimedAt,
        updatedAt: new Date(),
        execution: { id: 'exec-1', status: 'PASSED', passedSteps: 1, failedSteps: 0, totalSteps: 1 },
      })

    prisma.$transaction.mockImplementationOnce(async (fn) => {
      const tx = {
        stepResult: { create: jest.fn(() => Promise.resolve({ id: 'sr-1' })) },
        execution: { update: jest.fn(() => Promise.resolve({})) },
        agentJob: { update: jest.fn(() => Promise.resolve({})) },
      }
      await fn(tx)
      expect(tx.stepResult.create).toHaveBeenCalled()
      expect(tx.execution.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'PASSED' }),
        })
      )
      return undefined
    })

    const job = await completeJob('job-1', 'user-1', {
      success: true,
      result: {
        steps: [{ stepId: 'step-1', status: 'PASSED', duration: 100 }],
      },
    })

    expect(job.status).toBe('COMPLETED')
  })

  test('listJobsForUser maps rows', async () => {
    prisma.agentJob.findMany.mockResolvedValueOnce([
      {
        id: 'job-1',
        userId: 'user-1',
        scenarioId: 'sc-1',
        executionId: 'exec-1',
        status: 'QUEUED',
        optionsJson: '{}',
        createdAt: new Date(),
        updatedAt: new Date(),
        execution: { id: 'exec-1', status: 'PENDING' },
        scenario: { id: 'sc-1', name: 'A', url: 'http://10.0.0.1' },
      },
    ])
    const jobs = await listJobsForUser('user-1', { scenarioId: 'sc-1' })
    expect(jobs).toHaveLength(1)
    expect(jobs[0].id).toBe('job-1')
  })

  test('getJob returns null when missing', async () => {
    prisma.agentJob.findFirst.mockResolvedValueOnce(null)
    expect(await getJob('missing', 'user-1')).toBeNull()
  })

  test('cancelQueuedJob only cancels QUEUED', async () => {
    prisma.agentJob.findFirst.mockResolvedValueOnce(null)
    expect(await cancelQueuedJob('job-1', 'user-1')).toBeNull()
  })

  test('getAgentJobStats aggregates counts', async () => {
    prisma.agentJob.groupBy.mockResolvedValueOnce([
      { status: 'QUEUED', _count: { _all: 2 } },
      { status: 'COMPLETED', _count: { _all: 5 } },
    ])
    const stats = await getAgentJobStats('user-1')
    expect(stats.queued).toBe(2)
    expect(stats.completed).toBe(5)
    expect(stats.failed).toBe(0)
  })
})
