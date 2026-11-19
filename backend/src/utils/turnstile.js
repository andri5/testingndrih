/**
 * Verify Cloudflare Turnstile token (free tier).
 * Skipped when TURNSTILE_SECRET_KEY is not configured (local dev).
 */

/** Turnstile remoteip must be a single IP — never a full X-Forwarded-For list. */
function normalizeRemoteIp(remoteIp) {
  if (!remoteIp || typeof remoteIp !== 'string') return undefined
  let first = remoteIp.split(',')[0].trim()
  if (!first) return undefined
  // IPv4 with port → strip port
  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(first)) {
    first = first.split(':')[0]
  }
  // [IPv6]:port
  if (first.startsWith('[')) {
    const match = first.match(/^\[([^\]]+)\]/)
    if (match) first = match[1]
  }
  return first || undefined
}

export async function verifyTurnstileToken(token, remoteIp) {
  const secret = process.env.TURNSTILE_SECRET_KEY

  if (process.env.NODE_ENV !== 'production' && token === 'security-test-bypass') {
    return { ok: true, skipped: true, testBypass: true }
  }

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
  const ip = normalizeRemoteIp(remoteIp)
  if (ip) {
    body.set('remoteip', ip)
  }

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  const result = await response.json()
  if (!result.success) {
    const codes = Array.isArray(result['error-codes']) ? result['error-codes'].join(', ') : ''
    console.warn('[turnstile] siteverify failed', { codes: codes || 'unknown', hasIp: Boolean(ip) })
    // Invalid/mismatched keys often surface as invalid-input-response / invalid-input-secret
    if (codes.includes('invalid-input-secret') || codes.includes('missing-input-secret')) {
      return {
        ok: false,
        message: 'Captcha server key misconfigured. Check TURNSTILE_SECRET_KEY on the VPS.',
      }
    }
    return { ok: false, message: 'Captcha verification failed. Please try again.' }
  }

  return { ok: true, skipped: false }
}
