import { createScenario, getUserScenarios, getScenarioById, updateScenario, deleteScenario } from '../scenarioService'
import { prisma } from '../../lib/prisma.js'

describe('ScenarioService', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Mock prisma scenario methods
    prisma.scenario.create = jest.fn()
    prisma.scenario.findMany = jest.fn()
    prisma.scenario.findUnique = jest.fn()
    prisma.scenario.count = jest.fn()
    prisma.scenario.update = jest.fn()
    prisma.scenario.delete = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('createScenario', () => {
    it('should create a new scenario with valid data', async () => {
      const mockScenario = {
        id: 'test-id',
        name: 'Test Scenario',
        description: 'A test scenario',
        url: 'https://example.com',
        userId: 'user-123',
        steps: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      prisma.scenario.create.mockResolvedValue(mockScenario)

      const result = await createScenario('user-123', {
        name: 'Test Scenario',
        description: 'A test scenario',
        url: 'https://example.com'
      })

      expect(result).toEqual(mockScenario)
      expect(prisma.scenario.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Scenario',
          description: 'A test scenario',
          url: 'https://example.com',
          userId: 'user-123',
          steps: 0
        }
      })
    })

    it('should throw error if name is missing', async () => {
      await expect(
        createScenario('user-123', { url: 'https://example.com' })
      ).rejects.toThrow('Name and URL are required')
    })

    it('should throw error if URL is missing', async () => {
      await expect(
        createScenario('user-123', { name: 'Test' })
      ).rejects.toThrow('Name and URL are required')
    })

    it('should throw error if URL is invalid', async () => {
      await expect(
        createScenario('user-123', { name: 'Test', url: 'invalid.com' })
      ).rejects.toThrow('URL must start with http:// or https://')
    })
  })

  describe('getUserScenarios', () => {
    it('should fetch all scenarios for a user', async () => {
      const mockScenarios = [
        { id: '1', name: 'Scenario 1', steps: 5 },
        { id: '2', name: 'Scenario 2', steps: 3 }
      ]

      prisma.scenario.findMany.mockResolvedValue(mockScenarios)
      prisma.scenario.count.mockResolvedValue(2)

      const result = await getUserScenarios('user-123')

      expect(result.scenarios).toEqual(mockScenarios)
      expect(result.total).toBe(2)
    })

    it('should support pagination', async () => {
      prisma.scenario.findMany.mockResolvedValue([])
      prisma.scenario.count.mockResolvedValue(100)

      await getUserScenarios('user-123', { skip: 10, take: 5 })

      expect(prisma.scenario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5
        })
      )
    })

    it('should support custom ordering', async () => {
      prisma.scenario.findMany.mockResolvedValue([])
      prisma.scenario.count.mockResolvedValue(0)

      await getUserScenarios('user-123', { orderBy: 'name', orderDirection: 'asc' })

      expect(prisma.scenario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' }
        })
      )
    })
  })

  describe('getScenarioById', () => {
    it('should fetch a scenario by ID', async () => {
      const mockScenario = {
        id: 'test-id',
        name: 'Test Scenario',
        url: 'https://example.com',
        testSteps: [],
        executions: []
      }

      prisma.scenario.findUnique.mockResolvedValue(mockScenario)

      const result = await getScenarioById('test-id', 'user-123')

      expect(result).toEqual(mockScenario)
      expect(prisma.scenario.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        include: expect.any(Object)
      })
    })

    it('should throw error if scenario not found', async () => {
      prisma.scenario.findUnique.mockResolvedValue(null)

      await expect(
        getScenarioById('nonexistent', 'user-123')
      ).rejects.toThrow('Scenario not found')
    })
  })

  describe('updateScenario', () => {
    it('should update a scenario with new data', async () => {
      const updatedScenario = {
        id: 'test-id',
        name: 'Updated Scenario',
        url: 'https://updated.com'
      }

      prisma.scenario.update.mockResolvedValue(updatedScenario)

      const result = await updateScenario('test-id', 'user-123', {
        name: 'Updated Scenario',
        url: 'https://updated.com'
      })

      expect(result).toEqual(updatedScenario)
    })
  })

  describe('deleteScenario', () => {
    it('should delete a scenario', async () => {
      prisma.scenario.delete.mockResolvedValue({ id: 'test-id' })

      await deleteScenario('test-id', 'user-123')

      expect(prisma.scenario.delete).toHaveBeenCalledWith({
        where: { id: 'test-id' }
      })
    })
  })
})
