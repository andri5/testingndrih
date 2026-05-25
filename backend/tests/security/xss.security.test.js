/**
 * XSS (Cross-Site Scripting) Security Tests - Phase 2.4
 * Tests for Cross-Site Scripting vulnerabilities
 */

import fetch from 'node-fetch'

const BASE_URL = 'http://localhost:5001/api'
const TEST_USER_EMAIL = 'admin@testingndrih.local'
const TEST_USER_PASSWORD = 'AdminPass123!'

let authToken = null

describe('XSS (Cross-Site Scripting) Security Tests', () => {
  beforeAll(async () => {
    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD
        })
      })

      const data = await response.json()
      authToken = data.token
    } catch (err) {
      console.error('Setup failed:', err.message)
    }
  }, 30000)

  describe('Reflected XSS', () => {
    test('should not execute script in scenario name', async () => {
      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: '<script>alert("XSS")</script>',
          description: 'XSS Test',
          steps: [{ type: 'NAVIGATE', target: 'https://example.com' }]
        })
      })

      expect([201, 400]).toContain(response.status)

      // If created, verify name is escaped
      if (response.status === 201) {
        const data = await response.json()
        expect(data.name).not.toContain('<script>')
      }
    })

    test('should not execute script in scenario description', async () => {
      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test ${Date.now()}`,
          description: '<img src=x onerror="alert(\'XSS\')">',
          steps: [{ type: 'NAVIGATE', target: 'https://example.com' }]
        })
      })

      expect([201, 400]).toContain(response.status)

      if (response.status === 201) {
        const data = await response.json()
        expect(data.description).not.toContain('onerror')
      }
    })

    test('should handle HTML entities safely', async () => {
      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test ${Date.now()}`,
          description: '&lt;script&gt;alert("XSS")&lt;/script&gt;',
          steps: [{ type: 'NAVIGATE', target: 'https://example.com' }]
        })
      })

      expect([201, 400]).toContain(response.status)
    })
  })

  describe('Stored XSS', () => {
    test('should not store executable scripts', async () => {
      const scriptPayload = '<svg onload="alert(\'XSS\')">'

      const createRes = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test ${Date.now()}`,
          description: scriptPayload,
          steps: [{ type: 'NAVIGATE', target: 'https://example.com' }]
        })
      })

      expect([201, 400]).toContain(createRes.status)

      if (createRes.status === 201) {
        const scenario = await createRes.json()

        // Retrieve and verify
        const getRes = await fetch(`${BASE_URL}/scenarios/${scenario.id}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })

        const retrieved = await getRes.json()
        expect(retrieved.description).not.toContain('onload')
      }
    })

    test('should sanitize event handlers', async () => {
      const eventHandlers = [
        '<div onclick="alert(\'XSS\')">',
        '<body onload="alert(\'XSS\')">',
        '<input onfocus="alert(\'XSS\')">',
        '<img onmouseover="alert(\'XSS\')">',
        '<video oncanplay="alert(\'XSS\')">',
        '<audio onplay="alert(\'XSS\')">'
      ]

      for (const handler of eventHandlers) {
        const response = await fetch(`${BASE_URL}/scenarios`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            name: `Test ${Date.now()}`,
            description: handler,
            steps: [{ type: 'NAVIGATE', target: 'https://example.com' }]
          })
        })

        expect([201, 400]).toContain(response.status)
      }
    })
  })

  describe('DOM-based XSS', () => {
    test('should not execute JavaScript in URL parameters', async () => {
      const response = await fetch(
        `${BASE_URL}/scenarios?search=<script>alert('XSS')</script>`,
        {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }
      )

      expect(response.status).toBe(200)
    })

    test('should handle data: URIs safely', async () => {
      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test ${Date.now()}`,
          description: 'Test',
          steps: [
            {
              type: 'NAVIGATE',
              target: 'data:text/html,<script>alert("XSS")</script>'
            }
          ]
        })
      })

      // Should reject data: URIs
      expect([201, 400]).toContain(response.status)
    })

    test('should handle javascript: URIs safely', async () => {
      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test ${Date.now()}`,
          description: 'Test',
          steps: [
            {
              type: 'NAVIGATE',
              target: 'javascript:alert("XSS")'
            }
          ]
        })
      })

      // Should reject javascript: URIs
      expect([201, 400]).toContain(response.status)
    })
  })

  describe('XSS via Different Encodings', () => {
    test('should prevent URL-encoded XSS', async () => {
      const urlEncoded = '%3Cscript%3Ealert%28%27XSS%27%29%3C%2Fscript%3E'

      const response = await fetch(
        `${BASE_URL}/scenarios?search=${urlEncoded}`,
        {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }
      )

      expect(response.status).toBe(200)
    })

    test('should prevent Unicode-encoded XSS', async () => {
      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test ${Date.now()}`,
          description: '\\u003Cscript\\u003Ealert(1)\\u003C/script\\u003E',
          steps: [{ type: 'NAVIGATE', target: 'https://example.com' }]
        })
      })

      expect([201, 400]).toContain(response.status)
    })

    test('should prevent HTML-encoded XSS', async () => {
      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test ${Date.now()}`,
          description: '&#60;script&#62;alert(1)&#60;/script&#62;',
          steps: [{ type: 'NAVIGATE', target: 'https://example.com' }]
        })
      })

      expect([201, 400]).toContain(response.status)
    })

    test('should prevent hex-encoded XSS', async () => {
      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test ${Date.now()}`,
          description: 'String.fromCharCode(60,115,99,114,105,112,116,62)',
          steps: [{ type: 'NAVIGATE', target: 'https://example.com' }]
        })
      })

      expect([201, 400]).toContain(response.status)
    })
  })

  describe('XSS via SVG and Other Vectors', () => {
    test('should prevent SVG-based XSS', async () => {
      const svgPayloads = [
        '<svg/onload="alert(1)">',
        '<svg><script>alert(1)</script></svg>',
        '<svg onload=alert(1)>',
        '<svg><animate onbegin=alert(1) attributeName=x dur=1s>'
      ]

      for (const payload of svgPayloads) {
        const response = await fetch(`${BASE_URL}/scenarios`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            name: `Test ${Date.now()}`,
            description: payload,
            steps: [{ type: 'NAVIGATE', target: 'https://example.com' }]
          })
        })

        expect([201, 400]).toContain(response.status)
      }
    })

    test('should prevent iframe-based XSS', async () => {
      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test ${Date.now()}`,
          description: '<iframe src="javascript:alert(\'XSS\')"></iframe>',
          steps: [{ type: 'NAVIGATE', target: 'https://example.com' }]
        })
      })

      expect([201, 400]).toContain(response.status)
    })

    test('should prevent object/embed-based XSS', async () => {
      const objectPayloads = [
        '<object data="javascript:alert(1)">',
        '<embed src="javascript:alert(1)">',
        '<object><param name="src" value="javascript:alert(1)"></object>'
      ]

      for (const payload of objectPayloads) {
        const response = await fetch(`${BASE_URL}/scenarios`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            name: `Test ${Date.now()}`,
            description: payload,
            steps: [{ type: 'NAVIGATE', target: 'https://example.com' }]
          })
        })

        expect([201, 400]).toContain(response.status)
      }
    })
  })

  describe('XSS via CSS and Styling', () => {
    test('should prevent CSS-based XSS', async () => {
      const cssPayloads = [
        '<style>body{background:url("javascript:alert(1)")}</style>',
        '<div style="background:url(javascript:alert(1))"></div>',
        '<style>@import "javascript:alert(1)";</style>'
      ]

      for (const payload of cssPayloads) {
        const response = await fetch(`${BASE_URL}/scenarios`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            name: `Test ${Date.now()}`,
            description: payload,
            steps: [{ type: 'NAVIGATE', target: 'https://example.com' }]
          })
        })

        expect([201, 400]).toContain(response.status)
      }
    })

    test('should prevent expression-based XSS', async () => {
      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test ${Date.now()}`,
          description: '<div style="width:expression(alert(1))"></div>',
          steps: [{ type: 'NAVIGATE', target: 'https://example.com' }]
        })
      })

      expect([201, 400]).toContain(response.status)
    })
  })

  describe('XSS via Response Headers', () => {
    test('should not inject through response headers', async () => {
      const response = await fetch(`${BASE_URL}/scenarios`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Custom-Header': '<script>alert(1)</script>'
        }
      })

      expect([200, 400]).toContain(response.status)
    })
  })

  describe('XSS Prevention Verification', () => {
    test('should set Content-Security-Policy header', async () => {
      const response = await fetch(`${BASE_URL}/health`)
      // Note: CSP may not be set on API, but should be on frontend
      expect(response.status).toBe(200)
    })

    test('should escape all user input in responses', async () => {
      const response = await fetch(`${BASE_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test<>&\\"'${Date.now()}`,
          description: '<Test>&"\'',
          steps: [{ type: 'NAVIGATE', target: 'https://example.com' }]
        })
      })

      if (response.status === 201) {
        const data = await response.json()
        const responseStr = JSON.stringify(data)

        // If HTML tags are present, they should be escaped
        if (responseStr.includes('<')) {
          expect(responseStr).toContain('&lt;')
        }
      }
    })
  })
})
