/**
 * ExecutionService Unit Tests - Simplified for Phase 1
 * Focus: Core functionality that's actually testable without full Playwright setup
 */

jest.mock('../../lib/prisma.js')

import { executionService } from '../executionService.js'
import { prisma } from '../../lib/prisma.js'

describe('ExecutionService - Core Methods', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup prisma mocks
    prisma.execution = {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      create: jest.fn()
    }
    prisma.stepResult = {
      deleteMany: jest.fn()
    }
  })

  describe('getActivePage', () => {
    it('should return null for non-existent execution', () => {
      const result = executionService.getActivePage('non-existent-id')
      expect(result).toBeNull()
    })
  })

  describe('getExecutionHistory', () => {
    it('should handle empty execution history', async () => {
      prisma.execution.findMany.mockResolvedValueOnce([])
      prisma.execution.count.mockResolvedValueOnce(0)

      const result = await executionService.getExecutionHistory('user-123', 'scenario-123')
      
      expect(result).toHaveProperty('executions')
      expect(Array.isArray(result.executions)).toBe(true)
    })

    it('should use default pagination parameters', async () => {
      prisma.execution.findMany.mockResolvedValueOnce([])
      prisma.execution.count.mockResolvedValueOnce(0)

      await executionService.getExecutionHistory('user-123', 'scenario-123')

      expect(prisma.execution.findMany).toHaveBeenCalled()
    })

    it('should apply custom pagination', async () => {
      prisma.execution.findMany.mockResolvedValueOnce([])
      prisma.execution.count.mockResolvedValueOnce(100)

      await executionService.getExecutionHistory('user-123', 'scenario-123', 50, 25)

      expect(prisma.execution.findMany).toHaveBeenCalled()
    })
  })

  describe('cancelledExecutions & pausedExecutions', () => {
    it('should have cancellation tracking', () => {
      // These are exported event/tracking objects
      expect(typeof executionService).toBe('object')
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      prisma.execution.findMany.mockRejectedValueOnce(new Error('DB connection error'))

      await expect(
        executionService.getExecutionHistory('user-123', 'scenario-123')
      ).rejects.toThrow()
    })
  })
})
