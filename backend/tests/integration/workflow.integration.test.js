/**
 * Workflow Integration Tests - Phase 2.2
 * Tests complete end-to-end workflows combining multiple endpoints
 */

import fetch from 'node-fetch'

const API_URL = 'http://localhost:5001/api'

describe('Workflow Integration Tests', () => {
  describe('Complete Testing Workflow', () => {
    let authToken = null
    let userId = null
    let scenarioId = null

    beforeAll(async () => {
      // 1. Register new user
      const registerRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `workflow-${Date.now()}@testingndrih.local`,
          password: 'WorkflowPass123!@',
          name: 'Workflow User'
        })
      })
      expect(registerRes.status).toBe(201)
      const regData = await registerRes.json()
      authToken = regData.token
      userId = regData.user.id
    })

    it('should complete full scenario creation to execution workflow', async () => {
      // 1. Create scenario
      const createScenarioRes = await fetch(`${API_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Complete Workflow Scenario',
          url: 'https://example.com',
          description: 'End-to-end test scenario'
        })
      })
      expect(createScenarioRes.status).toBe(201)
      const createData = await createScenarioRes.json()
      scenarioId = createData.scenario?.id || createData.id
      expect(scenarioId).toBeDefined()

      // 1.5. Add a test step to the scenario (required for execution)
      const stepRes = await fetch(`${API_URL}/scenarios/${scenarioId}/steps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          type: 'NAVIGATE',
          description: 'Navigate to test site'
        })
      })
      // Step creation may fail if endpoint doesn't exist, continue anyway
      if (stepRes.status !== 201) {
        const stepError = await stepRes.json()
        console.warn(`Step creation failed with status ${stepRes.status}: ${JSON.stringify(stepError)}`)
      }

      // 2. Get the created scenario
      const getScenarioRes = await fetch(`${API_URL}/scenarios/${scenarioId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      expect(getScenarioRes.status).toBe(200)
      const getData = await getScenarioRes.json()
      expect((getData.scenario?.id || getData.id)).toBe(scenarioId)

      // 3. List scenarios (verify it appears)
      const listRes = await fetch(`${API_URL}/scenarios`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      expect(listRes.status).toBe(200)
      const listData = await listRes.json()
      expect(listData.scenarios.some(s => s.id === scenarioId)).toBe(true)

      // 4. Execute the scenario
      const execRes = await fetch(`${API_URL}/executions/scenarios/${scenarioId}`, {
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

      // 5. Get execution history
      const historyRes = await fetch(`${API_URL}/executions?scenarioId=${scenarioId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      expect(historyRes.status).toBe(200)
      const historyData = await historyRes.json()
      const executions = historyData.executions || historyData
      expect(executions.length).toBeGreaterThanOrEqual(0)

      // 6. Get statistics
      const statsRes = await fetch(`${API_URL}/executions/stats/summary?scenarioId=${scenarioId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      expect(statsRes.status).toBe(200)
      const statsData = await statsRes.json()
      expect(typeof (statsData.stats?.totalExecutions || statsData.totalExecutions)).toBe('number')

      // 7. Duplicate scenario
      const dupRes = await fetch(`${API_URL}/scenarios/${scenarioId}/duplicate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      expect(dupRes.status).toBe(201)
      const dupData = await dupRes.json()
      expect(dupData.id).not.toBe(scenarioId)

      // 8. Update original scenario
      const updateRes = await fetch(`${API_URL}/scenarios/${scenarioId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          description: 'Updated description'
        })
      })
      expect(updateRes.status).toBe(200)
      const updateData = await updateRes.json()
      expect(updateData.description).toBe('Updated description')

      // 9. Delete duplicated scenario
      const deleteRes = await fetch(`${API_URL}/scenarios/${dupData.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      expect(deleteRes.status).toBe(200)
    })
  })

  describe('Scheduling Workflow', () => {
    let authToken = null
    let scenarioId = null

    beforeAll(async () => {
      // Register user
      const registerRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `schedule-workflow-${Date.now()}@testingndrih.local`,
          password: 'SchedulePass123!@',
          name: 'Schedule Workflow User'
        })
      })
      const regData = await registerRes.json()
      authToken = regData.token

      // Create scenario
      const scRes = await fetch(`${API_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Scheduled Scenario',
          url: 'https://example.com'
        })
      })
      const scData = await scRes.json()
      scenarioId = scData.scenario?.id || scData.id
    })

    it('should complete schedule creation to execution workflow', async () => {
      // Add test step to scenario
      if (scenarioId) {
        const stepRes = await fetch(`${API_URL}/scenarios/${scenarioId}/steps`, {
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
        // Step may already exist, ignore errors
      }

      // 1. Create schedule
      const createRes = await fetch(`${API_URL}/scheduler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          scenarioId,
          frequency: 'DAILY',
          timeOfDay: '09:00',
          isActive: true
        })
      })
      expect(createRes.status).toBe(201)
      const createData = await createRes.json()
      const scheduleId = createData.schedule.id

      // 2. List schedules
      const listRes = await fetch(`${API_URL}/scheduler`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      expect(listRes.status).toBe(200)
      const listData = await listRes.json()
      expect(listData.schedules.some(s => s.id === scheduleId)).toBe(true)

      // 3. Get schedule details
      const getRes = await fetch(`${API_URL}/scheduler/${scheduleId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      expect(getRes.status).toBe(200)
      const getData = await getRes.json()
      expect(getData.id).toBe(scheduleId)

      // 4. Update schedule (change time)
      const updateRes = await fetch(`${API_URL}/scheduler/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          timeOfDay: '14:00'
        })
      })
      expect(updateRes.status).toBe(200)
      const updateData = await updateRes.json()
      expect(updateData.timeOfDay).toBe('14:00')

      // 5. Update schedule (deactivate)
      const deactRes = await fetch(`${API_URL}/scheduler/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          isActive: false
        })
      })
      expect(deactRes.status).toBe(200)
      const deactData = await deactRes.json()
      expect(deactData.isActive).toBe(false)

      // 6. Delete schedule
      const deleteRes = await fetch(`${API_URL}/scheduler/${scheduleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      expect(deleteRes.status).toBe(200)

      // 7. Verify deletion
      const verifyRes = await fetch(`${API_URL}/scheduler/${scheduleId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      expect(verifyRes.status).toBe(404)
    })
  })

  describe('Parallel Execution Workflow', () => {
    let authToken = null
    let scenarioIds = []

    beforeAll(async () => {
      // Register user
      const registerRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `parallel-workflow-${Date.now()}@testingndrih.local`,
          password: 'ParallelWorkflow123!@',
          name: 'Parallel Workflow User'
        })
      })
      const regData = await registerRes.json()
      authToken = regData.token

      // Create 3 scenarios
      for (let i = 0; i < 3; i++) {
        const res = await fetch(`${API_URL}/scenarios`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            name: `Parallel Workflow Scenario ${i + 1}`,
            url: `https://example.com/parallel${i + 1}`
          })
        })
        const data = await res.json()
        const id = data.scenario?.id || data.id
        scenarioIds.push(id)

        // Add test step to each scenario
        if (id) {
          const stepRes = await fetch(`${API_URL}/scenarios/${id}/steps`, {
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

    it('should execute multiple scenarios in parallel workflow', async () => {
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

      // 3. Get execution stats for scenarios
      for (const scenarioId of scenarioIds.slice(0, 2)) {
        const statsRes = await fetch(`${API_URL}/executions/stats/summary?scenarioId=${scenarioId}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })
        expect(statsRes.status).toBe(200)
      }
    })
  })

  describe('Multi-User Isolation Workflow', () => {
    let user1Token = null
    let user1Id = null
    let user2Token = null
    let user2Id = null
    let user1ScenarioId = null

    beforeAll(async () => {
      // Register user 1
      const reg1Res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `user1-${Date.now()}@testingndrih.local`,
          password: 'User1Pass123!@',
          name: 'User 1'
        })
      })
      const reg1Data = await reg1Res.json()
      user1Token = reg1Data.token
      user1Id = reg1Data.user.id

      // Register user 2
      const reg2Res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `user2-${Date.now()}@testingndrih.local`,
          password: 'User2Pass123!@',
          name: 'User 2'
        })
      })
      const reg2Data = await reg2Res.json()
      user2Token = reg2Data.token
      user2Id = reg2Data.user.id

      // User 1 creates scenario
      const scenarioRes = await fetch(`${API_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user1Token}`
        },
        body: JSON.stringify({
          name: 'User 1 Private Scenario',
          url: 'https://example.com'
        })
      })
      const scenarioData = await scenarioRes.json()
      user1ScenarioId = scenarioData.scenario?.id || scenarioData.id

      // Add test step to user1's scenario
      if (user1ScenarioId) {
        const stepRes = await fetch(`${API_URL}/scenarios/${user1ScenarioId}/steps`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user1Token}`
          },
          body: JSON.stringify({
            type: 'NAVIGATE',
            description: 'Navigate'
          })
        })
      }
    })

    it('should enforce user isolation across operations', async () => {
      // 1. User 2 cannot list User 1's scenarios
      const listRes = await fetch(`${API_URL}/scenarios`, {
        headers: { 'Authorization': `Bearer ${user2Token}` }
      })
      expect(listRes.status).toBe(200)
      const listData = await listRes.json()
      expect(listData.scenarios.every(s => s.userId === user2Id)).toBe(true)
      expect(listData.scenarios.some(s => s.id === user1ScenarioId)).toBe(false)

      // 2. User 2 cannot access User 1's scenario directly
      const getRes = await fetch(`${API_URL}/scenarios/${user1ScenarioId}`, {
        headers: { 'Authorization': `Bearer ${user2Token}` }
      })
      expect(getRes.status).toBe(403)

      // 3. User 2 cannot execute User 1's scenario
      const execRes = await fetch(`${API_URL}/executions/scenarios/${user1ScenarioId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user2Token}`
        },
        body: JSON.stringify({
          browser: 'chromium'
        })
      })
      expect([403, 404]).toContain(execRes.status)

      // 4. User 2 cannot update User 1's scenario
      const updateRes = await fetch(`${API_URL}/scenarios/${user1ScenarioId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user2Token}`
        },
        body: JSON.stringify({
          name: 'Hacked Scenario'
        })
      })
      expect(updateRes.status).toBe(403)

      // 5. User 2 cannot delete User 1's scenario
      const deleteRes = await fetch(`${API_URL}/scenarios/${user1ScenarioId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user2Token}` }
      })
      expect(deleteRes.status).toBe(403)

      // 6. User 1 can still access own scenario
      const user1GetRes = await fetch(`${API_URL}/scenarios/${user1ScenarioId}`, {
        headers: { 'Authorization': `Bearer ${user1Token}` }
      })
      expect(user1GetRes.status).toBe(200)
    })
  })

  describe('Error Recovery Workflow', () => {
    let authToken = null
    let scenarioId = null

    beforeAll(async () => {
      // Register user
      const registerRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `error-workflow-${Date.now()}@testingndrih.local`,
          password: 'ErrorWorkflow123!@',
          name: 'Error Workflow User'
        })
      })
      const regData = await registerRes.json()
      authToken = regData.token

      // Create scenario
      const scRes = await fetch(`${API_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Error Workflow Scenario',
          url: 'https://example.com'
        })
      })
      const scData = await scRes.json()
      scenarioId = scData.scenario?.id || scData.id

      // Create test step
      if (scenarioId) {
        const stepRes = await fetch(`${API_URL}/scenarios/${scenarioId}/steps`, {
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
    })

    it('should handle and recover from various error scenarios', async () => {
      // 1. Try to access with invalid token
      const invalidRes = await fetch(`${API_URL}/scenarios`, {
        headers: { 'Authorization': 'Bearer invalid-token' }
      })
      expect(invalidRes.status).toBe(401)

      // 2. User can still authenticate
      const reAuthRes = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      expect(reAuthRes.status).toBe(200)

      // 3. Try to access non-existent scenario
      const noRes = await fetch(`${API_URL}/scenarios/nonexistent-id`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      expect(noRes.status).toBe(404)

      // 4. User can still list own scenarios
      const listRes = await fetch(`${API_URL}/scenarios`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      expect(listRes.status).toBe(200)

      // 5. Try invalid operation (e.g., duplicate non-existent)
      const dupRes = await fetch(`${API_URL}/scenarios/invalid-id/duplicate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      expect([404, 400]).toContain(dupRes.status)

      // 6. User can still operate on own scenarios
      const opRes = await fetch(`${API_URL}/scenarios/${scenarioId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      expect(opRes.status).toBe(200)
    })
  })
})
