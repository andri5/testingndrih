import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Spinner } from './ui'
import { scenarioAPI, recorderAPI } from '../services/api'

const PHASE = {
  FORM: 'form',
  RECORDING: 'recording',
}

/**
 * Quick Record Studio — 1 click Start = 1 target window + live steps in this modal.
 * Avoids navigating to scenario detail + setTimeout auto-start (popup blockers).
 */
export function QuickRecordModal({ onClose, onFinished, folderId = null }) {
  const [url, setUrl] = useState('')
  const [customName, setCustomName] = useState('')
  const [phase, setPhase] = useState(PHASE.FORM)
  const [isBusy, setIsBusy] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [error, setError] = useState(null)
  const [popupBlocked, setPopupBlocked] = useState(false)
  const [scenario, setScenario] = useState(null)
  const [openUrl, setOpenUrl] = useState(null)
  const [steps, setSteps] = useState([])

  const recWindowRef = useRef(null)
  const bridgeWinRef = useRef(null)
  const recordTokenRef = useRef(null)
  const pollRef = useRef(null)
  const scenarioIdRef = useRef(null)
  const [injectScriptText, setInjectScriptText] = useState('')
  const [recordingMethod, setRecordingMethod] = useState(null)
  const [clientGuideUrl, setClientGuideUrl] = useState(null)
  const [isCopyingScript, setIsCopyingScript] = useState(false)

  const generateName = () => {
    const now = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    return `Recording ${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
  }

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const startPolling = useCallback((scenarioId) => {
    stopPolling()
    const tick = async () => {
      try {
        const res = await recorderAPI.status(scenarioId)
        if (res.data.status === 'recording') {
          setSteps(res.data.steps || [])
        } else if (res.data.status === 'stopped' || res.data.status === 'idle') {
          setSteps(res.data.steps || [])
        }
      } catch {
        /* ignore */
      }
    }
    tick()
    pollRef.current = setInterval(tick, 400)
  }, [stopPolling])

  // Live sync from client-gate (same bridge as ScenarioDetailPage)
  useEffect(() => {
    if (phase !== PHASE.RECORDING || !scenario?.id) return undefined
    const id = scenario.id

    const applySync = (payload) => {
      if (!payload || payload.type !== '__REC_UI_SYNC__') return
      if (String(payload.sessionId) !== String(id)) return
      if (Array.isArray(payload.steps) && payload.steps.length > 0) {
        setSteps(payload.steps)
        return
      }
      if (payload.step && typeof payload.step === 'object') {
        setSteps((prev) => {
          const key = `${payload.step.type}|${payload.step.selector || ''}|${payload.step.timestamp || ''}`
          if (prev.some((s) => `${s.type}|${s.selector || ''}|${s.timestamp || ''}` === key)) {
            return prev
          }
          return [...prev, payload.step]
        })
      }
    }

    const onMessage = (event) => {
      const data = event.data
      if (!data || typeof data !== 'object') return

      if (data.type === '__REC_UI_SYNC__') {
        applySync(data)
        return
      }

      if (data.type !== '__REC_STEP__') return
      if (String(data.sessionId) !== String(id)) return
      if (!data.data || typeof data.data !== 'object') return
      const rt = data.recordToken || recordTokenRef.current
      if (rt) {
        recorderAPI.receiveClientStep(id, data.data, rt)
          .then((res) => {
            if (Array.isArray(res.data?.steps)) setSteps(res.data.steps)
          })
          .catch(() => {})
        return
      }
      recorderAPI.receiveStep(id, data.data).catch(() => {})
    }

    window.addEventListener('message', onMessage)
    let channel = null
    try {
      channel = new BroadcastChannel(`tsn-recorder-${id}`)
      channel.onmessage = (ev) => applySync(ev.data)
    } catch {
      channel = null
    }

    return () => {
      window.removeEventListener('message', onMessage)
      try { channel?.close() } catch { /* ignore */ }
    }
  }, [phase, scenario?.id])

  useEffect(() => () => {
    stopPolling()
  }, [stopPolling])

  const normalizeUrl = (raw) => {
    let finalUrl = raw.trim()
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `https://${finalUrl}`
    }
    return finalUrl
  }

  const openOrNavigateTarget = (targetUrl) => {
    if (!targetUrl) return false
    const existing = recWindowRef.current
    if (existing && !existing.closed) {
      try {
        existing.location.href = targetUrl
        existing.focus()
        return true
      } catch {
        /* fall through */
      }
    }
    const w = window.open(targetUrl, '_blank', 'width=1280,height=800,menubar=no,toolbar=no,scrollbars=yes,resizable=yes')
    if (!w) return false
    recWindowRef.current = w
    return true
  }

  const handleStart = async (e) => {
    e.preventDefault()
    const trimmedUrl = url.trim()
    if (!trimmedUrl) {
      setError('URL is required')
      return
    }

    const finalUrl = normalizeUrl(trimmedUrl)
    setError(null)
    setPopupBlocked(false)
    setIsBusy(true)

    // Open target only — no full guide page. Bridge opens later via Hubungkan if needed.
    const recWindow = window.open(
      '',
      'tsn_rec_target',
      'width=1280,height=800,menubar=no,toolbar=no,scrollbars=yes,resizable=yes'
    )
    bridgeWinRef.current = null
    if (recWindow) {
      recWindowRef.current = recWindow
      try {
        recWindow.document.write(
          '<html><body style="font-family:sans-serif;padding:40px;background:#0f172a;color:#e2e8f0"><p>Menyiapkan recording…</p></body></html>'
        )
      } catch {
        /* ignore */
      }
    } else {
      setPopupBlocked(true)
      setIsBusy(false)
      setError('Popup diblokir browser. Izinkan popup untuk situs ini, lalu klik Start lagi.')
      return
    }

    try {
      const name = customName.trim() || generateName()
      const createRes = await scenarioAPI.create(
        name,
        'Quick record session',
        finalUrl,
        folderId ? { folderId } : {}
      )
      const created = createRes.data.scenario || createRes.data
      scenarioIdRef.current = created.id
      setScenario(created)

      // Prefer proxy for public sites (one window, injected recorder).
      // Backend forces client-direct for internal / private targets.
      const startRes = await recorderAPI.start(created.id, finalUrl, 'proxy')
      const method = startRes.data.method || 'proxy'
      recordTokenRef.current = startRes.data.recordToken || null
      setRecordingMethod(method)
      setClientGuideUrl(startRes.data.clientGateUrl || null)

      if (method === 'client-direct') {
        setOpenUrl(finalUrl)
        if (recWindow && !recWindow.closed) {
          recWindow.location.href = finalUrl
          try { recWindow.focus() } catch { /* ignore */ }
        } else {
          try { await recorderAPI.stop(created.id) } catch { /* ignore */ }
          setPopupBlocked(true)
          setError('Popup tertutup / diblokir. Izinkan popup, lalu pakai "Buka ulang window".')
          setIsBusy(false)
          setPhase(PHASE.RECORDING)
          startPolling(created.id)
          return
        }
        try {
          if (startRes.data.injectScriptUrl) {
            const u = new URL(startRes.data.injectScriptUrl, window.location.origin)
            if (!u.searchParams.get('origin')) u.searchParams.set('origin', u.origin)
            const scriptRes = await fetch(u.toString(), { credentials: 'omit' })
            if (scriptRes.ok) setInjectScriptText(await scriptRes.text())
          }
        } catch {
          setInjectScriptText('')
        }
      } else {
        const gateUrl = startRes.data.proxyUrl || startRes.data.clientGateUrl
        setOpenUrl(gateUrl || null)
        if (gateUrl) {
          if (recWindow && !recWindow.closed) {
            recWindow.location.href = gateUrl
          } else {
            try { await recorderAPI.stop(created.id) } catch { /* ignore */ }
            setPopupBlocked(true)
            setError('Popup tertutup / diblokir. Izinkan popup, lalu pakai "Buka ulang window".')
            setIsBusy(false)
            setPhase(PHASE.RECORDING)
            startPolling(created.id)
            return
          }
        } else if (recWindow && !recWindow.closed) {
          recWindow.close()
        }
      }

      setPhase(PHASE.RECORDING)
      setSteps([])
      startPolling(created.id)
    } catch (err) {
      if (recWindow && !recWindow.closed) recWindow.close()
      const sid = scenarioIdRef.current
      if (sid) {
        try { await recorderAPI.stop(sid) } catch { /* ignore */ }
      }
      setError(err.response?.data?.message || err.response?.data?.error || 'Gagal memulai Quick Record')
      setPhase(PHASE.FORM)
    } finally {
      setIsBusy(false)
    }
  }

  const handleReopenWindow = () => {
    if (!openUrl) {
      setError('URL recording belum siap. Tutup dan coba Start lagi.')
      return
    }
    const ok = openOrNavigateTarget(openUrl)
    setPopupBlocked(!ok)
    if (!ok) {
      setError('Popup masih diblokir. Izinkan popup untuk situs ini.')
    } else {
      setError(null)
    }
  }

  const closeTargetWindow = () => {
    for (const ref of [recWindowRef, bridgeWinRef]) {
      try {
        if (ref.current && !ref.current.closed) ref.current.close()
      } catch {
        /* ignore */
      }
      ref.current = null
    }
    setInjectScriptText('')
    setClientGuideUrl(null)
    setRecordingMethod(null)
  }

  const handleCopyInjectScript = async () => {
    if (!injectScriptText) {
      setError('Script belum siap. Coba Start ulang.')
      return
    }
    setIsCopyingScript(true)
    try {
      await navigator.clipboard.writeText(injectScriptText)
    } catch {
      window.prompt('Salin script ini (Ctrl+A, Ctrl+C):', injectScriptText)
    } finally {
      setIsCopyingScript(false)
    }
  }

  const handleStopAndSave = async () => {
    const id = scenario?.id
    if (!id) return
    setIsStopping(true)
    setError(null)
    stopPolling()
    recordTokenRef.current = null
    try {
      const res = await recorderAPI.stop(id)
      const stoppedSteps = res.data.steps || []
      setSteps(stoppedSteps)
      if (stoppedSteps.length > 0) {
        await recorderAPI.save(id, stoppedSteps)
      }
      closeTargetWindow()
      onFinished?.(scenario, { stepCount: stoppedSteps.length })
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Gagal menghentikan recording')
      startPolling(id)
    } finally {
      setIsStopping(false)
    }
  }

  const handleCancelRecording = async () => {
    const id = scenario?.id
    setIsStopping(true)
    stopPolling()
    recordTokenRef.current = null
    try {
      if (id) {
        try { await recorderAPI.stop(id) } catch { /* ignore */ }
      }
      closeTargetWindow()
      onFinished?.(scenario, { stepCount: steps.length, cancelled: true })
    } finally {
      setIsStopping(false)
    }
  }

  const handleClose = () => {
    if (phase === PHASE.RECORDING) {
      handleCancelRecording()
      return
    }
    onClose?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={phase === PHASE.FORM ? onClose : undefined} />

      <div className={`relative w-full bg-[#0F0E11] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl ${phase === PHASE.RECORDING ? 'max-w-lg' : 'max-w-md'}`}>
        <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.06)]">
          <div>
            <h2 className="text-xl font-bold text-[#E0E0E2]">
              {phase === PHASE.RECORDING ? 'Recording aktif' : 'Quick Record'}
            </h2>
            <p className="text-sm text-[#8A8A8F] mt-1">
              {phase === PHASE.RECORDING
                ? 'Interaksi di window target. Step muncul di sini — lalu Stop & Save.'
                : 'Isi URL → Start. Satu window target (proxy untuk situs publik). Step live di sini.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-[#555] hover:text-[#E0E0E2] text-2xl transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {phase === PHASE.FORM && (
          <form onSubmit={handleStart} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#8A8A8F] mb-1.5 uppercase tracking-wider">
                URL Target *
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                autoFocus
                className="w-full bg-[#141316] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2.5 text-sm text-[#E0E0E2] placeholder-[#555] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8A8A8F] mb-1.5 uppercase tracking-wider">
                Nama Scenario <span className="text-[#444] normal-case">(opsional)</span>
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={`Recording ${new Date().toLocaleDateString('en-GB')} ...`}
                className="w-full bg-[#141316] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2.5 text-sm text-[#E0E0E2] placeholder-[#555] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent"
              />
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button type="submit" variant="primary" size="lg" className="flex-1" disabled={isBusy}>
                {isBusy ? <><Spinner size="sm" /> Memulai…</> : 'Start Recording'}
              </Button>
              <Button type="button" variant="secondary" size="lg" onClick={onClose} disabled={isBusy}>
                Batal
              </Button>
            </div>
          </form>
        )}

        {phase === PHASE.RECORDING && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#E0E0E2] truncate">{scenario?.name}</p>
                <p className="text-xs text-[#8A8A8F] truncate">{scenario?.url}</p>
              </div>
              <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                LIVE · {steps.length} step
              </span>
            </div>

            {(error || popupBlocked) && (
              <div className="px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-200 space-y-2">
                {error && <p>{error}</p>}
                {popupBlocked && (
                  <Button type="button" variant="secondary" size="sm" onClick={handleReopenWindow}>
                    Buka ulang window
                  </Button>
                )}
              </div>
            )}

            {recordingMethod === 'client-direct' && (
              <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#141316] p-3 space-y-2">
                <p className="text-xs text-[#C8C8CC] leading-relaxed">
                  Tab target sudah dibuka. Salin script → paste di Console (F12).
                  Jika diminta Hubungkan bridge, klik sekali (jendela jembatan kecil jangan ditutup).
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleCopyInjectScript}
                    disabled={isCopyingScript || !injectScriptText}
                  >
                    {isCopyingScript ? 'Menyalin…' : 'Salin script'}
                  </Button>
                  {clientGuideUrl && (
                    <a
                      href={clientGuideUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-[#8A8A8F] hover:text-[#E0E0E2] px-2"
                    >
                      Panduan cadangan
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="max-h-56 overflow-y-auto rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#141316]">
              {steps.length === 0 ? (
                <p className="p-4 text-sm text-[#666]">Belum ada step — klik / ketik di window target.</p>
              ) : (
                <ol className="divide-y divide-[rgba(255,255,255,0.06)]">
                  {steps.map((step, idx) => (
                    <li key={`${step.type}-${step.timestamp || idx}-${idx}`} className="px-3 py-2 text-xs text-[#C8C8CC]">
                      <span className="text-[#0F766E] font-semibold mr-2">{idx + 1}.</span>
                      <span className="font-mono text-[#E0E0E2]">{step.type}</span>
                      {step.selector ? (
                        <span className="text-[#666] ml-2 truncate inline-block max-w-[220px] align-bottom" title={step.selector}>
                          {step.selector}
                        </span>
                      ) : null}
                      {step.value != null && step.value !== '' ? (
                        <span className="text-[#8A8A8F] ml-2">“{String(step.value).slice(0, 40)}”</span>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={handleStopAndSave}
                disabled={isStopping}
              >
                {isStopping ? <><Spinner size="sm" /> Menyimpan…</> : 'Stop & Save'}
              </Button>
              {!popupBlocked && openUrl && (
                <Button type="button" variant="secondary" size="lg" onClick={handleReopenWindow} disabled={isStopping}>
                  Fokus window
                </Button>
              )}
              <Button type="button" variant="secondary" size="lg" onClick={handleCancelRecording} disabled={isStopping}>
                Batalkan
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
