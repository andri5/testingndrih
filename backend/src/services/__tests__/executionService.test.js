/**
 * Execution Service Unit Tests - Data Layer Focus
 */

jest.mock('../../lib/prisma.js')
jest.mock('../screenshotComparisonService.js')

import { executionService } from '../executionService.js'
import { prisma } from '../../lib/prisma.js'

const USER_ID = 'user-123'
const SCENARIO_ID = 'scenario-123'

describe('ExecutionService - Data Layer Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    prisma.execution = {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
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

    prisma.$transaction = jest.fn(async (callback) => callback(prisma))
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
        { id: 'exec-1', status: 'PASSED', createdAt: new Date() },
        { id: 'exec-2', status: 'FAILED', createdAt: new Date() }
      ]

      prisma.execution.findMany.mockResolvedValueOnce(mockExecutions)
      prisma.execution.count.mockResolvedValueOnce(10)

      const result = await executionService.getExecutionHistory(USER_ID, SCENARIO_ID, 20, 0)

      expect(prisma.execution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: USER_ID, scenarioId: SCENARIO_ID },
          take: 20,
          skip: 0,
          orderBy: { createdAt: 'desc' }
        })
      )
      expect(result.executions).toHaveLength(2)
      expect(result.total).toBe(10)
      expect(result.hasMore).toBe(false)
    })

    it('should use default pagination if not provided', async () => {
      prisma.execution.findMany.mockResolvedValueOnce([])
      prisma.execution.count.mockResolvedValueOnce(0)

      await executionService.getExecutionHistory(USER_ID)

      expect(prisma.execution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 20, skip: 0 })
      )
    })

    it('should order executions by most recent first', async () => {
      prisma.execution.findMany.mockResolvedValueOnce([])
      prisma.execution.count.mockResolvedValueOnce(0)

      await executionService.getExecutionHistory(USER_ID, SCENARIO_ID)

      expect(prisma.execution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } })
      )
    })

    it('should support different page sizes', async () => {
      prisma.execution.findMany.mockResolvedValueOnce([])
      prisma.execution.count.mockResolvedValueOnce(100)

      await executionService.getExecutionHistory(USER_ID, SCENARIO_ID, 50, 0)

      expect(prisma.execution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50, skip: 0 })
      )
    })

    it('should handle offset pagination', async () => {
      prisma.execution.findMany.mockResolvedValueOnce([])
      prisma.execution.count.mockResolvedValueOnce(100)

      await executionService.getExecutionHistory(USER_ID, SCENARIO_ID, 20, 40)

      expect(prisma.execution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 20, skip: 40 })
      )
      expect(prisma.execution.findMany).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      prisma.execution.findMany.mockRejectedValueOnce(new Error('Database error'))

      await expect(
        executionService.getExecutionHistory(USER_ID, SCENARIO_ID)
      ).rejects.toThrow('Database error')
    })

    it('should validate input parameters', async () => {
      prisma.execution.findMany.mockResolvedValueOnce([])
      prisma.execution.count.mockResolvedValueOnce(0)

      const result = await executionService.getExecutionHistory(null)
      expect(result).toBeDefined()
      expect(result.executions).toEqual([])
    })

    it('should handle missing scenario gracefully', () => {
      expect(() => executionService.getActivePage('invalid-id')).not.toThrow()
    })
  })

  describe('Execution Status Tracking', () => {
    it('should track execution progress', async () => {
      prisma.execution.findMany.mockResolvedValueOnce([
        { id: 'exec-123', status: 'RUNNING', totalSteps: 5, passedSteps: 2, failedSteps: 0 }
      ])
      prisma.execution.count.mockResolvedValueOnce(1)

      const result = await executionService.getExecutionHistory(USER_ID, SCENARIO_ID)
      expect(result.executions[0].status).toBe('RUNNING')
    })

    it('should calculate execution statistics', async () => {
      prisma.execution.findMany.mockResolvedValueOnce([
        { id: 'exec-1', status: 'PASSED', totalSteps: 5, passedSteps: 5 },
        { id: 'exec-2', status: 'FAILED', totalSteps: 5, passedSteps: 3 }
      ])
      prisma.execution.count.mockResolvedValueOnce(2)

      const result = await executionService.getExecutionHistory(USER_ID, SCENARIO_ID)
      expect(result.total).toBe(2)
    })

    it('should handle mixed pass/fail results', async () => {
      prisma.execution.findMany.mockResolvedValueOnce([
        { id: 'exec-1', status: 'PASSED', passedSteps: 5, failedSteps: 0 },
        { id: 'exec-2', status: 'FAILED', passedSteps: 3, failedSteps: 2 }
      ])
      prisma.execution.count.mockResolvedValueOnce(2)

      const result = await executionService.getExecutionHistory(USER_ID, SCENARIO_ID)

      expect(result.executions).toHaveLength(2)
      expect(result.executions[0].status).toBe('PASSED')
      expect(result.executions[1].status).toBe('FAILED')
    })
  })

  describe('Execution Lifecycle', () => {
    it('should delete execution records', async () => {
      prisma.execution.findFirst.mockResolvedValueOnce({ id: 'exec-123', userId: USER_ID })
      prisma.execution.delete.mockResolvedValueOnce({ id: 'exec-123' })

      const result = await executionService.deleteExecution(USER_ID, 'exec-123')

      expect(result.message).toBe('Execution deleted')
      expect(prisma.execution.findFirst).toHaveBeenCalledWith({
        where: { id: 'exec-123', userId: USER_ID }
      })
      expect(prisma.execution.delete).toHaveBeenCalledWith({
        where: { id: 'exec-123' }
      })
    })

    it('should throw when deleting non-existent execution', async () => {
      prisma.execution.findFirst.mockResolvedValueOnce(null)

      await expect(
        executionService.deleteExecution(USER_ID, 'missing-id')
      ).rejects.toThrow('Execution not found')
    })
  })
})
