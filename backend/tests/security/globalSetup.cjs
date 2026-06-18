const fs = require('fs')
const path = require('path')

const TOKEN_FILE = path.join(__dirname, '.auth-token.json')

module.exports = async () => {
  const baseUrl = process.env.SECURITY_TEST_API_URL || 'http://localhost:5001/api'
  const email = process.env.SECURITY_TEST_EMAIL || 'admin@testingndrih.local'
  const password = process.env.SECURITY_TEST_PASSWORD || 'AdminPass123!'

  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      captchaToken: 'security-test-bypass',
    }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.token) {
    throw new Error(
      `Security globalSetup login failed (${response.status}): ${data.message || 'no token'}. ` +
        'Start backend on :5001 and seed admin@testingndrih.local / AdminPass123!'
    )
  }

  fs.writeFileSync(
    TOKEN_FILE,
    JSON.stringify({ token: data.token, userId: data.user?.id ?? null })
  )
}
