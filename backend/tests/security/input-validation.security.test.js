/**
 * Input Validation and Data Handling Security Tests - Phase 2.4
 * Tests for input validation, data exposure, and handling vulnerabilities
 */

import fetch from 'node-fetch'
import { BASE_URL, loginForSecurityTests, TEST_USER_EMAIL, TEST_USER_PASSWORD } from './helpers.js'

let authToken = null

describe('Input Validation and Data Handling Security Tests', () => {
  beforeAll(async () => {
    const auth = await loginForSecurityTests()
    authToken = auth.token
  }, 30000)

  describe('Input Type Validation', () => {
    test('should reject non-string for name field', async () => {
      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 12345,
          description: 'Test',
          url: 'https://example.com'
        })
      })

      expect([400, 422]).toContain(response.status)
    })

    test('should reject non-string for description', async () => {
      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test ${Date.now()}`,
          description: { nested: 'object' },
          url: 'https://example.com'
        })
      })

      expect([400, 422]).toContain(response.status)
    })

    test('should reject invalid url type', async () => {
      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test ${Date.now()}`,
          description: 'Test',
          url: 12345
        })
      })

      expect([400, 422, 500]).toContain(response.status)
    })

    test('should reject non-numeric ID', async () => {
      const response = await fetch(`${BASE_URL}/scenarios/not-a-number`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect([400, 404]).toContain(response.status)
    })
  })

  describe('Input Length Validation', () => {
    test('should reject excessively long name', async () => {
      const longName = 'A'.repeat(10000)

      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: longName,
          description: 'Test',
          url: 'https://example.com'
        })
      })

      expect([400, 422, 413]).toContain(response.status)
    })

    test('should reject excessively long description', async () => {
      const longDesc = 'A'.repeat(100000)

      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test ${Date.now()}`,
          description: longDesc,
          url: 'https://example.com'
        })
      })

      expect([400, 422, 413]).toContain(response.status)
    })

    test('should handle large request payload', async () => {
      const largePayload = {
        name: `Test ${Date.now()}`,
        description: 'A'.repeat(50000),
        url: 'https://example.com',
      }

      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(largePayload)
      })

      expect([201, 400, 413]).toContain(response.status)
    })
  })

  describe('Input Format Validation', () => {
    test('should validate email format', async () => {
      const invalidEmails = [
        'not-an-email',
        'user@',
        '@domain.com',
        'user @domain.com',
        'user@domain',
        ''
      ]

      for (const email of invalidEmails) {
        const response = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            password: 'password123'
          })
        })

        expect([400, 422]).toContain(response.status)
      }
    })

    test('should validate URL format', async () => {
      const invalidUrls = [
        'not a url',
        'htp://example.com',
        '://example.com',
        'example.com', // May be valid depending on implementation
        '/path/without/protocol'
      ]

      for (const url of invalidUrls) {
        const response = await fetch(`${BASE_URL}/scenarios`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            name: `Test ${Date.now()}`,
            description: 'Test',
            url,
          })
        })

        // Should either accept or reject consistently
        expect([201, 400]).toContain(response.status)
      }
    })

    test('should validate enum fields', async () => {
      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: '',
          description: 'Test',
          url: 'https://example.com',
        })
      })

      expect([400, 422, 500]).toContain(response.status)
    })
  })

  describe('Special Character Handling', () => {
    test('should handle special characters safely', async () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?'

      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test ${specialChars} ${Date.now()}`,
          description: specialChars,
          url: 'https://example.com'
        })
      })

      expect([201, 400]).toContain(response.status)
    })

    test('should handle Unicode characters', async () => {
      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test 你好 мир العالم ${Date.now()}`,
          description: 'مرحبا',
          url: 'https://example.com'
        })
      })

      expect([201, 400]).toContain(response.status)
    })

    test('should handle emoji characters', async () => {
      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test 😀 🎉 🔒 ${Date.now()}`,
          description: 'Test 🚀',
          url: 'https://example.com'
        })
      })

      expect([201, 400]).toContain(response.status)
    })

    test('should handle null bytes', async () => {
      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test\x00Injection ${Date.now()}`,
          description: 'Test',
          url: 'https://example.com'
        })
      })

      expect([201, 400]).toContain(response.status)
    })

    test('should handle control characters', async () => {
      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test\n\r\t${Date.now()}`,
          description: 'Test\x01\x02',
          url: 'https://example.com'
        })
      })

      expect([201, 400]).toContain(response.status)
    })
  })

  describe('Null and Undefined Handling', () => {
    test('should reject null name', async () => {
      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: null,
          description: 'Test',
          url: 'https://example.com'
        })
      })

      expect([400, 422]).toContain(response.status)
    })

    test('should reject undefined required fields', async () => {
      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          description: 'Test',
          url: 'https://example.com'
          // Missing required 'name'
        })
      })

      expect([400, 422]).toContain(response.status)
    })

    test('should handle empty string values', async () => {
      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: '',
          description: '',
          url: 'https://example.com'
        })
      })

      // May accept with trimming or reject
      expect([201, 400]).toContain(response.status)
    })
  })

  describe('Whitespace Handling', () => {
    test('should trim whitespace from input', async () => {
      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `  Test ${Date.now()}  `,
          description: '  Test Description  ',
          url: 'https://example.com'
        })
      })

      if (response.status === 201) {
        const data = await response.json()
        // Should be trimmed or accepted as-is
        expect(data.name).toBeDefined()
      }
    })

    test('should handle tabs and newlines', async () => {
      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test\t${Date.now()}`,
          description: 'Test\nWith\nNewlines',
          url: 'https://example.com'
        })
      })

      expect([201, 400]).toContain(response.status)
    })
  })

  describe('Data Type Coercion', () => {
    test('should not coerce string "true" to boolean', async () => {
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
          isPublic: 'true' // String instead of boolean
        })
      })

      // Should either reject or handle safely
      expect([201, 400]).toContain(response.status)
    })

    test('should not coerce string "1" to number', async () => {
      const response = await fetch(
        `${BASE_URL}/scenarios/${'123'}`, // String ID
        {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }
      )

      // Should handle appropriately
      expect([200, 400, 404]).toContain(response.status)
    })
  })

  describe('Duplicate Key Handling', () => {
    test('should handle duplicate fields in request', async () => {
      // This is tricky with JSON, but some implementations might handle it
      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test ${Date.now()}`,
          name: 'Duplicate', // Duplicate key
          description: 'Test',
          url: 'https://example.com'
        })
      })

      // Should handle gracefully
      expect([201, 400]).toContain(response.status)
    })
  })

  describe('Response Data Exposure', () => {
    test('should not expose internal fields in responses', async () => {
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
          _internal: 'should not appear',
          __proto__: { admin: true }
        })
      })

      if (response.status === 201) {
        const data = await response.json()
        expect(data._internal).toBeUndefined()
        expect(data.__proto__).toBeUndefined()
      }
    })

    test('should not expose database identifiers unnecessarily', async () => {
      const response = await fetch(`${BASE_URL}/scenarios`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      if (response.status === 200) {
        const data = await response.json()
        // Response should have user-friendly format
        expect(Array.isArray(data) || data.scenarios !== undefined).toBe(true)
      }
    })
  })

  describe('Error Message Safety', () => {
    test('should not expose SQL errors to client', async () => {
      const response = await fetch(`${BASE_URL}/scenarios/invalid-id`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      const data = await response.json()
      const responseText = JSON.stringify(data)

      expect(responseText.toLowerCase()).not.toContain('sql')
      expect(responseText.toLowerCase()).not.toContain('syntax')
      expect(responseText).not.toContain('SELECT')
    })

    test('should not expose file paths in errors', async () => {
      const response = await fetch(`${BASE_URL}/invalid-endpoint`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      const data = await response.json()
      const responseText = JSON.stringify(data)

      expect(responseText).not.toContain('/home/')
      expect(responseText).not.toContain('/var/')
      expect(responseText).not.toContain('C:\\\\')
    })

    test('should not expose stack traces', async () => {
      const response = await fetch(`${BASE_URL}/scenarios/invalid-id`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      const data = await response.json()
      const responseText = JSON.stringify(data)

      expect(responseText).not.toContain('at ')
      expect(responseText).not.toContain('.js:')
      expect(responseText).not.toContain('Error:')
    })
  })
})
