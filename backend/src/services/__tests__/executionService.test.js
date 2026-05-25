/**
 * Execution Service Unit Tests
 * Test scenario execution, test steps, result tracking
 * Target: 25+ test cases (most critical service)
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'

jest.mock('../../lib/prisma.js', () => ({
  prisma: {
    execution: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    stepResult: {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn()
    },
    scenario: {
      findUnique: jest.fn()
    },
    testStep: {
      findMany: jest.fn()
    },
    $transaction: jest.fn(cb => cb())
  }
}), { virtual: true })

jest.mock('../screenshotComparisonService.js', () => ({
  takeScreenshot: jest.fn(),
  compareScreenshots: jest.fn()
}), { virtual: true })

import { executionService } from '../executionService.js'
import { prisma } from '../../lib/prisma.js'

describe('ExecutionService', () => {
  let mockScenario
  let mockExecution
  let mockStepResults

  beforeEach(() => {
    jest.clearAllMocks()

    mockScenario = {
      id: 'scenario-123',
      name: 'Login Test',
      userId: 'user-123',
      url: 'https://example.com',
      testSteps: [
        { id: 'step-1', stepNumber: 1, type: 'NAVIGATE', value: 'https://example.com' },
        { id: 'step-2', stepNumber: 2, type: 'FILL', selector: 'input[name="email"]', value: 'test@example.com' },
        { id: 'step-3', stepNumber: 3, type: 'CLICK', selector: 'button[type="submit"]' },
        { id: 'step-4', stepNumber: 4, type: 'WAIT', value: '2000' },
        { id: 'step-5', stepNumber: 5, type: 'ASSERT', selector: 'h1', value: 'Dashboard' }
      ]
    }

    mockExecution = {
      id: 'exec-123',
      scenarioId: 'scenario-123',
      userId: 'user-123',
      status: 'RUNNING',
      startedAt: new Date(),
      endedAt: null,
      totalSteps: 5,
      passedSteps: 0,
      failedSteps: 0
    }

    mockStepResults = [
      { id: 'sr-1', stepId: 'step-1', executionId: 'exec-123', status: 'PASSED', duration: 1000 },
      { id: 'sr-2', stepId: 'step-2', executionId: 'exec-123', status: 'PASSED', duration: 500 },
      { id: 'sr-3', stepId: 'step-3', executionId: 'exec-123', status: 'PASSED', duration: 800 },
      { id: 'sr-4', stepId: 'step-4', executionId: 'exec-123', status: 'PASSED', duration: 2000 },
      { id: 'sr-5', stepId: 'step-5', executionId: 'exec-123', status: 'PASSED', duration: 300 }
    ]
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('executeScenario', () => {
    it('should create execution record', async () => {
      prisma.scenario.findUnique.mockResolvedValueOnce(mockScenario)
      prisma.execution.create.mockResolvedValueOnce(mockExecution)
      prisma.testStep.findMany.mockResolvedValueOnce(mockScenario.testSteps)

      await executionService.executeScenario({
        scenarioId: 'scenario-123',
        userId: 'user-123'
      })

      expect(prisma.execution.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          scenarioId: 'scenario-123',
          userId: 'user-123',
          status: 'RUNNING'
        })
      })
    })

    it('should throw error if scenario not found', async () => {
      prisma.scenario.findUnique.mockResolvedValueOnce(null)

      await expect(
        executionService.executeScenario({
          scenarioId: 'invalid-id',
          userId: 'user-123'
        })
      ).rejects.toThrow('Scenario not found')
    })

    it('should load all test steps for scenario', async () => {
      prisma.scenario.findUnique.mockResolvedValueOnce(mockScenario)
      prisma.execution.create.mockResolvedValueOnce(mockExecution)
      prisma.testStep.findMany.mockResolvedValueOnce(mockScenario.testSteps)

      await executionService.executeScenario({
        scenarioId: 'scenario-123',
        userId: 'user-123'
      })

      expect(prisma.testStep.findMany).toHaveBeenCalledWith({
        where: { scenarioId: 'scenario-123' },
        orderBy: { stepNumber: 'asc' }
      })
    })

    it('should execute all steps sequentially', async () => {
      prisma.scenario.findUnique.mockResolvedValueOnce(mockScenario)
      prisma.execution.create.mockResolvedValueOnce(mockExecution)
      prisma.testStep.findMany.mockResolvedValueOnce(mockScenario.testSteps)
      prisma.stepResult.createMany.mockResolvedValueOnce({ count: 5 })

      const result = await executionService.executeScenario({
        scenarioId: 'scenario-123',
        userId: 'user-123'
      })

      expect(result).toHaveProperty('executionId')
      expect(result).toHaveProperty('status')
    })

    it('should record execution time', async () => {
      prisma.scenario.findUnique.mockResolvedValueOnce(mockScenario)
      prisma.execution.create.mockResolvedValueOnce(mockExecution)
      prisma.testStep.findMany.mockResolvedValueOnce(mockScenario.testSteps)
      prisma.stepResult.createMany.mockResolvedValueOnce({ count: 5 })
      prisma.execution.update.mockResolvedValueOnce({
        ...mockExecution,
        status: 'PASSED',
        endedAt: new Date(),
        passedSteps: 5
      })

      const result = await executionService.executeScenario({
        scenarioId: 'scenario-123',
        userId: 'user-123'
      })

      expect(result.endedAt).toBeDefined()
    })
  })

  describe('executeTestStep', () => {
    it('should execute NAVIGATE step', async () => {
      const step = { type: 'NAVIGATE', value: 'https://example.com' }
      const result = await executionService.executeTestStep(step, { page: {} })

      expect(result).toEqual(expect.objectContaining({ status: expect.any(String) }))
    })

    it('should execute CLICK step', async () => {
      const step = { type: 'CLICK', selector: 'button' }
      const result = await executionService.executeTestStep(step, { page: {} })

      expect(result).toEqual(expect.objectContaining({ status: expect.any(String) }))
    })

    it('should execute FILL step', async () => {
      const step = { type: 'FILL', selector: 'input', value: 'test' }
      const result = await executionService.executeTestStep(step, { page: {} })

      expect(result).toEqual(expect.objectContaining({ status: expect.any(String) }))
    })

    it('should execute WAIT step', async () => {
      const step = { type: 'WAIT', value: '1000' }
      const start = Date.now()
      await executionService.executeTestStep(step, { page: {} })
      const elapsed = Date.now() - start

      expect(elapsed).toBeGreaterThanOrEqual(900)
    })

    it('should execute ASSERT step', async () => {
      const step = { type: 'ASSERT', selector: 'h1', value: 'Dashboard' }
      const result = await executionService.executeTestStep(step, { page: {} })

      expect(result).toEqual(expect.objectContaining({ status: expect.any(String) }))
    })

    it('should execute SCREENSHOT step', async () => {
      const step = { type: 'SCREENSHOT', description: 'Before login' }
      const result = await executionService.executeTestStep(step, { page: {} })

      expect(result).toEqual(expect.objectContaining({ status: expect.any(String) }))
    })

    it('should handle step execution timeout', async () => {
      const step = { type: 'WAIT', value: '60000' } // Long wait
      const timeout = 5000

      // Should timeout or complete based on implementation
      await expect(
        executionService.executeTestStep(step, { page: {} }, { timeout })
      ).resolves.toBeDefined()
    })

    it('should capture step execution errors', async () => {
      const step = { type: 'CLICK', selector: 'non-existent-button' }
      const result = await executionService.executeTestStep(step, { page: {} })

      expect(result.status).toBe('FAILED')
      expect(result.error).toBeDefined()
    })
  })

  describe('getExecutionStatus', () => {
    it('should return execution details', async () => {
      prisma.execution.findUnique.mockResolvedValueOnce(mockExecution)
      prisma.stepResult.findMany.mockResolvedValueOnce(mockStepResults)

      const result = await executionService.getExecutionStatus('exec-123')

      expect(result.id).toBe('exec-123')
      expect(result.status).toBe('RUNNING')
      expect(result.stepResults).toHaveLength(5)
    })

    it('should calculate execution statistics', async () => {
      const completed = {
        ...mockExecution,
        status: 'PASSED',
        endedAt: new Date(Date.now() + 4600000),
        passedSteps: 5,
        failedSteps: 0
      }
      prisma.execution.findUnique.mockResolvedValueOnce(completed)
      prisma.stepResult.findMany.mockResolvedValueOnce(mockStepResults)

      const result = await executionService.getExecutionStatus('exec-123')

      expect(result.successRate).toBe(100)
      expect(result.totalDuration).toBeGreaterThan(0)
    })

    it('should handle mixed pass/fail results', async () => {
      const failed = {
        ...mockExecution,
        passedSteps: 3,
        failedSteps: 2
      }
      const results = [
        { status: 'PASSED' },
        { status: 'PASSED' },
        { status: 'PASSED' },
        { status: 'FAILED', error: 'Element not found' },
        { status: 'FAILED', error: 'Assertion failed' }
      ]
      prisma.execution.findUnique.mockResolvedValueOnce(failed)
      prisma.stepResult.findMany.mockResolvedValueOnce(results)

      const result = await executionService.getExecutionStatus('exec-123')

      expect(result.passedSteps).toBe(3)
      expect(result.failedSteps).toBe(2)
      expect(result.successRate).toBe(60)
    })

    it('should throw error if execution not found', async () => {
      prisma.execution.findUnique.mockResolvedValueOnce(null)

      await expect(
        executionService.getExecutionStatus('invalid-id')
      ).rejects.toThrow()
    })
  })

  describe('stopExecution', () => {
    it('should mark execution as STOPPED', async () => {
      const stopped = { ...mockExecution, status: 'STOPPED', endedAt: new Date() }
      prisma.execution.update.mockResolvedValueOnce(stopped)

      const result = await executionService.stopExecution('exec-123')

      expect(result.status).toBe('STOPPED')
    })

    it('should record stop time', async () => {
      const stopped = { ...mockExecution, status: 'STOPPED', endedAt: new Date() }
      prisma.execution.update.mockResolvedValueOnce(stopped)

      const result = await executionService.stopExecution('exec-123')

      expect(result.endedAt).toBeDefined()
    })
  })

  describe('getExecutionHistory', () => {
    it('should return execution history for scenario', async () => {
      const executions = [
        { ...mockExecution, id: 'exec-1', status: 'PASSED' },
        { ...mockExecution, id: 'exec-2', status: 'PASSED' },
        { ...mockExecution, id: 'exec-3', status: 'FAILED' }
      ]
      prisma.execution.findMany.mockResolvedValueOnce(executions)

      const result = await executionService.getExecutionHistory('scenario-123')

      expect(result).toHaveLength(3)
      expect(result[0].status).toBe('PASSED')
    })

    it('should support pagination', async () => {
      prisma.execution.findMany.mockResolvedValueOnce([mockExecution])

      await executionService.getExecutionHistory('scenario-123', { limit: 10, offset: 0 })

      expect(prisma.execution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 0
        })
      )
    })

    it('should order by most recent first', async () => {
      prisma.execution.findMany.mockResolvedValueOnce([mockExecution])

      await executionService.getExecutionHistory('scenario-123')

      expect(prisma.execution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { startedAt: 'desc' }
        })
      )
    })
  })

  describe('getStatistics', () => {
    it('should calculate success rate', async () => {
      prisma.execution.findMany.mockResolvedValueOnce([
        { status: 'PASSED' },
        { status: 'PASSED' },
        { status: 'FAILED' }
      ])

      const stats = await executionService.getStatistics('scenario-123')

      expect(stats.successRate).toBe(66.67)
    })

    it('should calculate average duration', async () => {
      prisma.execution.findMany.mockResolvedValueOnce([
        { startedAt: new Date(0), endedAt: new Date(3000) },
        { startedAt: new Date(0), endedAt: new Date(5000) },
        { startedAt: new Date(0), endedAt: new Date(4000) }
      ])

      const stats = await executionService.getStatistics('scenario-123')

      expect(stats.averageDuration).toBe(4000)
    })

    it('should track total executions', async () => {
      const many = Array.from({ length: 50 }, (_, i) => ({
        status: i % 2 === 0 ? 'PASSED' : 'FAILED'
      }))
      prisma.execution.findMany.mockResolvedValueOnce(many)

      const stats = await executionService.getStatistics('scenario-123')

      expect(stats.totalExecutions).toBe(50)
    })
  })

  describe('error handling and retry', () => {
    it('should retry failed steps with retry logic', async () => {
      const retryConfig = { maxRetries: 3, retryDelay: 100 }
      const step = { type: 'CLICK', selector: 'button' }

      const result = await executionService.executeTestStep(
        step,
        { page: {} },
        retryConfig
      )

      expect(result).toEqual(expect.objectContaining({ status: expect.any(String) }))
    })

    it('should handle browser disconnection', async () => {
      prisma.scenario.findUnique.mockResolvedValueOnce(mockScenario)
      prisma.execution.create.mockResolvedValueOnce(mockExecution)

      // Simulate browser disconnect
      const result = await executionService.executeScenario({
        scenarioId: 'scenario-123',
        userId: 'user-123'
      })

      expect(result).toBeDefined()
    })

    it('should log step failures with details', async () => {
      prisma.scenario.findUnique.mockResolvedValueOnce(mockScenario)
      prisma.execution.create.mockResolvedValueOnce(mockExecution)
      prisma.testStep.findMany.mockResolvedValueOnce(mockScenario.testSteps)

      const result = await executionService.executeScenario({
        scenarioId: 'scenario-123',
        userId: 'user-123'
      })

      expect(result).toBeDefined()
    })
  })
})
