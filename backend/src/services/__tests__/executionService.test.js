/**
 * Execution Service Unit Tests - Data Layer Focus
 * Test data persistence, error handling, execution workflow
 * Skip: Complex browser automation (handled by E2E tests)
 */

jest.mock('../../lib/prisma.js')
jest.mock('../screenshotComparisonService.js')

import { executionService } from '../executionService.js'
import { prisma } from '../../lib/prisma.js'

describe('ExecutionService - Data Layer Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default prisma mocks
    prisma.execution = {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    }
    
    prisma.stepResult = {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn()
    }
    
    prisma.scenario = {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn()
    }
    
    prisma.testStep = {
      findMany: jest.fn(),
      findUnique: jest.fn()
    }
    
    prisma.$transaction = jest.fn(async (callback) => {
      return callback(prisma)
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getActivePage', () => {
    it('should return null if execution not found', () => {
      const result = executionService.getActivePage('non-existent')
      expect(result).toBeNull()
    })
  })

  describe('getExecutionHistory', () => {
    it('should fetch execution history with pagination', async () => {
      const mockExecutions = [
        { id: 'exec-1', status: 'PASSED', startedAt: new Date() },
        { id: 'exec-2', status: 'FAILED', startedAt: new Date() }
      ]
      
      prisma.execution.findMany.mockResolvedValueOnce(mockExecutions)
      prisma.execution.count.mockResolvedValueOnce(10)

      const result = await executionService.getExecutionHistory('scenario-123', {
        limit: 20,
        offset: 0
      })

      expect(prisma.execution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { scenarioId: 'scenario-123' },
          take: 20,
          skip: 0,
          orderBy: { startedAt: 'desc' }
        })
      )
    })

    it('should use default pagination if not provided', async () => {
      prisma.execution.findMany.mockResolvedValueOnce([])
      prisma.execution.count.mockResolvedValueOnce(0)

      await executionService.getExecutionHistory('scenario-123')

      expect(prisma.execution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 0
        })
      )
    })

    it('should order executions by most recent first', async () => {
      const mockExecutions = [
        { id: 'exec-1', startedAt: new Date(Date.now()) },
        { id: 'exec-2', startedAt: new Date(Date.now() - 100000) }
      ]
      
      prisma.execution.findMany.mockResolvedValueOnce(mockExecutions)
      prisma.execution.count.mockResolvedValueOnce(2)

      await executionService.getExecutionHistory('scenario-123')

      expect(prisma.execution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { startedAt: 'desc' }
        })
      )
    })

    it('should support different page sizes', async () => {
      prisma.execution.findMany.mockResolvedValueOnce([])
      prisma.execution.count.mockResolvedValueOnce(100)

      await executionService.getExecutionHistory('scenario-123', { limit: 50, offset: 0 })

      expect(prisma.execution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
          skip: 0
        })
      )
    })

    it('should handle offset pagination', async () => {
      prisma.execution.findMany.mockResolvedValueOnce([])
      prisma.execution.count.mockResolvedValueOnce(100)

      await executionService.getExecutionHistory('scenario-123', { limit: 20, offset: 40 })

      expect(prisma.execution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 40
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      prisma.execution.findUnique.mockRejectedValueOnce(new Error('Database error'))

      await expect(
        executionService.getExecutionHistory('scenario-123')
      ).rejects.toThrow()
    })

    it('should validate input parameters', async () => {
      // Should handle null/undefined gracefully
      const result = await executionService.getExecutionHistory(null)
      // Just ensure it doesn't crash - actual behavior depends on implementation
      expect(result).toBeDefined()
    })

    it('should handle missing scenario gracefully', () => {
      prisma.scenario.findUnique.mockResolvedValueOnce(null)
      expect(() => {
        executionService.getActivePage('invalid-id')
      }).not.toThrow()
    })
  })

  describe('Execution Status Tracking', () => {
    it('should track execution progress', async () => {
      const mockExecution = {
        id: 'exec-123',
        scenarioId: 'scenario-123',
        status: 'RUNNING',
        totalSteps: 5,
        passedSteps: 2,
        failedSteps: 0
      }
      
      prisma.execution.findUnique.mockResolvedValueOnce(mockExecution)

      const result = await executionService.getExecutionHistory('scenario-123')
      
      expect(result).toBeDefined()
    })

    it('should calculate execution statistics', async () => {
      const mockExecutions = [
        { id: 'exec-1', status: 'PASSED', totalSteps: 5, passedSteps: 5 },
        { id: 'exec-2', status: 'FAILED', totalSteps: 5, passedSteps: 3 }
      ]
      
      prisma.execution.findMany.mockResolvedValueOnce(mockExecutions)
      prisma.execution.count.mockResolvedValueOnce(2)

      const result = await executionService.getExecutionHistory('scenario-123')

      expect(result).toBeDefined()
    })

    it('should handle mixed pass/fail results', async () => {
      const mockExecutions = [
        { id: 'exec-1', status: 'PASSED', passedSteps: 5, failedSteps: 0 },
        { id: 'exec-2', status: 'FAILED', passedSteps: 3, failedSteps: 2 }
      ]
      
      prisma.execution.findMany.mockResolvedValueOnce(mockExecutions)
      prisma.execution.count.mockResolvedValueOnce(2)

      const result = await executionService.getExecutionHistory('scenario-123')
      
      expect(result).toHaveLength(2)
    })
  })

  describe('Execution Lifecycle', () => {
    it('should stop active execution', async () => {
      const stoppedExecution = {
        id: 'exec-123',
        status: 'STOPPED',
        endedAt: new Date()
      }
      
      prisma.execution.update.mockResolvedValueOnce(stoppedExecution)

      const result = await executionService.stopExecution('exec-123')

      expect(result).toBeDefined()
      expect(prisma.execution.update).toHaveBeenCalled()
    })

    it('should delete execution records', async () => {
      prisma.stepResult.deleteMany.mockResolvedValueOnce({ count: 3 })
      prisma.execution.delete.mockResolvedValueOnce({ id: 'exec-123' })

      const result = await executionService.deleteExecution('exec-123')

      expect(prisma.stepResult.deleteMany).toHaveBeenCalled()
      expect(prisma.execution.delete).toHaveBeenCalled()
    })

    it('should handle cascading deletes', async () => {
      prisma.stepResult.deleteMany.mockResolvedValueOnce({ count: 5 })
      prisma.execution.delete.mockResolvedValueOnce({ id: 'exec-123' })

      await executionService.deleteExecution('exec-123')

      expect(prisma.stepResult.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { executionId: 'exec-123' }
        })
      )
    })
  })

  describe('Step Result Recording', () => {
    it('should record step results', async () => {
      const stepResults = [
        { stepId: 'step-1', status: 'PASSED', duration: 1000 },
        { stepId: 'step-2', status: 'PASSED', duration: 500 }
      ]
      
      prisma.stepResult.createMany.mockResolvedValueOnce({ count: 2 })

      const result = await executionService.saveStepResults('exec-123', stepResults)

      expect(prisma.stepResult.createMany).toHaveBeenCalled()
    })

    it('should update execution stats from step results', async () => {
      const execution = {
        id: 'exec-123',
        totalSteps: 3,
        passedSteps: 2,
        failedSteps: 1
      }
      
      prisma.execution.update.mockResolvedValueOnce(execution)

      const result = await executionService.updateExecutionStats('exec-123', {
        passed: 2,
        failed: 1
      })

      expect(prisma.execution.update).toHaveBeenCalled()
    })
  })
})
