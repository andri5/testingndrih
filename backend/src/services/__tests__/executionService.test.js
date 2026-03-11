import { executionService } from '../executionService'
import { prisma } from '../../lib/prisma.js'
import { chromium } from 'playwright'

describe('ExecutionService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Spy on prisma methods and mock their return values
    jest.spyOn(prisma.scenario, 'findFirst').mockResolvedValue(null)
    jest.spyOn(prisma.scenario, 'update').mockResolvedValue({})
    
    jest.spyOn(prisma.execution, 'create').mockResolvedValue({})
    jest.spyOn(prisma.execution, 'findUnique').mockResolvedValue(null)
    jest.spyOn(prisma.execution, 'findFirst').mockResolvedValue(null)
    jest.spyOn(prisma.execution, 'update').mockResolvedValue({})
    jest.spyOn(prisma.execution, 'findMany').mockResolvedValue([])
    jest.spyOn(prisma.execution, 'count').mockResolvedValue(0)
    
    jest.spyOn(prisma.stepResult, 'create').mockResolvedValue({})
    jest.spyOn(prisma.stepResult, 'updateMany').mockResolvedValue({ count: 0 })
    
    // Mock Playwright
    jest.spyOn(chromium, 'launch').mockResolvedValue(null)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('executeScenario', () => {
    it('should throw error if scenario not found', async () => {
      prisma.scenario.findFirst.mockResolvedValue(null)

      await expect(
        executionService.executeScenario('user-123', 'nonexistent')
      ).rejects.toThrow('Scenario not found')
    })

    it('should throw error if no test steps', async () => {
      prisma.scenario.findFirst.mockResolvedValue({
        id: 'scenario-1',
        userId: 'user-123',
        testSteps: []
      })

      await expect(
        executionService.executeScenario('user-123', 'scenario-1')
      ).rejects.toThrow('Scenario has no test steps')
    })

    it('should create execution record', async () => {
      const mockScenario = {
        id: 'scenario-1',
        userId: 'user-123',
        url: 'https://example.com',
        testSteps: [
          { id: 'step-1', stepNumber: 1, type: 'NAVIGATE', data: { url: '' } }
        ]
      }

      const mockExecution = {
        id: 'exec-1',
        userId: 'user-123',
        scenarioId: 'scenario-1',
        status: 'RUNNING',
        totalSteps: 1,
        startTime: new Date(),
        stepResults: []
      }

      prisma.scenario.findFirst.mockResolvedValue(mockScenario)
      prisma.execution.create.mockResolvedValue(mockExecution)
      chromium.launch.mockResolvedValue({
        newContext: jest.fn().mockResolvedValue({
          newPage: jest.fn().mockResolvedValue({
            goto: jest.fn().mockResolvedValue(null),
            close: jest.fn()
          }),
          close: jest.fn()
        }),
        close: jest.fn()
      })

      const result = await executionService.executeScenario('user-123', 'scenario-1')

      expect(prisma.execution.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          scenarioId: 'scenario-1',
          status: 'RUNNING'
        }),
        include: { stepResults: true }
      })
    })
  })

  describe('getExecutionHistory', () => {
    it('should fetch execution history for a user', async () => {
      const mockExecutions = [
        {
          id: 'exec-1',
          status: 'PASSED',
          totalSteps: 5,
          executedSteps: 5,
          createdAt: new Date()
        },
        {
          id: 'exec-2',
          status: 'FAILED',
          totalSteps: 3,
          executedSteps: 2,
          createdAt: new Date()
        }
      ]

      prisma.execution.findMany.mockResolvedValue(mockExecutions)
      prisma.execution.count.mockResolvedValue(2)

      const result = await executionService.getExecutionHistory('user-123')

      expect(result.executions).toEqual(mockExecutions)
      expect(result.total).toBe(2)
    })

    it('should support pagination in execution history', async () => {
      prisma.execution.findMany.mockResolvedValue([])
      prisma.execution.count.mockResolvedValue(100)

      await executionService.getExecutionHistory('user-123', { skip: 10, take: 5 })

      expect(prisma.execution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5
        })
      )
    })
  })

  describe('getExecutionDetails', () => {
    it('should fetch detailed execution information', async () => {
      const mockExecution = {
        id: 'exec-1',
        userId: 'user-123',
        scenarioId: 'scenario-1',
        status: 'PASSED',
        totalSteps: 2,
        executedSteps: 2,
        startTime: new Date(),
        endTime: new Date(),
        stepResults: [
          {
            id: 'result-1',
            stepNumber: 1,
            status: 'PASSED',
            duration: 100,
            screenshot: 'path/to/screenshot.png'
          },
          {
            id: 'result-2',
            stepNumber: 2,
            status: 'PASSED',
            duration: 150,
            screenshot: 'path/to/screenshot2.png'
          }
        ]
      }

      prisma.execution.findUnique.mockResolvedValue(mockExecution)

      const result = await executionService.getExecutionDetails('exec-1', 'user-123')

      expect(result).toEqual(mockExecution)
      expect(result.stepResults).toHaveLength(2)
    })
  })
})
