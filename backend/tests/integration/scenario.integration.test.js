/**
 * Scenario Integration Tests - Phase 2.2
 * Tests scenario CRUD operations and workflows
 */

import fetch from 'node-fetch'

const API_URL = 'http://localhost:5001/api'
let authToken = null
let userId = null

beforeAll(async () => {
  // Setup: Register and login test user
  const email = `scenario-test-${Date.now()}@testingndrih.local`
  const password = 'ScenarioPass123!@'

  const registerRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      name: 'Scenario Test User'
    })
  })

  const regData = await registerRes.json()
  authToken = regData.token
  userId = regData.user.id
})

describe('Scenario Integration Tests', () => {
  describe('POST /api/scenarios - Create Scenario', () => {
    it('should create new scenario', async () => {
      const res = await fetch(`${API_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Login Test Scenario',
          description: 'Test login functionality',
          url: 'https://example.com',
          tags: ['auth', 'critical']
        })
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.id).toBeDefined()
      expect(data.name).toBe('Login Test Scenario')
      expect(data.userId).toBe(userId)
    })

    it('should reject scenario without authentication', async () => {
      const res = await fetch(`${API_URL}/scenarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Unauthorized Scenario',
          url: 'https://example.com'
        })
      })

      expect(res.status).toBe(401)
    })

    it('should reject scenario with invalid data', async () => {
      const res = await fetch(`${API_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          // missing required fields
          description: 'Missing name and url'
        })
      })

      expect(res.status).toBe(400)
    })

    it('should create scenario with minimum fields', async () => {
      const res = await fetch(`${API_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Minimal Scenario',
          url: 'https://example.com'
        })
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.name).toBe('Minimal Scenario')
      expect(data.url).toBe('https://example.com')
    })
  })

  describe('GET /api/scenarios - List Scenarios', () => {
    let scenarioId = null

    beforeAll(async () => {
      // Create a test scenario
      const res = await fetch(`${API_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'List Test Scenario',
          url: 'https://example.com'
        })
      })
      const data = await res.json()
      scenarioId = data.id
    })

    it('should list all scenarios for user', async () => {
      const res = await fetch(`${API_URL}/scenarios`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(Array.isArray(data.scenarios)).toBe(true)
      expect(data.scenarios.length).toBeGreaterThan(0)
    })

    it('should only return user\'s own scenarios', async () => {
      const res = await fetch(`${API_URL}/scenarios`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      const data = await res.json()
      data.scenarios.forEach(scenario => {
        expect(scenario.userId).toBe(userId)
      })
    })

    it('should support pagination', async () => {
      const res = await fetch(`${API_URL}/scenarios?limit=5&offset=0`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.scenarios.length).toBeLessThanOrEqual(5)
    })

    it('should reject list without authentication', async () => {
      const res = await fetch(`${API_URL}/scenarios`)

      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/scenarios/:id - Get Scenario', () => {
    let scenarioId = null

    beforeAll(async () => {
      const res = await fetch(`${API_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Get Test Scenario',
          url: 'https://example.com'
        })
      })
      const data = await res.json()
      scenarioId = data.id
    })

    it('should get specific scenario', async () => {
      const res = await fetch(`${API_URL}/scenarios/${scenarioId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.id).toBe(scenarioId)
      expect(data.name).toBe('Get Test Scenario')
    })

    it('should return 404 for non-existent scenario', async () => {
      const res = await fetch(`${API_URL}/scenarios/invalid-id-12345`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect(res.status).toBe(404)
    })

    it('should not allow access to other user\'s scenario', async () => {
      // Register different user
      const otherEmail = `other-user-${Date.now()}@test.local`
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

      const res = await fetch(`${API_URL}/scenarios/${scenarioId}`, {
        headers: { 'Authorization': `Bearer ${otherToken}` }
      })

      expect(res.status).toBe(403)
    })
  })

  describe('PUT /api/scenarios/:id - Update Scenario', () => {
    let scenarioId = null

    beforeAll(async () => {
      const res = await fetch(`${API_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Update Test Scenario',
          url: 'https://example.com'
        })
      })
      const data = await res.json()
      scenarioId = data.id
    })

    it('should update scenario', async () => {
      const res = await fetch(`${API_URL}/scenarios/${scenarioId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Updated Scenario Name',
          description: 'Updated description'
        })
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.name).toBe('Updated Scenario Name')
      expect(data.description).toBe('Updated description')
    })

    it('should preserve url when updating', async () => {
      const originalUrl = 'https://original.example.com'
      const createRes = await fetch(`${API_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Preserve URL Test',
          url: originalUrl
        })
      })
      const createData = await createRes.json()
      const newScenarioId = createData.id

      const updateRes = await fetch(`${API_URL}/scenarios/${newScenarioId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'New Name'
        })
      })

      const updateData = await updateRes.json()
      expect(updateData.url).toBe(originalUrl)
    })
  })

  describe('DELETE /api/scenarios/:id - Delete Scenario', () => {
    let scenarioId = null

    beforeAll(async () => {
      const res = await fetch(`${API_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Delete Test Scenario',
          url: 'https://example.com'
        })
      })
      const data = await res.json()
      scenarioId = data.id
    })

    it('should delete scenario', async () => {
      const res = await fetch(`${API_URL}/scenarios/${scenarioId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect(res.status).toBe(200)
    })

    it('should return 404 after deletion', async () => {
      const res = await fetch(`${API_URL}/scenarios/${scenarioId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect(res.status).toBe(404)
    })

    it('should not allow deleting other user\'s scenario', async () => {
      // Create scenario
      const createRes = await fetch(`${API_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Cannot Delete Test',
          url: 'https://example.com'
        })
      })
      const createData = await createRes.json()
      const testScenarioId = createData.id

      // Register other user
      const otherEmail = `delete-test-${Date.now()}@test.local`
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

      // Try to delete with other token
      const res = await fetch(`${API_URL}/scenarios/${testScenarioId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${otherToken}` }
      })

      expect(res.status).toBe(403)
    })
  })

  describe('POST /api/scenarios/:id/duplicate - Duplicate Scenario', () => {
    let scenarioId = null

    beforeAll(async () => {
      const res = await fetch(`${API_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Original Scenario',
          url: 'https://example.com',
          description: 'Original description'
        })
      })
      const data = await res.json()
      scenarioId = data.id
    })

    it('should duplicate scenario', async () => {
      const res = await fetch(`${API_URL}/scenarios/${scenarioId}/duplicate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.id).not.toBe(scenarioId)
      expect(data.name).toContain('Copy')
      expect(data.userId).toBe(userId)
    })

    it('duplicated scenario should have same properties', async () => {
      const dupRes = await fetch(`${API_URL}/scenarios/${scenarioId}/duplicate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      const dupData = await dupRes.json()
      const dupId = dupData.id

      const getRes = await fetch(`${API_URL}/scenarios/${dupId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      const getdata = await getRes.json()

      expect(getdata.url).toBe('https://example.com')
    })
  })

  describe('GET /api/scenarios/:id/stats - Scenario Statistics', () => {
    let scenarioId = null

    beforeAll(async () => {
      const res = await fetch(`${API_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Stats Test Scenario',
          url: 'https://example.com'
        })
      })
      const data = await res.json()
      scenarioId = data.id
    })

    it('should return scenario statistics', async () => {
      const res = await fetch(`${API_URL}/scenarios/${scenarioId}/stats`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.totalExecutions).toBeGreaterThanOrEqual(0)
      expect(data.passedExecutions).toBeGreaterThanOrEqual(0)
      expect(data.failedExecutions).toBeGreaterThanOrEqual(0)
    })

    it('should calculate success rate', async () => {
      const res = await fetch(`${API_URL}/scenarios/${scenarioId}/stats`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      const data = await res.json()
      if (data.totalExecutions > 0) {
        expect(typeof data.successRate).toBe('number')
        expect(data.successRate).toBeGreaterThanOrEqual(0)
        expect(data.successRate).toBeLessThanOrEqual(100)
      }
    })
  })
})
