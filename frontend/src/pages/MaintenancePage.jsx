import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Coffee, RefreshCw, ServerCrash, Wrench } from 'lucide-react'
import { probeHealth } from '../components/ServerHealthMonitor'

const copy = {
  maintenance: {
    title: 'Under Maintenance',
    description:
      'We\'re performing scheduled maintenance on Test Sambil Ngopi. Your scenarios and data are safe — we\'ll be back shortly.',
    status: 'Maintenance in progress',
    icon: Wrench,
  },
  down: {
    title: 'Server Unavailable',
    description:
      'We can\'t reach the server right now. This may be temporary downtime or maintenance. Please try again in a few minutes.',
    status: 'Connection failed',
    icon: ServerCrash,
  },
}

export default function MaintenancePage() {
  const [searchParams] = useSearchParams()
  const reason = searchParams.get('reason') === 'down' ? 'down' : 'maintenance'
  const t = copy[reason]
  const Icon = t.icon
  const [checking, setChecking] = useState(false)
  const [lastCheck, setLastCheck] = useState(null)

  const tryReconnect = async () => {
    setChecking(true)
    try {
      const { ok, data } = await probeHealth()
      setLastCheck(new Date())
      if (ok && data.status === 'ok') {
        window.location.href = '/'
        return
      }
    } catch {
      setLastCheck(new Date())
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    tryReconnect()
    const interval = setInterval(tryReconnect, 15000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="auth-page-bg min-h-screen bg-[#0F0E11] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center animate-slide-up">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-[#161618] border border-[#2A2A2D] flex items-center justify-center">
              <Icon size={32} className="text-[#5E6AD2]" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-[#5E6AD2] flex items-center justify-center border-2 border-[#0F0E11]">
              <Coffee size={14} className="text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-xl font-semibold text-[#E0E0E2] mb-2">{t.title}</h1>
        <p className="text-sm text-[#8B8B8E] mb-6 leading-relaxed">{t.description}</p>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161618] border border-[#2A2A2D] text-xs text-[#8B8B8E] mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
          {t.status}
          {checking && <span className="text-[#5E6AD2] ml-1">· checking…</span>}
        </div>

        {lastCheck && (
          <p className="text-[11px] text-[#555] mb-4">
            Last checked {lastCheck.toLocaleTimeString()}
          </p>
        )}

        <button
          type="button"
          onClick={tryReconnect}
          disabled={checking}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#5E6AD2] text-sm font-medium text-white hover:bg-[#4F5BBF] transition-colors disabled:opacity-60"
        >
          <RefreshCw size={15} className={checking ? 'animate-spin' : ''} />
          {checking ? 'Checking server…' : 'Try again'}
        </button>

        <p className="text-[11px] text-[#555] mt-6">
          Auto-retry every 15 seconds. Grab a coffee while you wait ☕
        </p>
      </div>
    </div>
  )
}
