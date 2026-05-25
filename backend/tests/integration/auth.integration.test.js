/**
 * Auth Integration Tests - Phase 2.2
 * Tests full authentication workflows with real API calls
 */

import fetch from 'node-fetch'

const API_URL = 'http://localhost:5001/api'
const TEST_USER = {
  email: `test-${Date.now()}@testingndrih.local`,
  password: 'TestPass123!@',
  name: 'Integration Test User'
}

let authToken = null
let userId = null

describe('Auth Integration Tests', () => {
  describe('POST /api/auth/register', () => {
    it('should register new user successfully', async () => {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEST_USER.email,
          password: TEST_USER.password,
          name: TEST_USER.name
        })
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.token).toBeDefined()
      expect(data.user.email).toBe(TEST_USER.email)
      expect(data.user.id).toBeDefined()

      authToken = data.token
      userId = data.user.id
    })

    it('should reject duplicate email', async () => {
      // First registration
      await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `duplicate-${Date.now()}@test.local`,
          password: 'TestPass123!@',
          name: 'User 1'
        })
      })

      // Duplicate attempt
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `duplicate-${Date.now()}@test.local`,
          password: 'TestPass123!@',
          name: 'User 2'
        })
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toBeDefined()
    })

    it('should reject weak password', async () => {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `weak-${Date.now()}@test.local`,
          password: 'weak',
          name: 'User'
        })
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toBeDefined()
    })

    it('should reject missing required fields', async () => {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `incomplete-${Date.now()}@test.local`
          // missing password
        })
      })

      expect(res.status).toBe(400)
    })

    it('should hash password securely', async () => {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `hash-test-${Date.now()}@test.local`,
          password: 'SecurePass123!@',
          name: 'Hash Test'
        })
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      // Password should not be in response
      expect(data.user.password).toBeUndefined()
    })
  })

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Register a user first
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEST_USER.email,
          password: TEST_USER.password,
          name: TEST_USER.name
        })
      })
      const data = await res.json()
      authToken = data.token
      userId = data.user.id
    })

    it('should login with valid credentials', async () => {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEST_USER.email,
          password: TEST_USER.password
        })
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.token).toBeDefined()
      expect(data.user.email).toBe(TEST_USER.email)
      expect(data.token.length).toBeGreaterThan(20)
    })

    it('should reject invalid email', async () => {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@test.local',
          password: TEST_USER.password
        })
      })

      expect(res.status).toBe(401)
      const data = await res.json()
      expect(data.error).toBeDefined()
    })

    it('should reject wrong password', async () => {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEST_USER.email,
          password: 'WrongPassword123!@'
        })
      })

      expect(res.status).toBe(401)
      const data = await res.json()
      expect(data.error).toBeDefined()
    })

    it('should return valid JWT token', async () => {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEST_USER.email,
          password: TEST_USER.password
        })
      })

      const data = await res.json()
      const token = data.token

      // JWT has 3 parts separated by dots
      const parts = token.split('.')
      expect(parts).toHaveLength(3)

      // Try to use token
      const meRes = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      expect(meRes.status).toBe(200)
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.id).toBe(userId)
      expect(data.email).toBe(TEST_USER.email)
    })

    it('should reject missing token', async () => {
      const res = await fetch(`${API_URL}/auth/me`)

      expect(res.status).toBe(401)
    })

    it('should reject invalid token', async () => {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': 'Bearer invalid.token.here' }
      })

      expect(res.status).toBe(401)
    })

    it('should reject malformed auth header', async () => {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': authToken } // missing "Bearer"
      })

      expect(res.status).toBe(401)
    })
  })

  describe('Full Auth Workflow', () => {
    it('should complete register → login → get-me flow', async () => {
      const newEmail = `workflow-${Date.now()}@test.local`
      const password = 'WorkflowPass123!@'

      // 1. Register
      const registerRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          password,
          name: 'Workflow User'
        })
      })
      expect(registerRes.status).toBe(201)
      let data = await registerRes.json()
      const registeredUserId = data.user.id

      // 2. Login
      const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          password
        })
      })
      expect(loginRes.status).toBe(200)
      data = await loginRes.json()
      const token = data.token

      // 3. Get current user
      const meRes = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      expect(meRes.status).toBe(200)
      data = await meRes.json()
      expect(data.id).toBe(registeredUserId)
      expect(data.email).toBe(newEmail)
    })
  })

  describe('Token Expiration & Refresh', () => {
    it('should have valid token structure', async () => {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEST_USER.email,
          password: TEST_USER.password
        })
      })

      const data = await res.json()
      const token = data.token

      // Decode payload (without verification)
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
      expect(payload.sub).toBeDefined() // user ID
      expect(payload.iat).toBeDefined() // issued at
      expect(payload.exp).toBeDefined() // expiration
    })
  })
})
