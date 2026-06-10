/**
 * Verify Cloudflare Turnstile token (free tier).
 * Skipped when TURNSTILE_SECRET_KEY is not configured (local dev).
 */
export async function verifyTurnstileToken(token, remoteIp) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    return { ok: true, skipped: true }
  }

  if (!token) {
    return { ok: false, message: 'Captcha verification is required' }
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  })
  if (remoteIp) {
    body.set('remoteip', remoteIp)
  }

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  const result = await response.json()
  if (!result.success) {
    return { ok: false, message: 'Captcha verification failed. Please try again.' }
  }

  return { ok: true, skipped: false }
}
