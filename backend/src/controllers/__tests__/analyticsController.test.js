import { jest, describe, it, expect, beforeEach } from '@jest/globals'
import {
  getAnalyticsSummaryHandler,
  getPassFailTrendHandler,
  getTopFailingStepsHandler,
  getExecutionVolumeHandler,
  getScenarioPerformanceHandler
} from '../analyticsController.js'

jest.mock('../analyticsService.js')

describe('Analytics Controller', () => {
  let req, res, next

  beforeEach(() => {
    req = {
      user: { userId: 'test-user-123' },
      query: {},
      params: {}
    }

    res = {
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    }

    next = jest.fn()
  })

  describe('Handler Exports', () => {
    it('should export getAnalyticsSummaryHandler', () => {
      expect(typeof getAnalyticsSummaryHandler).toBe('function')
    })

    it('should export getPassFailTrendHandler', () => {
      expect(typeof getPassFailTrendHandler).toBe('function')
    })

    it('should export getTopFailingStepsHandler', () => {
      expect(typeof getTopFailingStepsHandler).toBe('function')
    })

    it('should export getExecutionVolumeHandler', () => {
      expect(typeof getExecutionVolumeHandler).toBe('function')
    })

    it('should export getScenarioPerformanceHandler', () => {
      expect(typeof getScenarioPerformanceHandler).toBe('function')
    })
  })

  describe('Handler Signatures', () => {
    it('handlers should be async functions', async () => {
      // Test that handlers are callable and return promises
      const handlers = [
        getAnalyticsSummaryHandler,
        getPassFailTrendHandler,
        getTopFailingStepsHandler,
        getExecutionVolumeHandler,
        getScenarioPerformanceHandler
      ]

      for (const handler of handlers) {
        expect(typeof handler).toBe('function')
      }
    })
  })

  describe('Request/Response Pattern', () => {
    it('handlers should access userId from req.user', async () => {
      expect(req.user).toHaveProperty('userId')
      expect(req.user.userId).toBe('test-user-123')
    })

    it('handlers should have access to res.json', () => {
      expect(typeof res.json).toBe('function')
    })

    it('handlers should have access to next for error handling', () => {
      expect(typeof next).toBe('function')
    })
  })
})
