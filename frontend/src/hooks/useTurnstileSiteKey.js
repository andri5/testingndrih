import { useEffect, useState } from 'react'

const buildTimeKey = (import.meta.env.VITE_TURNSTILE_SITE_KEY || '').trim()

/**
 * Site key from Vite build, with runtime fallback from /api/config/public
 * (so production works after .env update without a full frontend rebuild).
 */
export function useTurnstileSiteKey() {
  const [siteKey, setSiteKey] = useState(buildTimeKey)

  useEffect(() => {
    let cancelled = false

    fetch('/api/config/public')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.turnstileSiteKey?.trim()) return
        setSiteKey(data.turnstileSiteKey.trim())
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  return siteKey
}
