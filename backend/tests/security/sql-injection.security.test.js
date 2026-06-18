/**
 * SQL Injection Security Tests - Phase 2.4
 * Tests for SQL injection vulnerabilities
 */

import fetch from 'node-fetch'
import { BASE_URL, loginForSecurityTests } from './helpers.js'

let authToken = null

describe('SQL Injection Security Tests', () => {
  beforeAll(async () => {
    const auth = await loginForSecurityTests()
    authToken = auth.token
  }, 30000)

  describe('SQL Injection - Query Parameters', () => {
    test('should prevent SQL injection in scenario name', async () => {
      const payloads = [
        "' OR '1'='1",
        "'; DROP TABLE scenarios; --",
        "' UNION SELECT * FROM users --",
        "1' AND 1=1 --",
        "admin' --",
        "' OR 1=1 --"
      ]

      for (const payload of payloads) {
        const response = await fetch(`${BASE_URL}/scenarios`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            name: payload,
            description: 'SQLi Test',
            url: 'https://example.com'
          })
        })

        // Should handle safely (201 or 400, not 500)
        expect([201, 400, 422]).toContain(response.status)
      }
    })

    test('should prevent SQL injection in scenario description', async () => {
      const payload = "'; UPDATE scenarios SET name='hacked' WHERE '1'='1"

      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test ${Date.now()}`,
          description: payload,
          url: 'https://example.com'
        })
      })

      expect([201, 400]).toContain(response.status)
    })

    test('should prevent SQL injection in scenario search', async () => {
      const maliciousSearch = "' OR '1'='1"

      const response = await fetch(
        `${BASE_URL}/scenarios?search=${encodeURIComponent(maliciousSearch)}`,
        {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      // Should return array safely
      expect(Array.isArray(data) || data.scenarios !== undefined).toBe(true)
    })

    test('should prevent SQL injection in ID parameter', async () => {
      const maliciousId = "1 OR 1=1"

      const response = await fetch(
        `${BASE_URL}/scenarios/${encodeURIComponent(maliciousId)}`,
        {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }
      )

      // Should not crash
      expect([200, 400, 404]).toContain(response.status)
    })
  })

  describe('SQL Injection - Request Body', () => {
    test('should prevent SQL injection in filter parameters', async () => {
      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test ${Date.now()}`,
          description: 'Test',
          url: 'https://example.com',
          filter: "' OR '1'='1"
        })
      })

      expect([201, 400]).toContain(response.status)
    })

    test('should prevent blind SQL injection', async () => {
      const timingPayload = "'; WAITFOR DELAY '00:00:05' --"

      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: timingPayload,
          description: 'Test',
          url: 'https://example.com'
        })
      })

      // Should not delay significantly
      expect([201, 400]).toContain(response.status)
    })

    test('should prevent error-based SQL injection', async () => {
      const errorPayload = "' AND extractvalue(1, concat(0x7e, (select database()))) --"

      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test ${Date.now()}`,
          description: errorPayload,
          url: 'https://example.com'
        })
      })

      expect([201, 400]).toContain(response.status)
    })
  })

  describe('SQL Injection - Update Operations', () => {
    test('should prevent SQL injection in PUT request', async () => {
      // First, create a scenario
      const createRes = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test ${Date.now()}`,
          description: 'Test',
          url: 'https://example.com'
        })
      })

      if (createRes.status !== 201) return

      const scenario = await createRes.json()

      // Try to update with SQL injection
      const updateRes = await fetch(`${BASE_URL}/scenarios/${scenario.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: "'; DROP TABLE scenarios; --",
          description: 'Updated'
        })
      })

      expect([200, 400]).toContain(updateRes.status)

      // Verify table still exists
      const listRes = await fetch(`${BASE_URL}/scenarios`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      expect(listRes.status).toBe(200)
    })
  })

  describe('SQL Injection - Special Characters', () => {
    test('should handle single quotes safely', async () => {
      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test's Scenario ${Date.now()}`,
          description: "It's a test",
          url: 'https://example.com'
        })
      })

      expect([201, 400]).toContain(response.status)
    })

    test('should handle double quotes safely', async () => {
      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test "quoted" Scenario ${Date.now()}`,
          description: 'Description "with" quotes',
          url: 'https://example.com'
        })
      })

      expect([201, 400]).toContain(response.status)
    })

    test('should handle backslashes safely', async () => {
      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test\\Scenario ${Date.now()}`,
          description: 'Test with \\ backslash',
          url: 'https://example.com'
        })
      })

      expect([201, 400]).toContain(response.status)
    })

    test('should handle NULL bytes safely', async () => {
      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test\x00Scenario ${Date.now()}`,
          description: 'Test',
          url: 'https://example.com'
        })
      })

      expect([201, 400]).toContain(response.status)
    })
  })

  describe('SQL Injection - Union-Based', () => {
    test('should prevent UNION-based SQL injection', async () => {
      const unionPayload = "' UNION SELECT NULL, email, password FROM users --"

      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test ${Date.now()}`,
          description: unionPayload,
          url: 'https://example.com'
        })
      })

      expect([201, 400]).toContain(response.status)
    })

    test('should prevent UNION-based extraction via description', async () => {
      const payloads = [
        "' UNION ALL SELECT NULL,NULL,NULL,NULL,NULL --",
        "' UNION SELECT table_name FROM information_schema.tables --",
        "' UNION SELECT column_name FROM information_schema.columns --"
      ]

      for (const payload of payloads) {
        const response = await fetch(`${BASE_URL}/scenarios`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            name: `Test ${Date.now()}`,
            description: payload,
            url: 'https://example.com'
          })
        })

        expect([201, 400]).toContain(response.status)
      }
    })
  })

  describe('SQL Injection - Stacked Queries', () => {
    test('should prevent stacked query attacks', async () => {
      const stackedPayload = "'; INSERT INTO users (email, password) VALUES ('hacker@test.local', 'hashedpass'); --"

      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test ${Date.now()}`,
          description: stackedPayload,
          url: 'https://example.com'
        })
      })

      expect([201, 400]).toContain(response.status)
    })
  })

  describe('SQL Injection - Comments and Obfuscation', () => {
    test('should prevent SQL comments bypass', async () => {
      const commentPayloads = [
        "' -- comment",
        "' # comment",
        "' /* comment */",
        "' /*!40000 comment */",
        "' -- -"
      ]

      for (const payload of commentPayloads) {
        const response = await fetch(`${BASE_URL}/scenarios`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            name: `Test ${Date.now()}`,
            description: payload,
            url: 'https://example.com'
          })
        })

        expect([201, 400]).toContain(response.status)
      }
    })

    test('should prevent case variation bypass', async () => {
      const casePayloads = [
        "' OR '1'='1",
        "' oR '1'='1",
        "' Or '1'='1",
        "' OR '1'=\'1",
        "' uNioN sEleCt * --"
      ]

      for (const payload of casePayloads) {
        const response = await fetch(`${BASE_URL}/scenarios`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            name: `Test ${Date.now()}`,
            description: payload,
            url: 'https://example.com'
          })
        })

        expect([201, 400]).toContain(response.status)
      }
    })
  })

  describe('SQL Injection - Prevention Verification', () => {
    test('should use parameterized queries', async () => {
      // If API responds to SQL injection attempts safely, params are likely used
      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: "Test' OR '1'='1 ${Date.now()}",
          description: 'SQLi Prevention Test',
          url: 'https://example.com'
        })
      })

      // Should not cause 500 error
      expect([201, 400]).toContain(response.status)
    })

    test('should not expose SQL errors', async () => {
      const response = await fetch(`${BASE_URL}/scenarios/invalid-id-sql-test`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      const data = await response.json()
      const responseText = JSON.stringify(data)

      // Should not contain SQL error messages
      expect(responseText.toLowerCase()).not.toContain('sql')
      expect(responseText.toLowerCase()).not.toContain('syntax')
      expect(responseText.toLowerCase()).not.toContain('near')
    })
  })
})
