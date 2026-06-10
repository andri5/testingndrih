/**
 * Public app URL used in emails (password reset, notifications).
 * In production, FRONTEND_URL must be set in the environment (e.g. VPS .env).
 */
export function getFrontendUrl() {
  const raw = (process.env.FRONTEND_URL || '').trim()

  if (raw) {
    return raw.replace(/\/+$/, '')
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FRONTEND_URL is not set. Add FRONTEND_URL=https://testsambilngopi.com to production .env'
    )
  }

  return 'http://localhost:3001'
}
