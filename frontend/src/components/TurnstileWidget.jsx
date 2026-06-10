import { useEffect, useRef, useState } from 'react'

const SCRIPT_ID = 'cf-turnstile-script'
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

function loadTurnstileScript() {
  if (window.turnstile) {
    return Promise.resolve()
  }

  const existing = document.getElementById(SCRIPT_ID)
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load captcha')), { once: true })
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load captcha'))
    document.head.appendChild(script)
  })
}

function waitForTurnstile() {
  return new Promise((resolve, reject) => {
    if (window.turnstile?.ready) {
      window.turnstile.ready(resolve)
      return
    }
    reject(new Error('Turnstile API unavailable'))
  })
}

export default function TurnstileWidget({ siteKey, onVerify, onExpire, onError, resetKey = 0 }) {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)
  const [loadError, setLoadError] = useState(null)

  const onVerifyRef = useRef(onVerify)
  const onExpireRef = useRef(onExpire)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onVerifyRef.current = onVerify
    onExpireRef.current = onExpire
    onErrorRef.current = onError
  })

  useEffect(() => {
    if (!siteKey?.trim()) return undefined

    let cancelled = false

    const renderWidget = async () => {
      try {
        await loadTurnstileScript()
        await waitForTurnstile()
        if (cancelled || !containerRef.current || !window.turnstile) return

        if (widgetIdRef.current != null) {
          window.turnstile.remove(widgetIdRef.current)
          widgetIdRef.current = null
        }

        containerRef.current.innerHTML = ''
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey.trim(),
          theme: 'auto',
          callback: (token) => onVerifyRef.current?.(token),
          'expired-callback': () => onExpireRef.current?.(),
          'error-callback': () => onErrorRef.current?.(),
        })
        setLoadError(null)
      } catch {
        if (!cancelled) {
          setLoadError('Captcha could not be loaded')
          onErrorRef.current?.()
        }
      }
    }

    renderWidget()

    return () => {
      cancelled = true
      if (widgetIdRef.current != null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [siteKey, resetKey])

  if (!siteKey?.trim()) {
    return null
  }

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="flex justify-center min-h-[65px]" />
      {loadError && (
        <p className="text-xs text-[#F87171] text-center">{loadError}</p>
      )}
    </div>
  )
}
