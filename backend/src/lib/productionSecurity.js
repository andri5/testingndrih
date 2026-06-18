const WEAK_JWT_SECRETS = new Set([
  'dev-secret-key',
  'change-me-to-a-long-random-secret',
  'your-long-random-secret-key-change-this-in-production-min-32-chars',
  'your-secret-key-here',
  'your-super-secret-jwt-key',
  'test-secret',
])

const WEAK_DB_PASSWORD_FRAGMENTS = [
  'testpass123',
  'changeme123',
  'change-me-local-only',
  'change-me-before-first-run',
  'devonly-db-password',
  'password',
  'postgres',
]

export function validateProductionSecurity() {
  if (process.env.NODE_ENV !== 'production') {
    return
  }

  const errors = []
  const warnings = []

  const jwtSecret = (process.env.JWT_SECRET || '').trim()
  if (!jwtSecret || jwtSecret.length < 32 || WEAK_JWT_SECRETS.has(jwtSecret)) {
    errors.push(
      'JWT_SECRET must be a unique random string with at least 32 characters in production'
    )
  }

  const databaseUrl = process.env.DATABASE_URL || ''
  const dbPassword = process.env.DB_PASSWORD || ''
  const weakDbCredential = WEAK_DB_PASSWORD_FRAGMENTS.some(
    (fragment) => databaseUrl.includes(fragment) || dbPassword === fragment
  )
  if (weakDbCredential) {
    warnings.push(
      'Database credentials look like a default value — change DB_PASSWORD and DATABASE_URL on the VPS'
    )
  }

  const weakSeedPasswords = ['changeme123', 'change-me-local-only', 'change-me-before-first-run']
  if (weakSeedPasswords.includes(process.env.SEED_PASSWORD || '') && process.env.RUN_SEED === 'true') {
    warnings.push('SEED_PASSWORD is still the default while RUN_SEED=true')
  }

  const frontendUrl = (process.env.FRONTEND_URL || '').trim()
  if (!frontendUrl) {
    errors.push(
      'FRONTEND_URL must be set in production (e.g. https://testsambilngopi.com) for password-reset emails'
    )
  } else if (/localhost|127\.0\.0\.1/i.test(frontendUrl)) {
    errors.push(
      `FRONTEND_URL must not point to localhost in production (current: ${frontendUrl})`
    )
  } else if (!frontendUrl.startsWith('https://')) {
    warnings.push(
      `FRONTEND_URL should use HTTPS in production (current: ${frontendUrl})`
    )
  }

  for (const warning of warnings) {
    console.warn(`[security] WARNING: ${warning}`)
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`[security] ERROR: ${error}`)
    }
    console.error('[security] Generate values with: node scripts/ops/generate-production-secrets.js')
    process.exit(1)
  }
}
