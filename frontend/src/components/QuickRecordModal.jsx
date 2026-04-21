import { useState } from 'react'
import { Button, Spinner } from './ui'
import { scenarioAPI } from '../services/api'

export function QuickRecordModal({ onClose, onCreated }) {
  const [url, setUrl] = useState('')
  const [customName, setCustomName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState(null)

  const generateName = () => {
    const now = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    return `Recording ${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
  }

  const handleStart = async (e) => {
    e.preventDefault()
    const trimmedUrl = url.trim()
    if (!trimmedUrl) { setError('URL wajib diisi'); return }

    let finalUrl = trimmedUrl
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl
    }

    setIsCreating(true)
    setError(null)

    try {
      const name = customName.trim() || generateName()
      const res = await scenarioAPI.create(name, 'Quick record session', finalUrl)
      const scenario = res.data.scenario || res.data
      onCreated(scenario, finalUrl)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat scenario')
      setIsCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#0F0E11] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.06)]">
          <div>
            <h2 className="text-xl font-bold text-[#E0E0E2]">⚡ Quick Record</h2>
            <p className="text-sm text-[#8A8A8F] mt-1">Masukkan URL — scenario dibuat otomatis & recording langsung mulai</p>
          </div>
          <button onClick={onClose} className="text-[#555] hover:text-[#E0E0E2] text-2xl transition-colors">✕</button>
        </div>

        {/* Form */}
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
              className="w-full bg-[#141316] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2.5 text-sm text-[#E0E0E2] placeholder-[#555] focus:outline-none focus:ring-2 focus:ring-[#5E6AD2] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8A8A8F] mb-1.5 uppercase tracking-wider">
              Nama Scenario <span className="text-[#444] normal-case">(opsional, akan di-generate otomatis)</span>
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={`Recording ${new Date().toLocaleDateString('en-GB')} ...`}
              className="w-full bg-[#141316] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2.5 text-sm text-[#E0E0E2] placeholder-[#555] focus:outline-none focus:ring-2 focus:ring-[#5E6AD2] focus:border-transparent"
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="flex-1"
              disabled={isCreating}
            >
              {isCreating ? <><Spinner size="sm" /> Membuat...</> : '⚡ Start Recording'}
            </Button>
            <Button type="button" variant="secondary" size="lg" onClick={onClose} disabled={isCreating}>
              Batal
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
