import { useState } from 'react'
import { X, Sparkles, Loader2 } from 'lucide-react'
import { Button, Input, Spinner } from './ui'
import ExportFormatButton from './ExportFormatButton'
import { aiAPI, scenarioAPI } from '../services/api'
import { useAiEnabled, formatAiQuotaMessage, invalidateAiStatusCache } from '../hooks/useAiEnabled'

export default function AIGenerateScenarioModal({ onClose, onCreated }) {
  const { configured, canUse, quota, remaining, loading: statusLoading, refresh } = useAiEnabled()
  const [prompt, setPrompt] = useState('')
  const [url, setUrl] = useState('')
  const [preview, setPreview] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setGenerating(true)
    setError(null)
    setPreview(null)
    try {
      const res = await aiAPI.generateScenario(prompt.trim(), url.trim() || undefined)
      setPreview(res.data.scenario)
      invalidateAiStatusCache()
      refresh()
    } catch (err) {
      const data = err.response?.data
      setError(data?.message || err.message || 'Generation failed')
      if (data?.code?.includes('LIMIT') || err.response?.status === 429) {
        invalidateAiStatusCache()
        refresh()
      }
    } finally {
      setGenerating(false)
    }
  }

  const handleCreate = async () => {
    if (!preview) return
    setCreating(true)
    setError(null)
    try {
      const created = await scenarioAPI.create(
        preview.name,
        preview.description || '',
        preview.url
      )
      const scenario = created.data?.scenario || created.data

      for (const step of preview.steps || []) {
        await scenarioAPI.createStep(
          scenario.id,
          step.stepNumber,
          step.type,
          step.description || '',
          step.selector || '',
          step.value || '',
          step.metadata || null
        )
      }

      onCreated?.(scenario)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create scenario')
    } finally {
      setCreating(false)
    }
  }

  if (statusLoading) {
    return (
      <ModalShell onClose={onClose} title="AI Scenario Generator">
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </ModalShell>
    )
  }

  if (!configured) {
    return (
      <ModalShell onClose={onClose} title="AI Scenario Generator">
        <p className="text-sm text-[#8A8A8F]">
          AI is not configured. Set di <code className="text-xs bg-[#141316] px-1 rounded">backend/.env</code>:
          <br />
          <code className="text-xs">AI_ENABLED=true</code> + API key gratis dari{' '}
          <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-[#9BA3F0] underline">
            Groq
          </a>{' '}
          (<code className="text-xs">gsk_...</code>), lalu restart backend.
        </p>
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </ModalShell>
    )
  }

  return (
    <ModalShell onClose={onClose} title="AI Scenario Generator">
      <p className="text-sm text-[#8A8A8F] mb-4">
        Describe what you want to test in plain language. AI will draft scenario steps for you to review.
      </p>

      {quota && (
        <p className={`text-xs mb-4 px-3 py-2 rounded-lg border ${
          quota.canUse
            ? 'border-[#5E6AD2]/30 bg-[#5E6AD2]/10 text-[#9BA3F0]'
            : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
        }`}>
          {formatAiQuotaMessage(quota)}
        </p>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-[#8A8A8F] mb-1">What should this test do?</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="e.g. Login with valid credentials and verify dashboard loads"
            className="w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-[#141316] text-[#E0E0E2] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#5E6AD2]"
            disabled={generating || creating}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#8A8A8F] mb-1">Base URL (optional)</label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            disabled={generating || creating}
          />
        </div>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-400">{error}</p>
      )}

      {preview && (
        <div className="mt-4 rounded-lg border border-[#2A2A2D] bg-[#141316] p-4 max-h-64 overflow-y-auto">
          <p className="font-semibold text-[#E0E0E2]">{preview.name}</p>
          <p className="text-xs text-[#8A8A8F] mt-1">{preview.url}</p>
          {preview.description && (
            <p className="text-sm text-[#A0A0A4] mt-2">{preview.description}</p>
          )}
          <ol className="mt-3 space-y-1.5 list-decimal list-inside text-sm text-[#C0C0C4]">
            {(preview.steps || []).map((s) => (
              <li key={s.stepNumber}>
                <span className="font-medium text-[#E0E0E2]">{s.type}</span>
                {' — '}{s.description}
                {s.selector && (
                  <span className="block text-xs text-[#8A8A8F] font-mono ml-5">{s.selector}</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2 justify-end">
        <Button variant="ghost" onClick={onClose} disabled={creating}>
          Cancel
        </Button>
        <ExportFormatButton
          format="primary"
          icon={generating ? Loader2 : Sparkles}
          onClick={handleGenerate}
          disabled={generating || creating || !prompt.trim() || !canUse || remaining === 0}
          className={generating ? '[&_svg]:animate-spin' : ''}
        >
          {generating ? 'Generating...' : preview ? 'Regenerate' : 'Generate'}
        </ExportFormatButton>
        {preview && (
          <ExportFormatButton
            format="csv"
            onClick={handleCreate}
            disabled={creating || generating}
          >
            {creating ? 'Creating...' : 'Create Scenario'}
          </ExportFormatButton>
        )}
      </div>
    </ModalShell>
  )
}

function ModalShell({ onClose, title, children }) {
  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-[#1A1A1C] border border-[#2D2D2F] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#9BA3F0]" />
            <h3 className="text-lg font-semibold text-[#E0E0E2]">{title}</h3>
          </div>
          <button onClick={onClose} className="text-[#666] hover:text-[#E0E0E2]">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
