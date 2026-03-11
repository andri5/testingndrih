import { createScenario, getUserScenarios, getScenarioById, updateScenario, deleteScenario } from '../scenarioService'
import { prisma } from '../../lib/prisma.js'

jest.mock('../../lib/prisma.js')

describe('ScenarioService - Comprehensive Business Logic Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createScenario', () => {
    it('should successfully create a scenario with valid data', async () => {
      const mockData = {
        id: 'scenario-1',
        name: 'Login Test',
        description: 'Test login flow',
        url: 'https://example.com',
        userId: 'user-123',
        steps: 0
      }
      
      prisma.scenario.create.mockResolvedValue(mockData)

      const result = await createScenario('user-123', {
        name: 'Login Test',
        description: 'Test login flow',
        url: 'https://example.com'
      })

      expect(result.id).toBe('scenario-1')
      expect(result.name).toBe('Login Test')
      expect(prisma.scenario.create).toHaveBeenCalledWith({
        data: {
          name: 'Login Test',
          description: 'Test login flow',
          url: 'https://example.com',
          userId: 'user-123',
          steps: 0
        }
      })
    })

    it('should reject empty name', async () => {
      await expect(
        createScenario('user-123', { url: 'https://example.com' })
      ).rejects.toThrow('Name and URL are required')
    })

    it('should reject empty URL', async () => {
      await expect(
        createScenario('user-123', { name: 'Test' })
      ).rejects.toThrow('Name and URL are required')
    })

    it('should reject invalid URL format', async () => {
      await expect(
        createScenario('user-123', { name: 'Test', url: 'invalid.com' })
      ).rejects.toThrow('URL must start with http:// or https://')
    })

    it('should accept https URLs', async () => {
      prisma.scenario.create.mockResolvedValue({
        id: 'scenario-1',
        name: 'Test',
        url: 'https://valid.com',
        userId: 'user-123',
        description: '',
        steps: 0
      })

      const result = await createScenario('user-123', {
        name: 'Test',
        url: 'https://valid.com'
      })

      expect(result).toBeDefined()
      expect(prisma.scenario.create).toHaveBeenCalled()
    })

    it('should accept http URLs', async () => {
      prisma.scenario.create.mockResolvedValue({
        id: 'scenario-1',
        name: 'Test',
        url: 'http://valid.com',
        userId: 'user-123',
        description: '',
        steps: 0
      })

      const result = await createScenario('user-123', {
        name: 'Test',
        url: 'http://valid.com'
      })

      expect(result).toBeDefined()
    })

    it('should handle database errors gracefully', async () => {
      prisma.scenario.create.mockRejectedValue(new Error('Database error'))

      await expect(
        createScenario('user-123', {
          name: 'Test',
          url: 'https://example.com'
        })
      ).rejects.toThrow('Failed to create scenario')
    })
  })

  describe('getUserScenarios', () => {
    it('should retrieve scenarios with pagination', async () => {
      const mockScenarios = {
        scenarios: [
          { id: '1', name: 'Scenario 1', url: 'https://example.com' },
          { id: '2', name: 'Scenario 2', url: 'https://example.com' }
        ],
        total: 10
      }

      prisma.scenario.findMany.mockResolvedValue(mockScenarios.scenarios)
      prisma.scenario.count.mockResolvedValue(mockScenarios.total)

      const result = await getUserScenarios('user-123', { skip: 0, take: 20 })

      expect(result.scenarios.length).toBe(2)
      expect(result.total).toBe(10)
      expect(prisma.scenario.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: expect.objectContaining({
          id: true,
          name: true,
          url: true
        })
      })
    })

    it('should use default pagination values', async () => {
      prisma.scenario.findMany.mockResolvedValue([])
      prisma.scenario.count.mockResolvedValue(0)

      await getUserScenarios('user-123')

      expect(prisma.scenario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20
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

    it('should handle database errors', async () => {
      prisma.scenario.findMany.mockRejectedValue(new Error('DB error'))

      await expect(getUserScenarios('user-123')).rejects.toThrow('Failed to fetch scenarios')
    })
  })

  describe('getScenarioById', () => {
    it('should retrieve scenario with steps', async () => {
      const mockScenario = {
        id: 'scenario-1',
        name: 'Test',
        userId: 'user-123',
        testSteps: [
          { id: 'step-1', stepNumber: 1, type: 'NAVIGATE' }
        ]
      }

      prisma.scenario.findUnique.mockResolvedValue(mockScenario)

      const result = await getScenarioById('scenario-1', 'user-123')

      expect(result.id).toBe('scenario-1')
      expect(result.testSteps.length).toBe(1)
    })

    it('should throw error if scenario not found', async () => {
      prisma.scenario.findUnique.mockResolvedValue(null)

      await expect(getScenarioById('invalid-id', 'user-123')).rejects.toThrow('Scenario not found')
    })

    it('should throw error on unauthorized access', async () => {
      const mockScenario = {
        id: 'scenario-1',
        name: 'Test',
        userId: 'other-user-123'
      }

      prisma.scenario.findUnique.mockResolvedValue(mockScenario)

      await expect(getScenarioById('scenario-1', 'user-123')).rejects.toThrow('Unauthorized access to this scenario')
    })

    it('should handle database errors', async () => {
      prisma.scenario.findUnique.mockRejectedValue(new Error('DB error'))

      await expect(getScenarioById('scenario-1', 'user-123')).rejects.toThrow('Failed to fetch scenario')
    })
  })

  describe('updateScenario', () => {
    it('should update scenario with valid data', async () => {
      prisma.scenario.findUnique.mockResolvedValue({
        id: 'scenario-1',
        userId: 'user-123'
      })

      prisma.scenario.update.mockResolvedValue({
        id: 'scenario-1',
        name: 'Updated Name',
        url: 'https://updated.com'
      })

      const result = await updateScenario('scenario-1', 'user-123', {
        name: 'Updated Name',
        url: 'https://updated.com'
      })

      expect(result.name).toBe('Updated Name')
      expect(prisma.scenario.update).toHaveBeenCalled()
    })

    it('should reject invalid URL format', async () => {
      prisma.scenario.findUnique.mockResolvedValue({
        id: 'scenario-1',
        userId: 'user-123'
      })

      await expect(
        updateScenario('scenario-1', 'user-123', { url: 'invalid.com' })
      ).rejects.toThrow('URL must start with http:// or https://')
    })

    it('should throw error if scenario not found', async () => {
      prisma.scenario.findUnique.mockResolvedValue(null)

      await expect(
        updateScenario('scenario-1', 'user-123', { name: 'Test' })
      ).rejects.toThrow('Scenario not found')
    })

    it('should throw error on unauthorized access', async () => {
      prisma.scenario.findUnique.mockResolvedValue({
        id: 'scenario-1',
        userId: 'other-user'
      })

      await expect(
        updateScenario('scenario-1', 'user-123', { name: 'Test' })
      ).rejects.toThrow('Unauthorized: Cannot update this scenario')
    })

    it('should handle partial updates', async () => {
      prisma.scenario.findUnique.mockResolvedValue({
        id: 'scenario-1',
        userId: 'user-123'
      })

      prisma.scenario.update.mockResolvedValue({
        id: 'scenario-1',
        name: 'Updated'
      })

      await updateScenario('scenario-1', 'user-123', { name: 'Updated' })

      expect(prisma.scenario.update).toHaveBeenCalled()
    })
  })

  describe('deleteScenario', () => {
    it('should delete scenario if user is owner', async () => {
      prisma.scenario.findUnique.mockResolvedValue({
        id: 'scenario-1',
        userId: 'user-123'
      })

      prisma.testStep.deleteMany.mockResolvedValue({ count: 0 })
      prisma.scenario.delete.mockResolvedValue({ id: 'scenario-1' })

      const result = await deleteScenario('scenario-1', 'user-123')

      expect(result.message).toContain('successfully')
      expect(prisma.scenario.delete).toHaveBeenCalledWith({
        where: { id: 'scenario-1' }
      })
    })

    it('should throw error if scenario not found', async () => {
      prisma.scenario.findUnique.mockResolvedValue(null)

      await expect(deleteScenario('scenario-1', 'user-123')).rejects.toThrow('Scenario not found')
    })

    it('should throw error on unauthorized access', async () => {
      prisma.scenario.findUnique.mockResolvedValue({
        id: 'scenario-1',
        userId: 'other-user'
      })

      await expect(deleteScenario('scenario-1', 'user-123')).rejects.toThrow('Unauthorized')
    })

    it('should handle database errors', async () => {
      prisma.scenario.findUnique.mockResolvedValue({
        id: 'scenario-1',
        userId: 'user-123'
      })

      prisma.scenario.delete.mockRejectedValue(new Error('DB error'))

      await expect(deleteScenario('scenario-1', 'user-123')).rejects.toThrow('Failed to delete scenario')
    })
  })
})
