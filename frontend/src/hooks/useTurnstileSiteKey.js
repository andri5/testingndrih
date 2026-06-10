import { useEffect, useState } from 'react'

const buildTimeKey = (import.meta.env.VITE_TURNSTILE_SITE_KEY || '').trim()

function readMetaSiteKey() {
  const meta = document.querySelector('meta[name="turnstile-site-key"]')
  return (meta?.getAttribute('content') || '').trim()
}

/**
 * Site key: meta tag (server-injected) → build → /api/config/public
 */
export function useTurnstileSiteKey() {
  const [siteKey, setSiteKey] = useState(() => readMetaSiteKey() || buildTimeKey)

  useEffect(() => {
    const metaKey = readMetaSiteKey()
    if (metaKey) {
      setSiteKey(metaKey)
      return
    }

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
