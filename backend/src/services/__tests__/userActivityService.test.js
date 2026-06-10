import {
  buildExecutionActivity,
  buildScenarioActivity,
  getUserActivityLog,
  getUserActivitySummary,
} from '../userActivityService.js'
import { prisma } from '../../lib/prisma.js'

jest.mock('../../lib/prisma.js', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    execution: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    scenario: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    chainExecution: {
      findMany: jest.fn(),
    },
    securityScan: {
      findMany: jest.fn(),
    },
  },
}))

describe('userActivityService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('buildExecutionActivity', () => {
    it('formats execution events', () => {
      const event = buildExecutionActivity({
        id: 'ex-1',
        status: 'PASSED',
        testType: 'STANDARD',
        createdAt: new Date('2026-06-10T10:00:00Z'),
        scenario: { name: 'Login test' },
      })

      expect(event.type).toBe('EXECUTION')
      expect(event.action).toContain('Login test')
      expect(event.status).toBe('PASSED')
    })
  })

  describe('buildScenarioActivity', () => {
    it('marks new scenarios as created', () => {
      const now = new Date('2026-06-10T10:00:00Z')
      const event = buildScenarioActivity({
        id: 'sc-1',
        name: 'Checkout',
        url: 'https://example.com',
        createdAt: now,
        updatedAt: now,
      })

      expect(event.type).toBe('SCENARIO_CREATED')
    })
  })

  describe('getUserActivitySummary', () => {
    it('returns USER accounts with last activity', async () => {
      prisma.user.findMany.mockResolvedValue([
        {
          id: 'u1',
          email: 'user@test.com',
          name: 'User',
          role: 'USER',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ])
      prisma.execution.findMany.mockResolvedValue([
        {
          id: 'ex-1',
          status: 'PASSED',
          testType: 'STANDARD',
          createdAt: new Date('2026-06-10T12:00:00Z'),
          scenario: { name: 'Demo' },
        },
      ])
      prisma.scenario.findMany.mockResolvedValue([])
      prisma.chainExecution.findMany.mockResolvedValue([])
      prisma.securityScan.findMany.mockResolvedValue([])
      prisma.scenario.count.mockResolvedValue(2)
      prisma.execution.count.mockResolvedValue(5)

      const result = await getUserActivitySummary()

      expect(result).toHaveLength(1)
      expect(result[0].lastActivity?.type).toBe('EXECUTION')
      expect(result[0].stats.executions).toBe(5)
    })
  })

  describe('getUserActivityLog', () => {
    it('rejects non-USER accounts', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'a1',
        email: 'admin@test.com',
        role: 'ADMIN',
      })

      await expect(getUserActivityLog('a1')).rejects.toMatchObject({ status: 400 })
    })
  })
})
