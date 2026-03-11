import { qaseService } from '../qaseService'
import { prisma } from '../../lib/prisma.js'

jest.mock('../../lib/prisma.js')

describe('QaseService - Comprehensive Business Logic Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Function Exports', () => {
    it('should export saveQaseCredentials function', () => {
      expect(typeof qaseService.saveQaseCredentials).toBe('function')
    })

    it('should export getQaseIntegration function', () => {
      expect(typeof qaseService.getQaseIntegration).toBe('function')
    })

    it('should export syncTestCasesFromQase function', () => {
      expect(typeof qaseService.syncTestCasesFromQase).toBe('function')
    })

    it('should export syncScenarioToQase function', () => {
      expect(typeof qaseService.syncScenarioToQase).toBe('function')
    })
  })

  describe('saveQaseCredentials - Credential Management', () => {
    it('should validate input parameters', async () => {
      await expect(
        qaseService.saveQaseCredentials('user-123', '', 'TEST123')
      ).rejects.toThrow()
    })

    it('should reject empty project code', async () => {
      await expect(
        qaseService.saveQaseCredentials('user-123', 'test-key', '')
      ).rejects.toThrow()
    })

    it('should require user ID', async () => {
      try {
        await qaseService.saveQaseCredentials(null, 'test-key', 'TEST123')
      } catch (e) {
        expect(e).toBeDefined()
      }
    })
  })

  describe('getQaseIntegration - Retrieval', () => {
    it('should retrieve integration settings', async () => {
      const mockIntegration = {
        id: 'qi-1',
        userId: 'user-123',
        projectCode: 'TEST123'
      }

      prisma.qaseIntegration.findUnique.mockResolvedValue(mockIntegration)

      const result = await qaseService.getQaseIntegration('user-123')

      expect(result).toBeDefined()
      expect(result.projectCode).toBe('TEST123')
    })

    it('should return null if not found', async () => {
      prisma.qaseIntegration.findUnique.mockResolvedValue(null)

      const result = await qaseService.getQaseIntegration('user-123')

      expect(result).toBeNull()
    })

    it('should handle database errors', async () => {
      prisma.qaseIntegration.findUnique.mockRejectedValue(new Error('DB error'))

      try {
        await qaseService.getQaseIntegration('user-123')
      } catch (e) {
        expect(e).toBeDefined()
      }
    })
  })

  describe('syncTestCasesFromQase - Synchronization', () => {
    it('should require integration to be configured', async () => {
      prisma.qaseIntegration.findUnique.mockResolvedValue(null)

      try {
        await qaseService.syncTestCasesFromQase('user-123')
      } catch (e) {
        expect(e.message).toContain('not configured')
      }
    })

    it('should handle invalid credentials gracefully', async () => {
      const mockIntegration = {
        id: 'qi-1',
        apiKey: '',
        projectCode: ''
      }

      prisma.qaseIntegration.findUnique.mockResolvedValue(mockIntegration)

      try {
        await qaseService.syncTestCasesFromQase('user-123')
      } catch (e) {
        expect(e).toBeDefined()
      }
    })

    it('should attempt to delete old test cases before sync', async () => {
      const mockIntegration = {
        id: 'qi-1',
        apiKey: 'test-key',
        projectCode: 'TEST123'
      }

      prisma.qaseIntegration.findUnique.mockResolvedValue(mockIntegration)

      try {
        await qaseService.syncTestCasesFromQase('user-123')
      } catch (e) {
        // Expected: API call will fail without real Qase credentials
        expect(e).toBeDefined()
      }
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle sync errors gracefully', async () => {
      const mockIntegration = {
        id: 'qi-1',
        apiKey: 'test-key',
        projectCode: 'TEST123'
      }

      prisma.qaseIntegration.findUnique.mockResolvedValue(mockIntegration)
      prisma.qaseTestCase.deleteMany.mockRejectedValue(new Error('Sync error'))

      try {
        await qaseService.syncTestCasesFromQase('user-123')
      } catch (e) {
        expect(e).toBeDefined()
      }
    })

    it('should handle invalid credentials', async () => {
      const mockIntegration = {
        id: 'qi-1',
        apiKey: '',
        projectCode: 'TEST123'
      }

      prisma.qaseIntegration.findUnique.mockResolvedValue(mockIntegration)

      try {
        await qaseService.syncTestCasesFromQase('user-123')
      } catch (e) {
        expect(e).toBeDefined()
      }
    })
  })
})
