/**
 * Scheduler Integration Tests - Phase 2.2
 * Tests scheduled execution workflows
 */

import fetch from 'node-fetch'

const API_URL = 'http://localhost:5001/api'
let authToken = null
let userId = null

beforeAll(async () => {
  // Setup: Register and login test user
  const email = `scheduler-test-${Date.now()}@testingndrih.local`
  const password = 'SchedulerPass123!@'

  const registerRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      name: 'Scheduler Test User'
    })
  })

  const regData = await registerRes.json()
  authToken = regData.token
  userId = regData.user.id
})

describe('Scheduler Integration Tests', () => {
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
        name: 'Scheduler Test Scenario',
        url: 'https://example.com'
      })
    })

    const data = await res.json()
    scenarioId = data.scenario?.id || data.id
  })

  describe('POST /api/scheduler - Create Schedule', () => {
    it('should create daily schedule', async () => {
      const res = await fetch(`${API_URL}/scheduler`, {
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

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.schedule.frequency).toBe('DAILY')
      expect(data.schedule.scenarioId).toBe(scenarioId)
    })

    it('should create hourly schedule', async () => {
      const res = await fetch(`${API_URL}/scheduler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          scenarioId,
          frequency: 'HOURLY',
          isActive: true
        })
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.schedule.frequency).toBe('HOURLY')
    })

    it('should create weekly schedule with days', async () => {
      const res = await fetch(`${API_URL}/scheduler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          scenarioId,
          frequency: 'WEEKLY',
          daysOfWeek: ['MON', 'WED', 'FRI'],
          timeOfDay: '14:30',
          isActive: true
        })
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.schedule.frequency).toBe('WEEKLY')
    })

    it('should reject schedule without required fields', async () => {
      const res = await fetch(`${API_URL}/scheduler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          // missing scenarioId and frequency
          isActive: true
        })
      })

      expect(res.status).toBe(400)
    })

    it('should reject schedule for non-existent scenario', async () => {
      const res = await fetch(`${API_URL}/scheduler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          scenarioId: 'invalid-scenario-id',
          frequency: 'DAILY',
          timeOfDay: '09:00'
        })
      })

      expect(res.status).toBe(400)
    })

    it('should reject without authentication', async () => {
      const res = await fetch(`${API_URL}/scheduler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId,
          frequency: 'DAILY'
        })
      })

      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/scheduler - List Schedules', () => {
    it('should list user\'s schedules', async () => {
      const res = await fetch(`${API_URL}/scheduler`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(Array.isArray(data.schedules)).toBe(true)
    })

    it('should only return user\'s own schedules', async () => {
      const res = await fetch(`${API_URL}/scheduler`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      const data = await res.json()
      data.schedules.forEach(schedule => {
        expect(schedule.userId).toBe(userId)
      })
    })

    it('should reject without authentication', async () => {
      const res = await fetch(`${API_URL}/scheduler`)

      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/scheduler/:scheduleId - Get Schedule Details', () => {
    let scheduleId = null

    beforeAll(async () => {
      const res = await fetch(`${API_URL}/scheduler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          scenarioId,
          frequency: 'DAILY',
          timeOfDay: '10:00',
          isActive: true
        })
      })

      const data = await res.json()
      scheduleId = data.schedule.id
    })

    it('should get schedule details', async () => {
      const res = await fetch(`${API_URL}/scheduler/${scheduleId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.id).toBe(scheduleId)
      expect(data.frequency).toBe('DAILY')
    })

    it('should return 404 for non-existent schedule', async () => {
      const res = await fetch(`${API_URL}/scheduler/invalid-schedule-id`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect(res.status).toBe(404)
    })
  })

  describe('PUT /api/scheduler/:scheduleId - Update Schedule', () => {
    let scheduleId = null

    beforeAll(async () => {
      const res = await fetch(`${API_URL}/scheduler`, {
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

      const data = await res.json()
      scheduleId = data.schedule.id
    })

    it('should update schedule frequency', async () => {
      const res = await fetch(`${API_URL}/scheduler/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          frequency: 'HOURLY'
        })
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.frequency).toBe('HOURLY')
    })

    it('should update schedule time', async () => {
      const res = await fetch(`${API_URL}/scheduler/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          timeOfDay: '14:00'
        })
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.timeOfDay).toBe('14:00')
    })

    it('should toggle schedule active status', async () => {
      const res = await fetch(`${API_URL}/scheduler/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          isActive: false
        })
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.isActive).toBe(false)
    })
  })

  describe('DELETE /api/scheduler/:scheduleId - Delete Schedule', () => {
    let scheduleId = null

    beforeAll(async () => {
      const res = await fetch(`${API_URL}/scheduler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          scenarioId,
          frequency: 'DAILY',
          timeOfDay: '11:00'
        })
      })

      const data = await res.json()
      scheduleId = data.schedule.id
    })

    it('should delete schedule', async () => {
      const res = await fetch(`${API_URL}/scheduler/${scheduleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect(res.status).toBe(200)
    })

    it('should return 404 after deletion', async () => {
      const res = await fetch(`${API_URL}/scheduler/${scheduleId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect(res.status).toBe(404)
    })
  })

  describe('Full Scheduler Workflow', () => {
    it('should complete create → list → update → delete flow', async () => {
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
          timeOfDay: '15:00',
          isActive: true
        })
      })
      expect(createRes.status).toBe(201)
      const createData = await createRes.json()
      const newScheduleId = createData.schedule.id

      // 2. List schedules
      const listRes = await fetch(`${API_URL}/scheduler`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      expect(listRes.status).toBe(200)
      const listData = await listRes.json()
      expect(listData.schedules.some(s => s.id === newScheduleId)).toBe(true)

      // 3. Update schedule
      const updateRes = await fetch(`${API_URL}/scheduler/${newScheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          timeOfDay: '16:00'
        })
      })
      expect(updateRes.status).toBe(200)

      // 4. Delete schedule
      const deleteRes = await fetch(`${API_URL}/scheduler/${newScheduleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      expect(deleteRes.status).toBe(200)
    })
  })

  describe('Schedule Authorization', () => {
    it('should not allow updating other user\'s schedule', async () => {
      // Register other user
      const otherEmail = `other-sched-${Date.now()}@test.local`
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

      // Create schedule as first user
      const createRes = await fetch(`${API_URL}/scheduler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          scenarioId,
          frequency: 'DAILY',
          timeOfDay: '12:00'
        })
      })
      const createData = await createRes.json()
      const scheduleId = createData.schedule.id

      // Try to update with other token
      const updateRes = await fetch(`${API_URL}/scheduler/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${otherToken}`
        },
        body: JSON.stringify({
          timeOfDay: '13:00'
        })
      })

      expect([403, 404]).toContain(updateRes.status)
    })
  })
})
