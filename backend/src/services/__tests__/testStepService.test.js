jest.mock('../../lib/prisma.js')

import { prisma } from '../../lib/prisma.js'
import {
  createTestStep,
  getTestSteps,
  getTestStep,
  updateTestStep,
  deleteTestStep,
  reorderSteps,
  getStepTypes,
  validateStep
} from '../testStepService.js'

describe('TestStepService', () => {
  const userId = 'user-1'
  const scenarioId = 'scenario-1'

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup prisma mocks
    prisma.scenario = {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }

    prisma.testStep = {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    }

    // Important: Mock $transaction to execute callback directly
    prisma.$transaction = jest.fn(async (callback) => {
      const tx = {
        testStep: {
          findFirst: jest.fn(),
          create: jest.fn()
        }
      }
      // Use the real testStep mocks
      tx.testStep.findFirst = prisma.testStep.findFirst
      tx.testStep.create = prisma.testStep.create
      return callback(tx)
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('createTestStep', () => {
    it('should create a test step', async () => {
      prisma.scenario.findUnique.mockResolvedValue({ id: scenarioId, userId })
      prisma.testStep.findFirst.mockResolvedValue({ stepNumber: 2 })
      prisma.testStep.create.mockResolvedValue({
        id: 'step-1', scenarioId, stepNumber: 3, type: 'CLICK', description: 'Click button'
      })
      prisma.testStep.count.mockResolvedValue(3)
      prisma.scenario.update.mockResolvedValue({ id: scenarioId, steps: 3 })

      const result = await createTestStep(scenarioId, userId, {
        type: 'CLICK',
        description: 'Click button',
        selector: '#btn'
      })

      expect(result.id).toBe('step-1')
      expect(prisma.testStep.create).toHaveBeenCalled()
      expect(prisma.scenario.update).toHaveBeenCalled()
    })

    it('should auto-increment step number if not provided', async () => {
      prisma.scenario.findUnique.mockResolvedValue({ id: scenarioId, userId })
      prisma.testStep.findFirst.mockResolvedValue({ stepNumber: 5 })
      prisma.testStep.create.mockResolvedValue({ id: 'step-1', stepNumber: 6 })
      prisma.testStep.count.mockResolvedValue(6)
      prisma.scenario.update.mockResolvedValue({})

      await createTestStep(scenarioId, userId, {
        type: 'CLICK',
        description: 'Click'
      })

      expect(prisma.testStep.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ stepNumber: 6 })
        })
      )
    })

    it('should use provided step number', async () => {
      prisma.scenario.findUnique.mockResolvedValue({ id: scenarioId, userId })
      prisma.testStep.create.mockResolvedValue({ id: 'step-1', stepNumber: 1 })
      prisma.testStep.count.mockResolvedValue(1)
      prisma.scenario.update.mockResolvedValue({})

      await createTestStep(scenarioId, userId, {
        stepNumber: 1,
        type: 'NAVIGATE',
        description: 'Go to page'
      })

      expect(prisma.testStep.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ stepNumber: 1 })
        })
      )
    })

    it('should throw if scenario not found', async () => {
      prisma.scenario.findUnique.mockResolvedValue(null)

      await expect(
        createTestStep(scenarioId, userId, { type: 'CLICK', description: 'test' })
      ).rejects.toThrow('Failed to create test step')
    })

    it('should throw if unauthorized', async () => {
      prisma.scenario.findUnique.mockResolvedValue({ id: scenarioId, userId: 'other-user' })

      await expect(
        createTestStep(scenarioId, userId, { type: 'CLICK', description: 'test' })
      ).rejects.toThrow('Failed to create test step')
    })

    it('should throw if type missing', async () => {
      prisma.scenario.findUnique.mockResolvedValue({ id: scenarioId, userId })

      await expect(
        createTestStep(scenarioId, userId, { description: 'test' })
      ).rejects.toThrow('Failed to create test step')
    })

    it('should throw if description missing', async () => {
      prisma.scenario.findUnique.mockResolvedValue({ id: scenarioId, userId })

      await expect(
        createTestStep(scenarioId, userId, { type: 'CLICK' })
      ).rejects.toThrow('Failed to create test step')
    })
  })

  describe('getTestSteps', () => {
    it('should return test steps for a scenario', async () => {
      prisma.scenario.findUnique.mockResolvedValue({ id: scenarioId, userId })
      prisma.testStep.findMany.mockResolvedValue([
        { id: 'step-1', stepNumber: 1 },
        { id: 'step-2', stepNumber: 2 }
      ])
      prisma.testStep.count.mockResolvedValue(2)

      const result = await getTestSteps(scenarioId, userId)

      expect(result.steps).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.hasMore).toBe(false)
    })

    it('should handle pagination', async () => {
      prisma.scenario.findUnique.mockResolvedValue({ id: scenarioId, userId })
      prisma.testStep.findMany.mockResolvedValue([{ id: 'step-1' }])
      prisma.testStep.count.mockResolvedValue(100)

      const result = await getTestSteps(scenarioId, userId, { skip: 0, take: 10 })

      expect(result.hasMore).toBe(true)
    })

    it('should throw if scenario not found', async () => {
      prisma.scenario.findUnique.mockResolvedValue(null)

      await expect(getTestSteps(scenarioId, userId)).rejects.toThrow('Failed to get test steps')
    })
  })

  describe('getTestStep', () => {
    it('should return a single test step', async () => {
      prisma.testStep.findUnique.mockResolvedValue({
        id: 'step-1', scenario: { userId }
      })

      const result = await getTestStep('step-1', userId)

      expect(result.id).toBe('step-1')
    })

    it('should throw if step not found', async () => {
      prisma.testStep.findUnique.mockResolvedValue(null)

      await expect(getTestStep('nonexistent', userId)).rejects.toThrow('Failed to get test step')
    })

    it('should throw if unauthorized', async () => {
      prisma.testStep.findUnique.mockResolvedValue({
        id: 'step-1', scenario: { userId: 'other-user' }
      })

      await expect(getTestStep('step-1', userId)).rejects.toThrow('Failed to get test step')
    })
  })

  describe('updateTestStep', () => {
    it('should update a test step', async () => {
      prisma.testStep.findUnique.mockResolvedValue({
        id: 'step-1', type: 'CLICK', description: 'Old', scenario: { userId }
      })
      prisma.testStep.update.mockResolvedValue({
        id: 'step-1', type: 'FILL', description: 'New'
      })

      const result = await updateTestStep('step-1', userId, {
        type: 'FILL', description: 'New'
      })

      expect(result.type).toBe('FILL')
      expect(prisma.testStep.update).toHaveBeenCalled()
    })

    it('should throw if step not found', async () => {
      prisma.testStep.findUnique.mockResolvedValue(null)

      await expect(
        updateTestStep('nonexistent', userId, { type: 'FILL' })
      ).rejects.toThrow('Failed to update test step')
    })
  })

  describe('deleteTestStep', () => {
    it('should delete a test step and update scenario count', async () => {
      prisma.testStep.findUnique.mockResolvedValue({
        id: 'step-1', scenarioId, scenario: { userId, id: scenarioId }
      })
      prisma.testStep.delete.mockResolvedValue({ id: 'step-1' })
      prisma.testStep.count.mockResolvedValue(2)
      prisma.scenario.update.mockResolvedValue({})

      const result = await deleteTestStep('step-1', userId)

      expect(result.message).toBe('Test step deleted successfully')
      expect(prisma.testStep.delete).toHaveBeenCalled()
      expect(prisma.scenario.update).toHaveBeenCalled()
    })

    it('should throw if step not found', async () => {
      prisma.testStep.findUnique.mockResolvedValue(null)

      await expect(deleteTestStep('nonexistent', userId)).rejects.toThrow('Failed to delete test step')
    })
  })

  describe('reorderSteps', () => {
    it('should reorder steps within a scenario', async () => {
      prisma.scenario.findUnique.mockResolvedValue({ id: scenarioId, userId })
      prisma.testStep.findUnique.mockResolvedValue({ id: 'step-1', scenarioId })
      prisma.testStep.update.mockResolvedValue({ id: 'step-1', stepNumber: 1 })

      const stepOrders = [
        { stepId: 'step-1', sequenceNumber: 1 }
      ]

      const result = await reorderSteps(scenarioId, userId, stepOrders)

      expect(result).toHaveLength(1)
    })

    it('should throw if scenario not found', async () => {
      prisma.scenario.findUnique.mockResolvedValue(null)

      await expect(
        reorderSteps(scenarioId, userId, [{ stepId: 'step-1' }])
      ).rejects.toThrow('Failed to reorder steps')
    })

    it('should throw if step not in scenario', async () => {
      prisma.scenario.findUnique.mockResolvedValue({ id: scenarioId, userId })
      prisma.testStep.findUnique.mockResolvedValue({ id: 'step-1', scenarioId: 'other-scenario' })

      await expect(
        reorderSteps(scenarioId, userId, [{ stepId: 'step-1' }])
      ).rejects.toThrow('Failed to reorder steps')
    })
  })

  describe('getStepTypes', () => {
    it('should return predefined step types', () => {
      const types = getStepTypes()

      expect(Array.isArray(types)).toBe(true)
      expect(types.length).toBeGreaterThan(0)
      expect(types.find(t => t.type === 'NAVIGATE')).toBeDefined()
      expect(types.find(t => t.type === 'CLICK')).toBeDefined()
      expect(types.find(t => t.type === 'FILL')).toBeDefined()
      expect(types.find(t => t.type === 'WAIT')).toBeDefined()
      expect(types.find(t => t.type === 'ASSERTION')).toBeDefined()
      expect(types.find(t => t.type === 'SCREENSHOT')).toBeDefined()
      expect(types.find(t => t.type === 'API_CALL')).toBeDefined()
    })
  })

  describe('validateStep', () => {
    it('should validate a valid step', () => {
      const result = validateStep('CLICK', { description: 'Click button' })
      expect(result.valid).toBe(true)
    })

    it('should reject invalid step type', () => {
      const result = validateStep('INVALID_TYPE', { description: 'test' })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid step type')
    })

    it('should reject step without description', () => {
      const result = validateStep('CLICK', {})
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Description is required')
    })
  })
})
