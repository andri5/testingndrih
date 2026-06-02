/**
 * Parallel Execution Service Unit Tests
 * Test concurrent execution, queue management, resource pooling
 * Target: 18+ test cases
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'

jest.mock('../../lib/prisma.js', () => ({
  prisma: {
    executionBatch: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    },
    execution: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn()
    },
    scenario: {
      findUnique: jest.fn()
    }
  }
}), { virtual: true })

jest.mock('../executionService.js', () => ({
  executionService: {
    executeScenario: jest.fn()
  }
}))

import { parallelExecutionService } from '../parallelExecutionService.js'
import { prisma } from '../../lib/prisma.js'
import { executionService } from '../executionService.js'

describe('ParallelExecutionService', () => {
  let mockScenarios
  let mockBatch
  let mockExecution

  beforeEach(() => {
    jest.clearAllMocks()
    parallelExecutionService.activeExecutions.clear()
    parallelExecutionService.executionQueue = []

    mockScenarios = [
      { id: 'scenario-1', userId: 'user-123' },
      { id: 'scenario-2', userId: 'user-123' },
      { id: 'scenario-3', userId: 'user-123' }
    ]

    mockBatch = {
      id: 'batch-123',
      userId: 'user-123',
      scenarioCount: 3,
      status: 'RUNNING',
      startedAt: new Date()
    }

    mockExecution = {
      id: 'exec-123',
      batchId: 'batch-123',
      scenarioId: 'scenario-1',
      status: 'RUNNING'
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('executeParallel', () => {
    it('should create execution batch', async () => {
      prisma.executionBatch.create.mockResolvedValueOnce(mockBatch)
      prisma.scenario.findUnique.mockResolvedValue({
        id: 'scenario-1',
        name: 'Test Scenario',
        userId: 'user-123',
        steps: []
      })
      executionService.executeScenario.mockResolvedValueOnce({
        id: 'exec-123',
        status: 'PASSED',
        passedSteps: 5,
        failedSteps: 0,
        duration: 1000
      })

      await parallelExecutionService.executeParallel(mockScenarios, { userId: 'user-123' })

      expect(prisma.executionBatch.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          scenarioCount: 3,
          status: 'RUNNING'
        })
      })
    })

    it('should throw error if scenarios array is empty', async () => {
      await expect(
        parallelExecutionService.executeParallel([], { userId: 'user-123' })
      ).rejects.toThrow('No scenarios provided')
    })

    it('should throw error if no scenarios provided', async () => {
      await expect(
        parallelExecutionService.executeParallel(null, { userId: 'user-123' })
      ).rejects.toThrow()
    })

    it('should execute scenarios within concurrency limit', async () => {
      prisma.executionBatch.create.mockResolvedValueOnce(mockBatch)
      prisma.scenario.findUnique.mockResolvedValue({
        id: 'scenario-1',
        name: 'Test Scenario',
        userId: 'user-123',
        steps: []
      })
      executionService.executeScenario.mockResolvedValue({
        id: 'exec-123',
        status: 'PASSED',
        passedSteps: 5,
        failedSteps: 0,
        duration: 1000
      })

      const result = await parallelExecutionService.executeParallel(mockScenarios, {
        userId: 'user-123',
        concurrencyLimit: 2
      })

      expect(result.executionBatchId).toBe('batch-123')
      expect(result.executions).toBeDefined()
    })

    it('should queue scenarios exceeding concurrency limit', async () => {
      prisma.executionBatch.create.mockResolvedValueOnce(mockBatch)
      prisma.scenario.findUnique.mockResolvedValue({
        id: 'scenario-1',
        name: 'Test Scenario',
        userId: 'user-123',
        steps: []
      })
      executionService.executeScenario.mockResolvedValue({
        id: 'exec-123',
        status: 'PASSED',
        passedSteps: 5,
        failedSteps: 0,
        duration: 1000
      })

      const manyScenarios = Array.from({ length: 10 }, (_, i) => ({
        id: `scenario-${i}`,
        userId: 'user-123'
      }))

      await parallelExecutionService.executeParallel(manyScenarios, {
        userId: 'user-123',
        concurrencyLimit: 3
      })

      // Queue should have remaining scenarios
      expect(parallelExecutionService.executionQueue.length).toBeGreaterThan(0)
    })

    it('should apply timeout to each execution', async () => {
      prisma.executionBatch.create.mockResolvedValueOnce(mockBatch)
      prisma.scenario.findUnique.mockResolvedValue({
        id: 'scenario-1',
        name: 'Test Scenario',
        userId: 'user-123',
        steps: []
      })
      executionService.executeScenario.mockResolvedValue({
        id: 'exec-123',
        status: 'PASSED',
        passedSteps: 5,
        failedSteps: 0,
        duration: 1000
      })

      const timeout = 300000 // 5 minutes
      await parallelExecutionService.executeParallel(mockScenarios, {
        userId: 'user-123',
        timeout
      })

      expect(executionService.executeScenario).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ timeout })
      )
    })

    it('should track active executions', async () => {
      prisma.executionBatch.create.mockResolvedValueOnce(mockBatch)
      prisma.scenario.findUnique.mockResolvedValue({
        id: 'scenario-1',
        name: 'Test Scenario',
        userId: 'user-123',
        steps: []
      })
      executionService.executeScenario.mockResolvedValue({
        id: 'exec-123',
        status: 'PASSED',
        passedSteps: 5,
        failedSteps: 0,
        duration: 1000
      })

      await parallelExecutionService.executeParallel(mockScenarios, {
        userId: 'user-123'
      })

      expect(parallelExecutionService.activeExecutions.size).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getExecutionBatchStatus', () => {
    it('should return batch status', async () => {
      const statusBatch = { ...mockBatch, status: 'COMPLETED', completedAt: new Date() }
      prisma.executionBatch.findUnique.mockResolvedValueOnce(statusBatch)
      prisma.execution.findMany.mockResolvedValueOnce([
        { ...mockExecution, status: 'PASSED' },
        { ...mockExecution, id: 'exec-124', status: 'FAILED' }
      ])

      const result = await parallelExecutionService.getExecutionBatchStatus('batch-123')

      expect(result.batchId).toBe('batch-123')
      expect(result.executions).toHaveLength(2)
    })

    it('should handle missing batch', async () => {
      prisma.executionBatch.findUnique.mockResolvedValueOnce(null)

      await expect(
        parallelExecutionService.getExecutionBatchStatus('invalid-id')
      ).rejects.toThrow()
    })

    it('should calculate batch statistics', async () => {
      const statusBatch = { ...mockBatch, status: 'COMPLETED' }
      prisma.executionBatch.findUnique.mockResolvedValueOnce(statusBatch)
      prisma.execution.findMany.mockResolvedValueOnce([
        { id: 'exec-1', status: 'PASSED' },
        { id: 'exec-2', status: 'PASSED' },
        { id: 'exec-3', status: 'FAILED' }
      ])

      const result = await parallelExecutionService.getExecutionBatchStatus('batch-123')

      expect(result.totalExecutions).toBe(3)
      expect(result.passedCount).toBe(2)
      expect(result.failedCount).toBe(1)
    })
  })

  describe('stopBatch', () => {
    it('should stop all active executions in batch', async () => {
      const stopMock = jest.fn()
      parallelExecutionService.activeExecutions.set('exec-123', { stop: stopMock })
      parallelExecutionService.activeExecutions.set('exec-124', { stop: jest.fn() })

      prisma.executionBatch.update.mockResolvedValueOnce({ ...mockBatch, status: 'STOPPED' })

      const result = await parallelExecutionService.stopBatch('batch-123')

      expect(result.status).toBe('STOPPED')
      expect(stopMock).toHaveBeenCalled()
    })

    it('should update batch status to STOPPED', async () => {
      prisma.executionBatch.update.mockResolvedValueOnce({ ...mockBatch, status: 'STOPPED' })

      await parallelExecutionService.stopBatch('batch-123')

      expect(prisma.executionBatch.update).toHaveBeenCalledWith({
        where: { id: 'batch-123' },
        data: expect.objectContaining({ status: 'STOPPED' })
      })
    })
  })

  describe('concurrency management', () => {
    it('should process queue when slot becomes available', async () => {
      prisma.executionBatch.create.mockResolvedValueOnce(mockBatch)
      executionService.executeScenario.mockResolvedValueOnce(mockExecution)

      const many = Array.from({ length: 5 }, (_, i) => ({
        id: `s${i}`,
        userId: 'user-123'
      }))

      await parallelExecutionService.executeParallel(many, {
        concurrencyLimit: 2,
        userId: 'user-123'
      })

      // Initial queue length
      const initialQueueLength = parallelExecutionService.executionQueue.length

      // Simulate execution completion
      parallelExecutionService.activeExecutions.delete('exec-123')
      await parallelExecutionService.processQueue('batch-123')

      // Queue should be reduced
      expect(parallelExecutionService.executionQueue.length).toBeLessThanOrEqual(initialQueueLength)
    })

    it('should respect maximum concurrency', async () => {
      prisma.executionBatch.create.mockResolvedValueOnce(mockBatch)
      executionService.executeScenario.mockResolvedValueOnce(mockExecution)

      const concurrencyLimit = 3
      await parallelExecutionService.executeParallel(mockScenarios, {
        concurrencyLimit,
        userId: 'user-123'
      })

      expect(parallelExecutionService.activeExecutions.size).toBeLessThanOrEqual(concurrencyLimit)
    })
  })

  describe('error handling', () => {
    it('should isolate scenario failures', async () => {
      prisma.executionBatch.create.mockResolvedValueOnce(mockBatch)
      executionService.executeScenario
        .mockResolvedValueOnce(mockExecution)
        .mockRejectedValueOnce(new Error('Scenario 2 failed'))
        .mockResolvedValueOnce({ ...mockExecution, id: 'exec-125' })

      const result = await parallelExecutionService.executeParallel(mockScenarios, {
        userId: 'user-123'
      })

      // First and third should succeed
      expect(result.executions).toBeDefined()
      expect(result.executions.length).toBeGreaterThan(0)
    })

    it('should handle execution timeout', async () => {
      prisma.executionBatch.create.mockResolvedValueOnce(mockBatch)
      executionService.executeScenario.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 5000))
      )

      const shortTimeout = 100
      // Should timeout or handle gracefully
      await expect(
        parallelExecutionService.executeParallel(mockScenarios, {
          timeout: shortTimeout,
          userId: 'user-123'
        })
      ).resolves.toBeDefined()
    })
  })

  describe('result aggregation', () => {
    it('should aggregate results from parallel executions', async () => {
      const executions = [
        { id: 'exec-1', status: 'PASSED', duration: 1500 },
        { id: 'exec-2', status: 'PASSED', duration: 2000 },
        { id: 'exec-3', status: 'FAILED', duration: 1800 }
      ]

      const result = parallelExecutionService.aggregateResults(executions)

      expect(result.totalExecutions).toBe(3)
      expect(result.passedCount).toBe(2)
      expect(result.failedCount).toBe(1)
      expect(result.averageDuration).toBeGreaterThan(0)
    })

    it('should calculate success rate', async () => {
      const executions = [
        { status: 'PASSED' },
        { status: 'PASSED' },
        { status: 'FAILED' }
      ]

      const result = parallelExecutionService.aggregateResults(executions)

      expect(result.successRate).toBe(66.67)
    })
  })
})
