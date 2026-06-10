import { useCallback, useEffect, useRef, useState } from 'react'

const SCRIPT_ID = 'cf-turnstile-script'
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

function whenTurnstileReady() {
  return new Promise((resolve, reject) => {
    if (window.turnstile?.ready) {
      window.turnstile.ready(resolve)
      return
    }
    if (window.turnstile?.render) {
      resolve()
      return
    }
    reject(new Error('Turnstile API unavailable'))
  })
}

function loadTurnstileScript() {
  if (window.turnstile?.render) {
    return whenTurnstileReady()
  }

  const existing = document.getElementById(SCRIPT_ID)

  return new Promise((resolve, reject) => {
    const finish = () => {
      whenTurnstileReady().then(resolve).catch(reject)
    }

    if (existing) {
      if (existing.dataset.loaded === 'true') {
        finish()
        return
      }
      existing.addEventListener('load', finish, { once: true })
      existing.addEventListener('error', () => reject(new Error('Script load failed')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => {
      script.dataset.loaded = 'true'
      finish()
    }
    script.onerror = () => reject(new Error('Script load failed'))
    document.head.appendChild(script)
  })
}

export default function TurnstileWidget({ siteKey, onVerify, onExpire, onError, resetKey = 0 }) {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)
  const [loadError, setLoadError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  const onVerifyRef = useRef(onVerify)
  const onExpireRef = useRef(onExpire)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onVerifyRef.current = onVerify
    onExpireRef.current = onExpire
    onErrorRef.current = onError
  })

  const handleRetry = useCallback(() => {
    setLoadError(null)
    setRetryCount((n) => n + 1)
  }, [])

  useEffect(() => {
    const key = siteKey?.trim()
    if (!key) return undefined

    let cancelled = false

    const renderWidget = async () => {
      try {
        await loadTurnstileScript()
        if (cancelled || !containerRef.current || !window.turnstile?.render) return

        if (widgetIdRef.current != null) {
          try {
            window.turnstile.remove(widgetIdRef.current)
          } catch {
            /* ignore */
          }
          widgetIdRef.current = null
        }

        containerRef.current.innerHTML = ''
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: key,
          theme: 'auto',
          callback: (token) => {
            setLoadError(null)
            onVerifyRef.current?.(token)
          },
          'expired-callback': () => onExpireRef.current?.(),
          'error-callback': () => {
            setLoadError('Captcha verification failed. Please try again.')
            onErrorRef.current?.()
          },
        })
        setLoadError(null)
      } catch (err) {
        if (!cancelled) {
          console.error('[Turnstile]', err)
          setLoadError('Captcha could not be loaded')
        }
      }
    }

    renderWidget()

    return () => {
      cancelled = true
      if (widgetIdRef.current != null && window.turnstile?.remove) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          /* ignore */
        }
        widgetIdRef.current = null
      }
    }
  }, [siteKey, resetKey, retryCount])

  if (!siteKey?.trim()) {
    return null
  }

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="flex justify-center min-h-[65px]" />
      {loadError && (
        <div className="text-center space-y-1">
          <p className="text-xs text-[#F87171]">{loadError}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="text-xs text-[#9BA3F0] hover:text-[#5E6AD2] underline"
          >
            Retry captcha
          </button>
        </div>
      )}
    </div>
  )
}
