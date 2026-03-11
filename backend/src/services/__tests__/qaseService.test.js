import { qaseService } from '../qaseService'
import { prisma } from '../../lib/prisma.js'

describe('QaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Spy on prisma methods and mock their return values
    jest.spyOn(prisma.qaseIntegration, 'findUnique').mockResolvedValue(null)
    jest.spyOn(prisma.qaseIntegration, 'create').mockResolvedValue({})
    jest.spyOn(prisma.qaseIntegration, 'update').mockResolvedValue({})
    jest.spyOn(prisma.qaseIntegration, 'deleteMany').mockResolvedValue({ count: 0 })
    
    jest.spyOn(prisma.qaseTestCase, 'createMany').mockResolvedValue({ count: 0 })
    jest.spyOn(prisma.qaseTestCase, 'deleteMany').mockResolvedValue({ count: 0 })
    jest.spyOn(prisma.qaseTestCase, 'findMany').mockResolvedValue([])
    jest.spyOn(prisma.qaseTestCase, 'count').mockResolvedValue(0)
    
    // Mock fetch
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
    global.fetch.mockClear()
  })

  describe('saveQaseCredentials', () => {
    it('should save valid Qase credentials', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        statusText: 'OK'
      })

      const mockIntegration = {
        userId: 'user-123',
        apiKey: 'test-token',
        projectCode: 'TEST123',
        isConnected: true,
        lastSyncedAt: new Date()
      }

      prisma.qaseIntegration.deleteMany.mockResolvedValue({})
      prisma.qaseIntegration.create.mockResolvedValue(mockIntegration)

      const result = await qaseService.saveQaseCredentials('user-123', 'test-token', 'TEST123')

      expect(result.message).toBe('Credentials saved')
      expect(result.projectCode).toBe('TEST123')
      expect(prisma.qaseIntegration.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          apiKey: 'test-token',
          projectCode: 'TEST123',
          isConnected: true,
          lastSyncedAt: expect.any(Date)
        }
      })
    })

    it('should throw error if API key is missing', async () => {
      await expect(
        qaseService.saveQaseCredentials('user-123', '', 'TEST123')
      ).rejects.toThrow('API key and project code are required')
    })

    it('should throw error if project code is missing', async () => {
      await expect(
        qaseService.saveQaseCredentials('user-123', 'test-token', '')
      ).rejects.toThrow('API key and project code are required')
    })

    it('should throw error if credentials are invalid', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        statusText: 'Unauthorized'
      })

      await expect(
        qaseService.saveQaseCredentials('user-123', 'invalid-token', 'TEST123')
      ).rejects.toThrow('Invalid credentials: Unauthorized')
    })

    it('should verify credentials before saving', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        statusText: 'OK'
      })

      prisma.qaseIntegration.deleteMany.mockResolvedValue({})
      prisma.qaseIntegration.create.mockResolvedValue({})

      await qaseService.saveQaseCredentials('user-123', 'test-token', 'TEST123')

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.qase.io/v1/project/TEST123',
        {
          headers: { 'Token': 'test-token' }
        }
      )
    })
  })

  describe('getQaseIntegration', () => {
    it('should fetch Qase integration without exposing API key', async () => {
      const mockIntegration = {
        userId: 'user-123',
        apiKey: 'secret-key',
        projectCode: 'TEST123',
        isConnected: true,
        lastSyncedAt: new Date()
      }

      prisma.qaseIntegration.findUnique.mockResolvedValue(mockIntegration)

      const result = await qaseService.getQaseIntegration('user-123')

      // Verify API key is not returned
      expect(result.apiKey).toBeUndefined()
      expect(result.projectCode).toBe('TEST123')
      expect(result.isConnected).toBe(true)
    })

    it('should return null if integration not found', async () => {
      prisma.qaseIntegration.findUnique.mockResolvedValue(null)

      const result = await qaseService.getQaseIntegration('user-123')

      expect(result).toBeNull()
    })
  })

  describe('syncCasesFromQase', () => {
    it('should throw error if integration not found', async () => {
      prisma.qaseIntegration.findUnique.mockResolvedValue(null)

      await expect(
        qaseService.syncCasesFromQase('user-123')
      ).rejects.toThrow('Qase integration not found')
    })

    it('should sync test cases from Qase API', async () => {
      const mockIntegration = {
        userId: 'user-123',
        apiKey: 'test-token',
        projectCode: 'TEST123',
        isConnected: true
      }

      const mockCases = {
        result: {
          entities: [
            {
              id: 1,
              title: 'Test Case 1',
              description: 'Description 1',
              preconditions: 'Setup steps'
            },
            {
              id: 2,
              title: 'Test Case 2',
              description: 'Description 2',
              preconditions: 'Setup'
            }
          ]
        }
      }

      prisma.qaseIntegration.findUnique.mockResolvedValue(mockIntegration)
      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockCases)
      })
      prisma.qaseTestCase.deleteMany.mockResolvedValue({})
      prisma.qaseTestCase.createMany.mockResolvedValue({ count: 2 })

      const result = await qaseService.syncCasesFromQase('user-123')

      expect(result.count).toBe(2)
      expect(prisma.qaseTestCase.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' }
      })
    })
  })

  describe('publishExecutionToQase', () => {
    it('should publish execution results to Qase', async () => {
      const mockIntegration = {
        userId: 'user-123',
        apiKey: 'test-token',
        projectCode: 'TEST123'
      }

      prisma.qaseIntegration.findUnique.mockResolvedValue(mockIntegration)
      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ result: { id: 'run-123' } })
      })

      const result = await qaseService.publishExecutionToQase(
        'user-123',
        'exec-1',
        [
          { caseId: 1, status: 'passed', duration: 100 },
          { caseId: 2, status: 'failed', duration: 150, errorMessage: 'Failed' }
        ]
      )

      expect(result.runId).toBe('run-123')
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.qase.io/v1'),
        expect.any(Object)
      )
    })
  })
})
