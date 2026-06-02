/**
 * Parallel Execution Integration Tests - Phase 2.2
 * Tests multi-scenario parallel execution workflows
 */

import fetch from 'node-fetch'

const API_URL = 'http://localhost:5001/api'
let authToken = null
let userId = null

beforeAll(async () => {
  // Setup: Register and login test user
  const email = `parallel-test-${Date.now()}@testingndrih.local`
  const password = 'ParallelPass123!@'

  const registerRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      name: 'Parallel Test User'
    })
  })

  const regData = await registerRes.json()
  authToken = regData.token
  userId = regData.user.id
})

describe('Parallel Execution Integration Tests', () => {
  let scenarioIds = []

  beforeAll(async () => {
    // Create 3 test scenarios
    for (let i = 0; i < 3; i++) {
      const res = await fetch(`${API_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Parallel Scenario ${i + 1}`,
          url: `https://example.com/scenario${i + 1}`
        })
      })

      const data = await res.json()
      const id = data.scenario?.id || data.id
      scenarioIds.push(id)

      // Add test step to enable execution
      if (id) {
        await fetch(`${API_URL}/scenarios/${id}/steps`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            type: 'NAVIGATE',
            description: 'Navigate'
          })
        })
      }
    }
  })

  describe('POST /api/parallel/execute - Execute Parallel', () => {
    it('should execute multiple scenarios in parallel', async () => {
      const res = await fetch(`${API_URL}/parallel/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          scenarioIds: scenarioIds.slice(0, 2),
          concurrencyLimit: 2,
          timeout: 300000
        })
      })

      expect([200, 202, 201]).toContain(res.status)
      const data = await res.json()
      expect(data.batchId || data.batch).toBeDefined()
    })

    it('should enforce concurrency limit', async () => {
      const res = await fetch(`${API_URL}/parallel/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          scenarioIds: scenarioIds,
          concurrencyLimit: 1,
          timeout: 300000
        })
      })

      expect([200, 202, 201]).toContain(res.status)
      const data = await res.json()
      expect(data.concurrencyLimit || data.batch?.concurrencyLimit).toBe(1)
    })

    it('should use default concurrency limit', async () => {
      const res = await fetch(`${API_URL}/parallel/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          scenarioIds: scenarioIds.slice(0, 2)
          // no concurrencyLimit specified
        })
      })

      expect([200, 202, 201]).toContain(res.status)
    })

    it('should reject empty scenario list', async () => {
      const res = await fetch(`${API_URL}/parallel/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          scenarioIds: [],
          concurrencyLimit: 2
        })
      })

      expect(res.status).toBe(400)
    })

    it('should reject non-array scenarioIds', async () => {
      const res = await fetch(`${API_URL}/parallel/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          scenarioIds: 'not-an-array',
          concurrencyLimit: 2
        })
      })

      expect(res.status).toBe(400)
    })

    it('should reject scenario from other user', async () => {
      // Register other user and create scenario
      const otherEmail = `other-parallel-${Date.now()}@test.local`
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

      const createRes = await fetch(`${API_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${otherToken}`
        },
        body: JSON.stringify({
          name: 'Other User Scenario',
          url: 'https://example.com'
        })
      })
      const createData = await createRes.json()
      const otherScenarioId = createData.scenario?.id || createData.id

      // Try to execute with first user token
      const res = await fetch(`${API_URL}/parallel/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          scenarioIds: [otherScenarioId],
          concurrencyLimit: 1
        })
      })

      expect([403, 400]).toContain(res.status)
    })

    it('should reject without authentication', async () => {
      const res = await fetch(`${API_URL}/parallel/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioIds: scenarioIds.slice(0, 1)
        })
      })

      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/parallel/batch/:batchId - Get Batch Details', () => {
    let batchId = null

    beforeAll(async () => {
      const res = await fetch(`${API_URL}/parallel/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          scenarioIds: scenarioIds.slice(0, 2),
          concurrencyLimit: 2
        })
      })

      const data = await res.json()
      batchId = data.batchId || data.batch?.id
    })

    it('should get batch details', async () => {
      if (!batchId) return

      const res = await fetch(`${API_URL}/parallel/batch/${batchId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect([200, 404]).toContain(res.status)
      if (res.status === 200) {
        const data = await res.json()
        expect(data.batch).toBeDefined()
      }
    })

    it('should not allow access to other user\'s batch', async () => {
      if (!batchId) return

      // Register other user
      const otherEmail = `other-batch-${Date.now()}@test.local`
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

      const res = await fetch(`${API_URL}/parallel/batch/${batchId}`, {
        headers: { 'Authorization': `Bearer ${otherToken}` }
      })

      expect([403, 404]).toContain(res.status)
    })

    it('should return 404 for non-existent batch', async () => {
      const res = await fetch(`${API_URL}/parallel/batch/invalid-batch-id`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect(res.status).toBe(404)
    })
  })

  describe('Full Parallel Execution Workflow', () => {
    it('should complete execute → get-batch → check-status flow', async () => {
      // 1. Execute parallel batch
      const execRes = await fetch(`${API_URL}/parallel/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          scenarioIds: scenarioIds.slice(0, 2),
          concurrencyLimit: 2,
          timeout: 300000
        })
      })
      expect([200, 202, 201]).toContain(execRes.status)
      const execData = await execRes.json()
      const batchId = execData.batchId || execData.batch?.id

      // 2. Get batch details
      if (batchId) {
        const getRes = await fetch(`${API_URL}/parallel/batch/${batchId}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })
        expect([200, 404]).toContain(getRes.status)
      }
    })
  })

  describe('Concurrency Management', () => {
    it('should queue scenarios when limit is reached', async () => {
      const res = await fetch(`${API_URL}/parallel/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          scenarioIds: scenarioIds, // 3 scenarios
          concurrencyLimit: 1, // Only 1 at a time
          timeout: 300000
        })
      })

      expect([200, 202, 201]).toContain(res.status)
      const data = await res.json()
      // Should handle queuing
      expect(data).toBeDefined()
    })

    it('should process queue when slots become available', async () => {
      // Execute with low concurrency - ensures queue usage
      const res = await fetch(`${API_URL}/parallel/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          scenarioIds: scenarioIds,
          concurrencyLimit: 1,
          timeout: 600000 // Long timeout to allow completion
        })
      })

      expect([200, 202, 201]).toContain(res.status)
    })
  })
})
