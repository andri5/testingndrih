import { useEffect, useRef, useState } from 'react'

const SCRIPT_ID = 'cf-turnstile-script'
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

function loadTurnstileScript() {
  if (document.getElementById(SCRIPT_ID)) {
    return Promise.resolve()
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

export default function TurnstileWidget({ siteKey, onVerify, onExpire, onError, resetKey = 0 }) {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    if (!siteKey) return undefined

    let cancelled = false

    const renderWidget = async () => {
      try {
        await loadTurnstileScript()
        if (cancelled || !containerRef.current || !window.turnstile) return

        if (widgetIdRef.current != null) {
          window.turnstile.remove(widgetIdRef.current)
          widgetIdRef.current = null
        }

        containerRef.current.innerHTML = ''
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'dark',
          callback: (token) => onVerify?.(token),
          'expired-callback': () => onExpire?.(),
          'error-callback': () => onError?.(),
        })
        setLoadError(null)
      } catch {
        if (!cancelled) {
          setLoadError('Captcha could not be loaded')
          onError?.()
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
  }, [siteKey, resetKey, onVerify, onExpire, onError])

  if (!siteKey) {
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
