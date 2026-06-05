import { createApiTest, runApiTest } from '../apiTestService.js'
import { prisma } from '../../lib/prisma.js'

jest.mock('../../lib/prisma.js')

describe('apiTestService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  describe('createApiTest', () => {
    it('creates test when user owns scenario', async () => {
      prisma.scenario.findUnique.mockResolvedValue({ userId: 'user-1' })
      prisma.apiTest.create.mockResolvedValue({ id: 'api-1', name: 'Health check' })

      const result = await createApiTest('user-1', 'scenario-1', {
        name: 'Health check',
        method: 'GET',
        url: 'https://api.example.com/health',
        expectedCode: 200
      })

      expect(result.id).toBe('api-1')
    })

    it('rejects missing required fields', async () => {
      prisma.scenario.findUnique.mockResolvedValue({ userId: 'user-1' })
      await expect(
        createApiTest('user-1', 'scenario-1', { method: 'GET' })
      ).rejects.toThrow('name, method, and url are required')
    })
  })

  describe('runApiTest', () => {
    it('records passed result when status matches', async () => {
      prisma.apiTest.findUnique.mockResolvedValue({
        id: 'api-1',
        name: 'Health',
        method: 'GET',
        url: 'https://api.example.com/health',
        headers: null,
        body: null,
        expectedCode: 200,
        scenario: { userId: 'user-1', name: 'Scenario A' }
      })
      global.fetch.mockResolvedValue({
        status: 200,
        text: async () => '{"ok":true}'
      })
      prisma.apiTestResult.create.mockResolvedValue({
        id: 'res-1',
        passed: true,
        status: 200,
        responseTime: 50
      })

      const result = await runApiTest('user-1', 'api-1')

      expect(result.result.passed).toBe(true)
      expect(prisma.apiTestResult.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ passed: true, status: 200 })
        })
      )
    })

    it('records failed result on network error', async () => {
      prisma.apiTest.findUnique.mockResolvedValue({
        id: 'api-1',
        name: 'Health',
        method: 'GET',
        url: 'https://api.example.com/health',
        headers: null,
        body: null,
        expectedCode: 200,
        scenario: { userId: 'user-1', name: 'Scenario A' }
      })
      global.fetch.mockRejectedValue(new Error('Network error'))
      prisma.apiTestResult.create.mockResolvedValue({
        id: 'res-1',
        passed: false,
        errorMessage: 'Network error'
      })

      const result = await runApiTest('user-1', 'api-1')
      expect(result.result.passed).toBe(false)
    })
  })
})
