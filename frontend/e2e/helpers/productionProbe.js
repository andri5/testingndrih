/** Retry delays (seconds) — aligned with prod-monitor pre-check workflow. */
export const PROBE_RETRY_DELAYS_SEC = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15]

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Probe GET /health with retries (handles deploy windows when nginx upstream hangs).
 * @returns {{ ok: boolean, maintenance: boolean, body?: object, status?: number }}
 */
export async function probeProductionHealth(request, baseURL, perAttemptTimeout = 25000) {
  const healthUrl = `${baseURL.replace(/\/$/, '')}/health`

  for (let i = 0; i < PROBE_RETRY_DELAYS_SEC.length; i++) {
    const waitSec = PROBE_RETRY_DELAYS_SEC[i]

    try {
      const res = await request.get(healthUrl, { timeout: perAttemptTimeout })
      const code = res.status()
      const contentType = res.headers()['content-type'] || ''

      if (code === 503 && contentType.includes('application/json')) {
        const body = await res.json()
        if (body.status === 'maintenance') {
          return { ok: true, maintenance: true, body, status: code }
        }
      }

      if (res.ok()) {
        const body = await res.json()
        if (body.status === 'ok') {
          return { ok: true, maintenance: false, body, status: code }
        }
      }

      // nginx maintenance HTML (503) or unexpected body — retry during deploy
    } catch {
      // timeout / connection reset while app restarts
    }

    if (i < PROBE_RETRY_DELAYS_SEC.length - 1) {
      await sleep(waitSec * 1000)
    }
  }

  return { ok: false, maintenance: false }
}

/** Navigate with retries when prod is recovering from deploy. */
export async function gotoWithRetry(page, path, options = {}) {
  const { maxAttempts = 5, waitUntil = 'domcontentloaded', timeout = 30000 } = options
  const delays = [2, 4, 6, 8, 10]

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await page.goto(path, { waitUntil, timeout })
      if (res && (res.ok() || res.status() === 503)) {
        return res
      }
    } catch {
      // page load timeout during deploy — retry
    }

    if (i < maxAttempts - 1) {
      await sleep((delays[i] ?? 10) * 1000)
    }
  }

  return page.goto(path, { waitUntil, timeout })
}
