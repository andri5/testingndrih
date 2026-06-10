import { useCallback, useEffect, useRef, useState } from 'react'

/** Poll until turnstile.render exists — do NOT use turnstile.ready() with defer/async scripts. */
function waitForTurnstileApi(timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const started = Date.now()

    const attempt = () => {
      if (window.turnstile?.render) {
        resolve(window.turnstile)
        return
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error('Turnstile script timed out'))
        return
      }
      setTimeout(attempt, 50)
    }

    attempt()
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
        const api = await waitForTurnstileApi()
        if (cancelled || !containerRef.current) return

        if (widgetIdRef.current != null) {
          try {
            api.remove(widgetIdRef.current)
          } catch {
            /* ignore */
          }
          widgetIdRef.current = null
        }

        containerRef.current.innerHTML = ''
        widgetIdRef.current = api.render(containerRef.current, {
          sitekey: key,
          theme: 'auto',
          callback: (token) => {
            setLoadError(null)
            onVerifyRef.current?.(token)
          },
          'expired-callback': () => onExpireRef.current?.(),
          'error-callback': () => {
            setLoadError(
              'Captcha verification failed. Ensure testsambilngopi.com is added in Cloudflare Turnstile.'
            )
            onErrorRef.current?.()
          },
        })
        setLoadError(null)
      } catch (err) {
        if (!cancelled) {
          console.error('[Turnstile]', err)
          setLoadError(
            'Captcha could not be loaded. Check network or Cloudflare Turnstile domain settings.'
          )
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
    <div className="space-y-2 turnstile-widget">
      <div ref={containerRef} className="flex justify-center min-h-[65px] w-full" />
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
