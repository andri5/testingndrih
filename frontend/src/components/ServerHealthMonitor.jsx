import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const SKIP_PREFIXES = [
  '/maintenance',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/session-expired',
  '/server-error',
]

const POLL_MS = 30000
const FAIL_THRESHOLD = 2

async function probeHealth() {
  const res = await fetch('/health', {
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

export default function ServerHealthMonitor() {
  const navigate = useNavigate()
  const location = useLocation()
  const failuresRef = useRef(0)

  useEffect(() => {
    const path = location.pathname
    if (SKIP_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
      return undefined
    }

    let timer

    async function check() {
      if (!navigator.onLine) return

      try {
        const { ok, status, data } = await probeHealth()

        if (ok && data.status === 'ok') {
          failuresRef.current = 0
          return
        }

        if (data.status === 'maintenance' || status === 503) {
          navigate('/maintenance?reason=maintenance', { replace: true })
          return
        }

        throw new Error('unhealthy')
      } catch {
        failuresRef.current += 1
        if (failuresRef.current >= FAIL_THRESHOLD) {
          navigate('/maintenance?reason=down', { replace: true })
        }
      }
    }

    check()
    timer = setInterval(check, POLL_MS)
    return () => clearInterval(timer)
  }, [location.pathname, navigate])

  return null
}

export { probeHealth }
