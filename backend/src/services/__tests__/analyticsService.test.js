import { jest, describe, it, expect, beforeEach } from '@jest/globals'
import * as analyticsService from '../analyticsService.js'

jest.mock('../../lib/prisma.js')

describe('Analytics Service', () => {
  const userId = 'test-user-123'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Exports', () => {
    it('should export getAnalyticsSummary function', () => {
      expect(typeof analyticsService.getAnalyticsSummary).toBe('function')
    })

    it('should export getPassFailTrend function', () => {
      expect(typeof analyticsService.getPassFailTrend).toBe('function')
    })

    it('should export getTopFailingSteps function', () => {
      expect(typeof analyticsService.getTopFailingSteps).toBe('function')
    })

    it('should export getExecutionVolume function', () => {
      expect(typeof analyticsService.getExecutionVolume).toBe('function')
    })

    it('should export getScenarioPerformance function', () => {
      expect(typeof analyticsService.getScenarioPerformance).toBe('function')
    })

    it('should export getExecutionHistory function', () => {
      expect(typeof analyticsService.getExecutionHistory).toBe('function')
    })

    it('should export getScenarioMetrics function', () => {
      expect(typeof analyticsService.getScenarioMetrics).toBe('function')
    })

    it('should export exportAnalyticsData function', () => {
      expect(typeof analyticsService.exportAnalyticsData).toBe('function')
    })
  })

  describe('Function Signatures', () => {
    it('getAnalyticsSummary should be async', async () => {
      const result = analyticsService.getAnalyticsSummary(userId)
      expect(result instanceof Promise).toBe(true)
    })

    it('getPassFailTrend should accept userId and days parameters', async () => {
      const result = analyticsService.getPassFailTrend(userId, 30)
      expect(result instanceof Promise).toBe(true)
    })

    it('getTopFailingSteps should accept userId and limit parameters', async () => {
      const result = analyticsService.getTopFailingSteps(userId, 10)
      expect(result instanceof Promise).toBe(true)
    })

    it('getExecutionVolume should accept userId and days parameters', async () => {
      const result = analyticsService.getExecutionVolume(userId, 30)
      expect(result instanceof Promise).toBe(true)
    })

    it('getScenarioPerformance should accept userId and limit parameters', async () => {
      const result = analyticsService.getScenarioPerformance(userId, 20)
      expect(result instanceof Promise).toBe(true)
    })
  })
})
