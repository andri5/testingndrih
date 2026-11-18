jest.mock('../../lib/prisma.js', () => ({
  prisma: {
    scenario: { findFirst: jest.fn() },
    execution: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    testStep: { findFirst: jest.fn() },
    stepResult: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('../issueService.js', () => ({
  createManualIssue: jest.fn(),
}))

import { prisma } from '../../lib/prisma.js'
import { createManualIssue } from '../issueService.js'
import {
  startManualExecution,
  recordManualStep,
  finishManualExecution,
} from '../manualExecutionService.js'

describe('manualExecutionService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('startManualExecution creates MANUAL running execution', async () => {
    prisma.scenario.findFirst.mockResolvedValue({
      id: 'sc1',
      testSteps: [
        { id: 's1', stepNumber: 1, type: 'CLICK', description: 'Click' },
        { id: 's2', stepNumber: 2, type: 'FILL', description: 'Fill' },
      ],
    })
    prisma.execution.findFirst.mockResolvedValue(null)
    prisma.execution.create.mockResolvedValue({
      id: 'ex1',
      status: 'RUNNING',
      testType: 'MANUAL',
      totalSteps: 2,
    })

    const result = await startManualExecution('u1', 'sc1')
    expect(result.execution.id).toBe('ex1')
    expect(prisma.execution.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ testType: 'MANUAL', browser: 'manual', totalSteps: 2 }),
      })
    )
  })

  test('recordManualStep requires notes on FAILED', async () => {
    prisma.execution.findFirst.mockResolvedValue({
      id: 'ex1',
      userId: 'u1',
      status: 'RUNNING',
      testType: 'MANUAL',
      scenarioId: 'sc1',
      totalSteps: 1,
      scenario: { name: 'Demo' },
      stepResults: [],
    })

    await expect(
      recordManualStep('u1', 'ex1', 's1', { status: 'FAILED' })
    ).rejects.toMatchObject({ status: 400, message: expect.stringMatching(/Notes/i) })

    await expect(
      recordManualStep('u1', 'ex1', 's1', { status: 'BLOCKED' })
    ).rejects.toMatchObject({ status: 400, message: expect.stringMatching(/Notes/i) })
  })

  test('recordManualStep FAILED + createBug opens issue', async () => {
    prisma.execution.findFirst.mockResolvedValue({
      id: 'ex1',
      userId: 'u1',
      status: 'RUNNING',
      testType: 'MANUAL',
      scenarioId: 'sc1',
      totalSteps: 1,
      scenario: { name: 'Demo', url: 'https://x' },
      stepResults: [],
    })
    prisma.testStep.findFirst.mockResolvedValue({
      id: 's1',
      stepNumber: 1,
      description: 'Login',
      selector: '#login',
      scenarioId: 'sc1',
    })
    prisma.stepResult.findFirst.mockResolvedValue(null)
    prisma.stepResult.create.mockResolvedValue({ id: 'sr1', status: 'FAILED' })
    prisma.stepResult.findMany.mockResolvedValue([{ status: 'FAILED' }])
    createManualIssue.mockResolvedValue({ id: 'iss1', source: 'MANUAL' })

    const result = await recordManualStep('u1', 'ex1', 's1', {
      status: 'FAILED',
      notes: 'Button missing',
      createBug: true,
      severity: 'HIGH',
    })

    expect(createManualIssue).toHaveBeenCalled()
    expect(result.issue.id).toBe('iss1')
    expect(result.progress.failed).toBe(1)
  })

  test('finishManualExecution fails if not all steps marked', async () => {
    prisma.execution.findFirst.mockResolvedValue({
      id: 'ex1',
      userId: 'u1',
      status: 'RUNNING',
      testType: 'MANUAL',
      totalSteps: 2,
      startTime: new Date(),
      scenario: { name: 'Demo' },
      stepResults: [],
    })
    prisma.stepResult.findMany.mockResolvedValue([{ status: 'PASSED' }])

    await expect(finishManualExecution('u1', 'ex1')).rejects.toMatchObject({ status: 400 })
  })
})
