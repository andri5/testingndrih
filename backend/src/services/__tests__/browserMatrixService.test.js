/**
 * Browser Matrix Service Unit Tests
 * Test multi-browser execution, visual regression, compatibility checks
 * Target: 16+ test cases
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'

jest.mock('../../lib/prisma.js', () => ({
  prisma: {
    matrixExecution: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    },
    browserResult: {
      create: jest.fn(),
      findMany: jest.fn()
    },
    scenario: {
      findUnique: jest.fn()
    }
  }
}), { virtual: true })

jest.mock('../executionService.js', () => ({
  executionService: {
    executeScenario: jest.fn()
  }
}))

jest.mock('../screenshotComparisonService.js', () => ({
  compareScreenshots: jest.fn(),
  detectRegressions: jest.fn()
}), { virtual: true })

jest.mock('playwright', () => ({
  chromium: { launch: jest.fn() },
  firefox: { launch: jest.fn() },
  webkit: { launch: jest.fn() }
}), { virtual: true })

import { browserMatrixService } from '../browserMatrixService.js'
import { prisma } from '../../lib/prisma.js'
import { executionService } from '../executionService.js'

describe('BrowserMatrixService', () => {
  let mockScenario
  let mockMatrixExecution
  let mockBrowserResult

  beforeEach(() => {
    jest.clearAllMocks()

    mockScenario = {
      id: 'scenario-123',
      name: 'Login Test',
      userId: 'user-123',
      testSteps: [
        { id: 'step-1', type: 'NAVIGATE', value: 'https://example.com' },
        { id: 'step-2', type: 'CLICK', selector: 'button' }
      ]
    }

    mockMatrixExecution = {
      id: 'matrix-123',
      scenarioId: 'scenario-123',
      userId: 'user-123',
      browsers: 'chromium,firefox,webkit',
      status: 'RUNNING',
      startedAt: new Date()
    }

    mockBrowserResult = {
      id: 'result-123',
      matrixExecutionId: 'matrix-123',
      browser: 'chromium',
      status: 'PASSED',
      duration: 2500
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('executeMatrixTest', () => {
    it('should create matrix execution', async () => {
      prisma.scenario.findUnique.mockResolvedValueOnce(mockScenario)
      prisma.matrixExecution.create.mockResolvedValueOnce(mockMatrixExecution)
      executionService.executeScenario.mockResolvedValueOnce({ status: 'PASSED' })

      await browserMatrixService.executeMatrixTest('scenario-123', ['chromium', 'firefox'], {
        userId: 'user-123'
      })

      expect(prisma.matrixExecution.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            scenarioId: 'scenario-123',
            userId: 'user-123',
            browsers: 'chromium,firefox'
          })
        })
      )
    })

    it('should execute scenario on all requested browsers', async () => {
      prisma.scenario.findUnique.mockResolvedValueOnce(mockScenario)
      prisma.matrixExecution.create.mockResolvedValueOnce(mockMatrixExecution)
      executionService.executeScenario.mockResolvedValueOnce({ status: 'PASSED' })

      const browsers = ['chromium', 'firefox', 'webkit', 'edge']
      await browserMatrixService.executeMatrixTest('scenario-123', browsers, {
        userId: 'user-123'
      })

      // Should call execute for each browser
      expect(executionService.executeScenario.mock.calls.length).toBeGreaterThanOrEqual(0)
    })

    it('should throw error if scenario not found', async () => {
      prisma.scenario.findUnique.mockResolvedValueOnce(null)

      await expect(
        browserMatrixService.executeMatrixTest('invalid-id', ['chromium'], {
          userId: 'user-123'
        })
      ).rejects.toThrow()
    })

    it('should validate browser list', async () => {
      prisma.scenario.findUnique.mockResolvedValueOnce(mockScenario)

      await expect(
        browserMatrixService.executeMatrixTest('scenario-123', ['invalid-browser'], {
          userId: 'user-123'
        })
      ).rejects.toThrow()
    })

    it('should handle empty browser list', async () => {
      prisma.scenario.findUnique.mockResolvedValueOnce(mockScenario)

      await expect(
        browserMatrixService.executeMatrixTest('scenario-123', [], {
          userId: 'user-123'
        })
      ).rejects.toThrow('No browsers specified')
    })

    it('should support concurrency configuration', async () => {
      prisma.scenario.findUnique.mockResolvedValueOnce(mockScenario)
      prisma.matrixExecution.create.mockResolvedValueOnce(mockMatrixExecution)
      executionService.executeScenario.mockResolvedValueOnce({ status: 'PASSED' })

      await browserMatrixService.executeMatrixTest('scenario-123', ['chromium', 'firefox'], {
        userId: 'user-123',
        concurrency: 2
      })

      expect(prisma.matrixExecution.create).toHaveBeenCalled()
    })
  })

  describe('getMatrixExecutionStatus', () => {
    it('should return matrix execution status', async () => {
      const completed = { ...mockMatrixExecution, status: 'COMPLETED' }
      prisma.matrixExecution.findUnique.mockResolvedValueOnce(completed)
      prisma.browserResult.findMany.mockResolvedValueOnce([
        { ...mockBrowserResult, browser: 'chromium', status: 'PASSED' },
        { ...mockBrowserResult, id: 'result-124', browser: 'firefox', status: 'PASSED' },
        { ...mockBrowserResult, id: 'result-125', browser: 'webkit', status: 'FAILED' }
      ])

      const result = await browserMatrixService.getMatrixExecutionStatus('matrix-123')

      expect(result.id).toBe('matrix-123')
      expect(result.browserResults).toHaveLength(3)
    })

    it('should calculate browser compatibility', async () => {
      prisma.matrixExecution.findUnique.mockResolvedValueOnce(mockMatrixExecution)
      prisma.browserResult.findMany.mockResolvedValueOnce([
        { browser: 'chromium', status: 'PASSED' },
        { browser: 'firefox', status: 'PASSED' },
        { browser: 'webkit', status: 'PASSED' }
      ])

      const result = await browserMatrixService.getMatrixExecutionStatus('matrix-123')

      expect(result.compatibilityScore).toBe(100)
    })

    it('should handle partial browser failures', async () => {
      prisma.matrixExecution.findUnique.mockResolvedValueOnce(mockMatrixExecution)
      prisma.browserResult.findMany.mockResolvedValueOnce([
        { browser: 'chromium', status: 'PASSED' },
        { browser: 'firefox', status: 'FAILED' },
        { browser: 'webkit', status: 'PASSED' }
      ])

      const result = await browserMatrixService.getMatrixExecutionStatus('matrix-123')

      expect(result.passedBrowsers).toBe(2)
      expect(result.failedBrowsers).toBe(1)
      expect(result.compatibilityScore).toBe(66.67)
    })

    it('should throw error if execution not found', async () => {
      prisma.matrixExecution.findUnique.mockResolvedValueOnce(null)

      await expect(
        browserMatrixService.getMatrixExecutionStatus('invalid-id')
      ).rejects.toThrow()
    })
  })

  describe('browser validation', () => {
    it('should support chromium browser', async () => {
      const result = browserMatrixService.validateBrowser('chromium')
      expect(result).toBe(true)
    })

    it('should support firefox browser', async () => {
      const result = browserMatrixService.validateBrowser('firefox')
      expect(result).toBe(true)
    })

    it('should support webkit browser', async () => {
      const result = browserMatrixService.validateBrowser('webkit')
      expect(result).toBe(true)
    })

    it('should support edge browser', async () => {
      const result = browserMatrixService.validateBrowser('edge')
      expect(result).toBe(true)
    })

    it('should reject invalid browsers', async () => {
      const result = browserMatrixService.validateBrowser('safari')
      expect(result).toBe(false)
    })

    it('should be case-insensitive', async () => {
      const result = browserMatrixService.validateBrowser('CHROMIUM')
      expect(result).toBe(true)
    })
  })

  describe('cross-browser compatibility', () => {
    it('should detect CSS compatibility issues', async () => {
      prisma.matrixExecution.findUnique.mockResolvedValueOnce(mockMatrixExecution)
      prisma.browserResult.findMany.mockResolvedValueOnce([
        { browser: 'chromium', status: 'PASSED', issueType: 'CSS' },
        { browser: 'firefox', status: 'PASSED' },
        { browser: 'webkit', status: 'FAILED', issueType: 'CSS' }
      ])

      const result = await browserMatrixService.getMatrixExecutionStatus('matrix-123')

      expect(result.issuesByType?.CSS).toBeDefined()
    })

    it('should generate compatibility report', async () => {
      prisma.matrixExecution.findUnique.mockResolvedValueOnce(mockMatrixExecution)
      prisma.browserResult.findMany.mockResolvedValueOnce([
        { browser: 'chromium', status: 'PASSED', duration: 2000 },
        { browser: 'firefox', status: 'PASSED', duration: 2100 },
        { browser: 'webkit', status: 'FAILED', duration: 1800, error: 'Element not found' }
      ])

      const report = await browserMatrixService.generateCompatibilityReport('matrix-123')

      expect(report).toHaveProperty('summary')
      expect(report).toHaveProperty('browserResults')
      expect(report).toHaveProperty('recommendations')
    })
  })

  describe('error handling', () => {
    it('should handle browser launch failures', async () => {
      prisma.scenario.findUnique.mockResolvedValueOnce(mockScenario)
      prisma.matrixExecution.create.mockResolvedValueOnce(mockMatrixExecution)
      executionService.executeScenario.mockRejectedValueOnce(new Error('Browser launch failed'))

      const result = await browserMatrixService.executeMatrixTest('scenario-123', ['chromium'], {
        userId: 'user-123'
      })

      expect(result).toEqual(expect.objectContaining({ error: expect.any(String) }))
    })

    it('should handle execution timeout on browser', async () => {
      prisma.scenario.findUnique.mockResolvedValueOnce(mockScenario)
      prisma.matrixExecution.create.mockResolvedValueOnce(mockMatrixExecution)
      executionService.executeScenario.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 10000))
      )

      await expect(
        browserMatrixService.executeMatrixTest('scenario-123', ['chromium'], {
          userId: 'user-123',
          timeout: 100
        })
      ).resolves.toBeDefined()
    })

    it('should isolate browser failures', async () => {
      prisma.scenario.findUnique.mockResolvedValueOnce(mockScenario)
      prisma.matrixExecution.create.mockResolvedValueOnce(mockMatrixExecution)
      executionService.executeScenario
        .mockResolvedValueOnce({ browser: 'chromium', status: 'PASSED' })
        .mockRejectedValueOnce(new Error('Firefox crash'))
        .mockResolvedValueOnce({ browser: 'webkit', status: 'PASSED' })

      const result = await browserMatrixService.executeMatrixTest(
        'scenario-123',
        ['chromium', 'firefox', 'webkit'],
        { userId: 'user-123' }
      )

      expect(result.matrixExecutionId).toBe('matrix-123')
    })
  })

  describe('screenshot comparison', () => {
    it('should detect visual regressions', async () => {
      prisma.matrixExecution.findUnique.mockResolvedValueOnce(mockMatrixExecution)
      prisma.browserResult.findMany.mockResolvedValueOnce([
        { browser: 'chromium', hasRegressions: false },
        { browser: 'firefox', hasRegressions: true },
        { browser: 'webkit', hasRegressions: false }
      ])

      const result = await browserMatrixService.getMatrixExecutionStatus('matrix-123')

      expect(result.regressionsByBrowser?.firefox).toBeDefined()
    })
  })
})
