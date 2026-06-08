import { jest, describe, it, expect } from '@jest/globals'
import {
  getAnalyticsSummary,
  getPassFailTrend,
  getTopFailingSteps,
  getExecutionVolume,
  getScenarioPerformance,
  getExecutionHistory,
  getScenarioMetrics,
  exportAnalyticsData,
  getFlakySteps
} from '../analyticsService.js'

describe('Analytics Service', () => {
  describe('Exports', () => {
    it('should export getAnalyticsSummary function', () => {
      expect(typeof getAnalyticsSummary).toBe('function')
    })

    it('should export getPassFailTrend function', () => {
      expect(typeof getPassFailTrend).toBe('function')
    })

    it('should export getTopFailingSteps function', () => {
      expect(typeof getTopFailingSteps).toBe('function')
    })

    it('should export getExecutionVolume function', () => {
      expect(typeof getExecutionVolume).toBe('function')
    })

    it('should export getScenarioPerformance function', () => {
      expect(typeof getScenarioPerformance).toBe('function')
    })

    it('should export getExecutionHistory function', () => {
      expect(typeof getExecutionHistory).toBe('function')
    })

    it('should export getScenarioMetrics function', () => {
      expect(typeof getScenarioMetrics).toBe('function')
    })

    it('should export exportAnalyticsData function', () => {
      expect(typeof exportAnalyticsData).toBe('function')
    })

    it('should export getFlakySteps function', () => {
      expect(typeof getFlakySteps).toBe('function')
    })
  })

  describe('Function Signatures', () => {
    it('all exported analytics functions are callable', () => {
      const fns = [
        getAnalyticsSummary,
        getPassFailTrend,
        getTopFailingSteps,
        getExecutionVolume,
        getScenarioPerformance,
        getFlakySteps,
        getExecutionHistory,
        getScenarioMetrics,
        exportAnalyticsData
      ]
      fns.forEach((fn) => {
        expect(typeof fn).toBe('function')
        expect(fn.length).toBeGreaterThanOrEqual(1)
      })
    })
  })
})
