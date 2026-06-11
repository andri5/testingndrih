import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, Loader } from 'lucide-react';
import { Tooltip } from './ui'
const HEADLESS_TIP = {
  en: 'Browser will not appear on screen — faster and ideal for CI/CD',
  id: 'Browser tidak akan tampil di layar — lebih cepat dan cocok untuk CI/CD',
}

const FALLBACK_BROWSERS = [
  { key: 'chromium', displayName: 'Chrome', description: 'Chromium-based (Chrome, Edge compatible)', isDefault: true },
  { key: 'firefox', displayName: 'Firefox', description: 'Mozilla Firefox browser', isDefault: false },
  { key: 'webkit', displayName: 'Safari', description: 'WebKit-based (Safari compatible)', isDefault: false },
]

const FALLBACK_MOBILE = [
  { key: 'iphone-14', displayName: 'iPhone 14', description: 'Apple iPhone 14 — WebKit, 390×844', engine: 'webkit', type: 'phone', viewport: '390×844' },
  { key: 'iphone-14-pro-max', displayName: 'iPhone 14 Pro Max', description: 'Apple iPhone 14 Pro Max — WebKit, 430×932', engine: 'webkit', type: 'phone', viewport: '430×932' },
  { key: 'pixel-7', displayName: 'Pixel 7', description: 'Google Pixel 7 — Chromium, 412×915', engine: 'chromium', type: 'phone', viewport: '412×915' },
  { key: 'galaxy-s9', displayName: 'Galaxy S9+', description: 'Samsung Galaxy S9+ — Chromium, 320×658', engine: 'chromium', type: 'phone', viewport: '320×658' },
  { key: 'ipad-pro-11', displayName: 'iPad Pro 11"', description: 'Apple iPad Pro 11" — WebKit, 834×1194', engine: 'webkit', type: 'tablet', viewport: '834×1194' },
]

export default function BrowserSelector({
  selectedBrowser = 'chromium',
  selectedDevice = null,
  onBrowserChange,
  onDeviceChange,
  onHeadlessChange,
  headless = false,
  disabled = false
}) {
  const [browsers, setBrowsers] = useState(FALLBACK_BROWSERS)
  const [mobileDevices, setMobileDevices] = useState(FALLBACK_MOBILE)
  const [loading, setLoading] = useState(true)
  // 'desktop' | 'mobile'
  const [mode, setMode] = useState(selectedDevice ? 'mobile' : 'desktop')

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    fetch('/api/executions/browsers', {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (data.browsers?.length) setBrowsers(data.browsers)
        if (data.mobileDevices?.length) setMobileDevices(data.mobileDevices)
      })
      .catch(() => {/* use fallback */})
      .finally(() => setLoading(false))
  }, [])

  const handleModeSwitch = (m) => {
    setMode(m)
    if (m === 'desktop') {
      onDeviceChange && onDeviceChange(null)
    } else {
      // pre-select first device
      if (!selectedDevice && mobileDevices.length > 0) {
        onDeviceChange && onDeviceChange(mobileDevices[0].key)
      }
    }
  }

  // colours
  const active = 'border-blue-500 bg-blue-50 text-slate-900'
  const inactive = 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
  const label = 'text-slate-600'
  const cardBg = 'bg-slate-50 border-slate-200'

  if (loading) {
    return (
      <div className={`flex items-center gap-2 p-3 rounded-lg ${'bg-slate-100'}`}>
        <Loader className={`w-4 h-4 animate-spin ${'text-blue-600'}`} />
        <span className={`text-sm ${label}`}>Loading...</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className={`inline-flex rounded-lg border p-1 gap-1 ${cardBg}`}>
        <Tooltip text="Test on desktop browsers (Chrome, Firefox, Safari)" position="top">
          <button
            onClick={() => handleModeSwitch('desktop')}
            disabled={disabled}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all border ${mode === 'desktop' ? active : inactive} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Monitor size={14} />
            Desktop
          </button>
        </Tooltip>
        <Tooltip text="Emulate mobile/tablet devices (iPhone, Android, iPad)" position="top">
          <button
            onClick={() => handleModeSwitch('mobile')}
            disabled={disabled}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all border ${mode === 'mobile' ? active : inactive} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Smartphone size={14} />
            Mobile
          </button>
        </Tooltip>
      </div>

      {/* Desktop browsers */}
      {mode === 'desktop' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {browsers.map(b => (
            <Tooltip key={b.key} text={b.description} position="bottom">
              <button
                onClick={() => onBrowserChange && onBrowserChange(b.key)}
                disabled={disabled}
                className={`p-3 rounded-lg border-2 transition-all text-left w-full ${selectedBrowser === b.key ? active.replace('text-', 'border-blue-500 text-') : inactive} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className={`font-medium text-sm ${selectedBrowser === b.key ? 'text-slate-900' : 'text-slate-700'}`}>
                  {b.displayName}
                </div>
                {b.isDefault && (
                  <div className={`text-xs mt-1 ${'text-blue-600'}`}>Default</div>
                )}
              </button>
            </Tooltip>
          ))}
        </div>
      )}

      {/* Mobile devices */}
      {mode === 'mobile' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {mobileDevices.map(d => (
            <Tooltip key={d.key} text={d.description} position="bottom">
              <button
                onClick={() => onDeviceChange && onDeviceChange(d.key)}
                disabled={disabled}
                className={`p-3 rounded-lg border-2 transition-all text-left w-full ${selectedDevice === d.key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{d.type === 'tablet' ? '📟' : '📱'}</span>
                  <div>
                    <div className={`font-medium text-sm ${'text-slate-900'}`}>{d.displayName}</div>
                    <div className={`text-xs ${'text-slate-500'}`}>{d.viewport}</div>
                  </div>
                </div>
              </button>
            </Tooltip>
          ))}
        </div>
      )}

      {/* Headless toggle */}
      <div className={`flex items-center gap-3 p-3 rounded-lg border ${cardBg}`}>
        <Tooltip text={HEADLESS_TIP.en} position="right">
          <input
            type="checkbox"
            id="headless"
            checked={headless}
            onChange={(e) => onHeadlessChange && onHeadlessChange(e.target.checked)}
            disabled={disabled}
            className="w-4 h-4 rounded cursor-pointer"
          />
        </Tooltip>
        <label htmlFor="headless" className="flex-1 cursor-pointer">
          <div className={`text-sm font-medium ${'text-slate-900'}`}>Headless Mode</div>
          <div className={`text-xs ${label}`}>Run without visible browser UI</div>
        </label>
      </div>
    </div>
  )
}
