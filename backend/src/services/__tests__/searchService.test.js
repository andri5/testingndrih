import { prisma } from '../../lib/prisma.js'
import {
  searchScenarios,
  getScenariosByDate,
  getRecentScenarios,
  getMostExecutedScenarios,
  filterScenarios
} from '../searchService.js'

describe('SearchService', () => {
  const userId = 'user-1'

  describe('searchScenarios', () => {
    it('should search scenarios with default options', async () => {
      const mockScenarios = [
        { id: '1', name: 'Login Test', description: 'desc', url: 'http://test.com', steps: 3, createdAt: new Date(), updatedAt: new Date(), _count: { executions: 2 } }
      ]
      prisma.scenario.findMany.mockResolvedValue(mockScenarios)
      prisma.scenario.count.mockResolvedValue(1)

      const result = await searchScenarios(userId)

      expect(result.scenarios).toHaveLength(1)
      expect(result.scenarios[0].executionCount).toBe(2)
      expect(result.total).toBe(1)
      expect(result.hasMore).toBe(false)
    })

    it('should search with query text', async () => {
      prisma.scenario.findMany.mockResolvedValue([])
      prisma.scenario.count.mockResolvedValue(0)

      const result = await searchScenarios(userId, { query: 'login' })

      expect(prisma.scenario.findMany).toHaveBeenCalled()
      expect(result.scenarios).toHaveLength(0)
      expect(result.total).toBe(0)
    })

    it('should search with date range', async () => {
      prisma.scenario.findMany.mockResolvedValue([])
      prisma.scenario.count.mockResolvedValue(0)

      const result = await searchScenarios(userId, {
        startDate: '2026-01-01',
        endDate: '2026-12-31'
      })

      expect(result.scenarios).toHaveLength(0)
    })

    it('should handle hasMore correctly', async () => {
      prisma.scenario.findMany.mockResolvedValue([
        { id: '1', name: 'Test', _count: { executions: 0 } }
      ])
      prisma.scenario.count.mockResolvedValue(50)

      const result = await searchScenarios(userId, { skip: 0, take: 20 })

      expect(result.hasMore).toBe(true)
    })

    it('should throw error on failure', async () => {
      prisma.scenario.findMany.mockRejectedValue(new Error('DB error'))

      await expect(searchScenarios(userId)).rejects.toThrow('Search failed')
    })
  })

  describe('getScenariosByDate', () => {
    it('should return scenarios grouped by date', async () => {
      const date = new Date('2026-03-15')
      prisma.scenario.findMany.mockResolvedValue([
        { id: '1', name: 'Test 1', createdAt: date },
        { id: '2', name: 'Test 2', createdAt: date }
      ])

      const result = await getScenariosByDate(userId)

      expect(typeof result).toBe('object')
      const keys = Object.keys(result)
      expect(keys.length).toBeGreaterThan(0)
      expect(result[keys[0]]).toHaveLength(2)
    })

    it('should throw error on failure', async () => {
      prisma.scenario.findMany.mockRejectedValue(new Error('DB error'))

      await expect(getScenariosByDate(userId)).rejects.toThrow('Failed to get scenarios by date')
    })
  })

  describe('getRecentScenarios', () => {
    it('should return recent scenarios with default limit', async () => {
      const mockScenarios = [
        { id: '1', name: 'Recent', url: 'http://test.com', steps: 2, updatedAt: new Date() }
      ]
      prisma.scenario.findMany.mockResolvedValue(mockScenarios)

      const result = await getRecentScenarios(userId)

      expect(result).toEqual(mockScenarios)
      expect(prisma.scenario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 })
      )
    })

    it('should accept custom limit', async () => {
      prisma.scenario.findMany.mockResolvedValue([])

      await getRecentScenarios(userId, 10)

      expect(prisma.scenario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 })
      )
    })

    it('should throw error on failure', async () => {
      prisma.scenario.findMany.mockRejectedValue(new Error('DB error'))

      await expect(getRecentScenarios(userId)).rejects.toThrow('Failed to get recent scenarios')
    })
  })

  describe('getMostExecutedScenarios', () => {
    it('should return most executed scenarios', async () => {
      prisma.scenario.findMany.mockResolvedValue([
        {
          id: '1', name: 'Popular', url: 'http://test.com', steps: 5,
          executions: [
            { status: 'PASSED' },
            { status: 'FAILED' },
            { status: 'PASSED' }
          ]
        }
      ])

      const result = await getMostExecutedScenarios(userId)

      expect(result).toHaveLength(1)
      expect(result[0].executionCount).toBe(3)
      expect(result[0].passedCount).toBe(2)
      expect(result[0].failedCount).toBe(1)
    })

    it('should throw error on failure', async () => {
      prisma.scenario.findMany.mockRejectedValue(new Error('DB error'))

      await expect(getMostExecutedScenarios(userId)).rejects.toThrow('Failed to get most executed scenarios')
    })
  })

  describe('filterScenarios', () => {
    it('should filter scenarios with options', async () => {
      prisma.scenario.findMany.mockResolvedValue([
        {
          id: '1', name: 'Test', description: 'desc', url: 'http://test.com', steps: 5,
          executions: [{ status: 'PASSED' }, { status: 'PASSED' }]
        }
      ])
      prisma.scenario.count.mockResolvedValue(1)

      const result = await filterScenarios(userId, { minSteps: 1, maxSteps: 10 })

      expect(result.scenarios).toHaveLength(1)
      expect(result.scenarios[0].successRate).toBe(100)
    })

    it('should filter by minimum executions', async () => {
      prisma.scenario.findMany.mockResolvedValue([
        { id: '1', name: 'Few', executions: [{ status: 'PASSED' }] },
        { id: '2', name: 'Many', executions: [{ status: 'PASSED' }, { status: 'FAILED' }, { status: 'PASSED' }] }
      ])
      prisma.scenario.count.mockResolvedValue(2)

      const result = await filterScenarios(userId, { minExecutions: 2 })

      expect(result.scenarios).toHaveLength(1)
      expect(result.scenarios[0].name).toBe('Many')
    })

    it('should filter with search text', async () => {
      prisma.scenario.findMany.mockResolvedValue([])
      prisma.scenario.count.mockResolvedValue(0)

      const result = await filterScenarios(userId, { searchText: 'login' })

      expect(result.scenarios).toHaveLength(0)
    })

    it('should throw error on failure', async () => {
      prisma.scenario.findMany.mockRejectedValue(new Error('DB error'))

      await expect(filterScenarios(userId)).rejects.toThrow('Advanced filter failed')
    })
  })
})
