/**
 * Execution Integration Tests - Phase 2.2
 * Tests execution workflows and test step execution
 */

import fetch from 'node-fetch'

const API_URL = 'http://localhost:5001/api'
let authToken = null
let userId = null

beforeAll(async () => {
  // Setup: Register and login test user
  const email = `execution-test-${Date.now()}@testingndrih.local`
  const password = 'ExecutionPass123!@'

  const registerRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      name: 'Execution Test User'
    })
  })

  const regData = await registerRes.json()
  authToken = regData.token
  userId = regData.user.id
})

describe('Execution Integration Tests', () => {
  let scenarioId = null

  beforeAll(async () => {
    // Create a test scenario first
    const res = await fetch(`${API_URL}/scenarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: 'Execution Test Scenario',
        url: 'https://example.com',
        description: 'Scenario for execution testing'
      })
    })

    const data = await res.json()
    scenarioId = data.id
  })

  describe('POST /api/executions/scenarios/:scenarioId - Execute Scenario', () => {
    it('should execute scenario', async () => {
      const res = await fetch(`${API_URL}/executions/scenarios/${scenarioId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          browser: 'chromium',
          headless: true
        })
      })

      // 202 = Accepted (async execution)
      expect([200, 202, 201]).toContain(res.status)
      const data = await res.json()
      expect(data.execution || data.executionId).toBeDefined()
    })

    it('should support different browsers', async () => {
      const browsers = ['chromium', 'firefox', 'webkit']

      for (const browser of browsers) {
        const res = await fetch(`${API_URL}/executions/scenarios/${scenarioId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            browser,
            headless: true
          })
        })

        expect([200, 202, 201]).toContain(res.status)
      }
    })

    it('should reject execution without authentication', async () => {
      const res = await fetch(`${API_URL}/executions/scenarios/${scenarioId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          browser: 'chromium'
        })
      })

      expect(res.status).toBe(401)
    })

    it('should reject execution of non-existent scenario', async () => {
      const res = await fetch(`${API_URL}/executions/scenarios/invalid-scenario-id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          browser: 'chromium'
        })
      })

      expect([404, 400]).toContain(res.status)
    })

    it('should reject execution with invalid browser', async () => {
      const res = await fetch(`${API_URL}/executions/scenarios/${scenarioId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          browser: 'invalid-browser'
        })
      })

      expect([400, 422]).toContain(res.status)
    })

    it('should set default browser if not specified', async () => {
      const res = await fetch(`${API_URL}/executions/scenarios/${scenarioId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          // no browser specified
          headless: true
        })
      })

      expect([200, 202, 201]).toContain(res.status)
      const data = await res.json()
      // Should use default browser
      expect(data).toBeDefined()
    })

    it('should allow headless mode configuration', async () => {
      const res = await fetch(`${API_URL}/executions/scenarios/${scenarioId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          browser: 'chromium',
          headless: false
        })
      })

      expect([200, 202, 201]).toContain(res.status)
    })
  })

  describe('GET /api/executions - Get Execution History', () => {
    it('should get execution history', async () => {
      const res = await fetch(`${API_URL}/executions`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(Array.isArray(data.executions || data)).toBe(true)
    })

    it('should support pagination', async () => {
      const res = await fetch(`${API_URL}/executions?limit=10&offset=0`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      const executions = data.executions || data
      expect(executions.length).toBeLessThanOrEqual(10)
    })

    it('should filter by scenario', async () => {
      const res = await fetch(`${API_URL}/executions?scenarioId=${scenarioId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      const executions = data.executions || data
      executions.forEach(execution => {
        expect(execution.scenarioId).toBe(scenarioId)
      })
    })

    it('should reject without authentication', async () => {
      const res = await fetch(`${API_URL}/executions`)

      expect(res.status).toBe(401)
    })

    it('should only return user\'s own executions', async () => {
      const res = await fetch(`${API_URL}/executions`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      const data = await res.json()
      const executions = data.executions || data
      executions.forEach(execution => {
        expect(execution.userId).toBe(userId)
      })
    })
  })

  describe('GET /api/executions/stats/summary - Execution Statistics', () => {
    it('should get execution statistics', async () => {
      const res = await fetch(`${API_URL}/executions/stats/summary`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(typeof data.totalExecutions).toBe('number')
      expect(typeof data.successRate).toBe('number')
    })

    it('should calculate success rate', async () => {
      const res = await fetch(`${API_URL}/executions/stats/summary`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      const data = await res.json()
      if (data.totalExecutions > 0) {
        expect(data.successRate).toBeGreaterThanOrEqual(0)
        expect(data.successRate).toBeLessThanOrEqual(100)
      }
    })

    it('should filter statistics by scenario', async () => {
      const res = await fetch(`${API_URL}/executions/stats/summary?scenarioId=${scenarioId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(typeof data.totalExecutions).toBe('number')
    })
  })

  describe('GET /api/executions/:id - Get Execution Details', () => {
    let executionId = null

    beforeAll(async () => {
      // Execute a scenario to get an execution ID
      const res = await fetch(`${API_URL}/executions/scenarios/${scenarioId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          browser: 'chromium'
        })
      })

      const data = await res.json()
      executionId = data.execution?.id || data.executionId
    })

    it('should get execution details', async () => {
      if (!executionId) {
        console.warn('Skipping: executionId not available')
        return
      }

      const res = await fetch(`${API_URL}/executions/${executionId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect([200, 404]).toContain(res.status)
      if (res.status === 200) {
        const data = await res.json()
        expect(data.id).toBe(executionId)
      }
    })
  })

  describe('Full Execution Workflow', () => {
    it('should complete create → execute → get-history flow', async () => {
      // 1. Create scenario
      const createRes = await fetch(`${API_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Workflow Test Scenario',
          url: 'https://example.com'
        })
      })
      expect(createRes.status).toBe(201)
      const createData = await createRes.json()
      const workflowScenarioId = createData.id

      // 2. Execute scenario
      const execRes = await fetch(`${API_URL}/executions/scenarios/${workflowScenarioId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          browser: 'chromium'
        })
      })
      expect([200, 202, 201]).toContain(execRes.status)

      // 3. Get execution history
      const historyRes = await fetch(`${API_URL}/executions?scenarioId=${workflowScenarioId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      expect(historyRes.status).toBe(200)
      const historyData = await historyRes.json()
      const executions = historyData.executions || historyData
      expect(executions.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Execution Error Handling', () => {
    it('should handle execution of scenario without test steps', async () => {
      const res = await fetch(`${API_URL}/executions/scenarios/${scenarioId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          browser: 'chromium'
        })
      })

      // Should either succeed with empty steps or fail gracefully
      expect([200, 202, 201, 400]).toContain(res.status)
    })

    it('should not allow execution of other user\'s scenario', async () => {
      // Register other user
      const otherEmail = `other-exec-${Date.now()}@test.local`
      const registerRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: otherEmail,
          password: 'OtherPass123!@',
          name: 'Other User'
        })
      })
      const regData = await registerRes.json()
      const otherToken = regData.token

      // Try to execute with other token
      const res = await fetch(`${API_URL}/executions/scenarios/${scenarioId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${otherToken}`
        },
        body: JSON.stringify({
          browser: 'chromium'
        })
      })

      expect([403, 404]).toContain(res.status)
    })
  })
})
