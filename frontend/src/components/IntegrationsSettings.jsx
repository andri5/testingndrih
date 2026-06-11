import { useEffect, useState } from 'react'
import { Button, Alert } from './ui'
import { notificationAPI, apiTokenAPI } from '../services/api'
import toast from 'react-hot-toast'
import { Copy, Key, Bell } from 'lucide-react'

const cardCls = 'bg-[#1A1A1C] border border-[#2D2D2F] rounded-xl p-6'
const labelCls = 'block text-sm font-medium text-[#A0A0A4] mb-1.5'
const inputCls = 'w-full px-3 py-2 bg-[#0F0E11] border border-[#2D2D2F] rounded-lg text-[#E0E0E2] text-sm focus:outline-none focus:border-[#5E6AD2]'

const labels = {
  notifications: 'Notifications',
  emailOnFail: 'Email on execution failure',
  emailOnSmoke: 'Email on smoke test failure',
  webhook: 'Webhook URL',
  webhookEnabled: 'Enable webhook',
  webhookOnFail: 'Webhook on execution failure',
  webhookOnSmoke: 'Webhook on smoke test failure',
  save: 'Save notifications',
  ciTokens: 'CI/CD API Tokens',
  createToken: 'Create token',
  tokenName: 'Token name',
  revoke: 'Revoke',
  copyHint: 'Copy this token now — it will not be shown again',
  ciExample: 'CI example command',
  saved: 'Settings saved',
  tokenCreated: 'Token created',
}

export default function IntegrationsSettings() {
  const t = labels

  const [settings, setSettings] = useState(null)
  const [tokens, setTokens] = useState([])
  const [tokenName, setTokenName] = useState('GitHub Actions')
  const [newToken, setNewToken] = useState(null)
  const [saving, setSaving] = useState(false)

  const apiBase = window.location.origin.replace(':3000', ':5001') + '/api'

  useEffect(() => {
    Promise.all([
      notificationAPI.getSettings(),
      apiTokenAPI.list()
    ]).then(([sRes, tRes]) => {
      setSettings(sRes.data.settings)
      setTokens(tRes.data.tokens || [])
    }).catch(() => toast.error('Failed to load integrations'))
  }, [])

  const saveNotifications = async () => {
    setSaving(true)
    try {
      const res = await notificationAPI.updateSettings(settings)
      setSettings(res.data.settings)
      toast.success(t.saved)
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  const createToken = async () => {
    try {
      const res = await apiTokenAPI.create(tokenName, 365)
      setNewToken(res.data.token)
      setTokens((prev) => [res.data.apiToken, ...prev])
      toast.success(t.tokenCreated)
    } catch {
      toast.error('Failed to create token')
    }
  }

  const revokeToken = async (id) => {
    try {
      await apiTokenAPI.revoke(id)
      setTokens((prev) => prev.filter((x) => x.id !== id))
      toast.success('Revoked')
    } catch {
      toast.error('Revoke failed')
    }
  }

  const ciExample = `curl -X POST "${apiBase}/ci/run/YOUR_SCENARIO_ID" \\
  -H "Authorization: Bearer tsn_YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"headless": true, "environmentId": "YOUR_ENV_ID"}'`

  if (!settings) return <p className="text-[#666] text-sm">Loading...</p>

  return (
    <div className="space-y-4">
      <div className={cardCls}>
        <p className="text-sm font-semibold text-[#E0E0E2] uppercase tracking-wider mb-4 flex items-center gap-2">
          <Bell size={16} /> {t.notifications}
        </p>
        <div className="space-y-4 max-w-lg">
          {[
            ['emailOnFailure', t.emailOnFail],
            ['emailOnSmokeFail', t.emailOnSmoke],
            ['webhookEnabled', t.webhookEnabled],
            ['webhookOnFailure', t.webhookOnFail],
            ['webhookOnSmokeFail', t.webhookOnSmoke],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-4">
              <span className="text-sm text-[#E0E0E2]">{label}</span>
              <input
                type="checkbox"
                checked={!!settings[key]}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
                className="w-4 h-4"
              />
            </label>
          ))}
          <div>
            <label className={labelCls}>{t.webhook}</label>
            <input
              className={inputCls}
              value={settings.webhookUrl || ''}
              onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
              placeholder="https://hooks.slack.com/..."
            />
          </div>
          <Button onClick={saveNotifications} disabled={saving}>{t.save}</Button>
        </div>
      </div>

      <div className={cardCls}>
        <p className="text-sm font-semibold text-[#E0E0E2] uppercase tracking-wider mb-4 flex items-center gap-2">
          <Key size={16} /> {t.ciTokens}
        </p>
        <div className="flex flex-wrap gap-2 mb-4 max-w-md">
          <input className={inputCls + ' flex-1'} value={tokenName} onChange={(e) => setTokenName(e.target.value)} />
          <Button onClick={createToken}>{t.createToken}</Button>
        </div>
        {newToken && (
          <Alert
            type="warning"
            message={t.copyHint}
            onClose={() => setNewToken(null)}
          />
        )}
        {newToken && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-[#0F0E11] rounded-lg font-mono text-xs text-[#9BA3F0] break-all">
            {newToken}
            <button type="button" onClick={() => { navigator.clipboard.writeText(newToken); toast.success('Copied') }}>
              <Copy size={14} />
            </button>
          </div>
        )}
        <ul className="space-y-2 mb-4">
          {tokens.map((tok) => (
            <li key={tok.id} className="flex justify-between items-center text-sm text-[#A0A0A4]">
              <span>{tok.name} <span className="font-mono text-xs">({tok.prefix})</span></span>
              <Button size="sm" variant="danger" onClick={() => revokeToken(tok.id)}>{t.revoke}</Button>
            </li>
          ))}
        </ul>
        <p className="text-xs text-[#8A8A8F] mb-2">{t.ciExample}</p>
        <pre className="p-3 bg-[#0F0E11] rounded-lg text-xs text-[#9BA3F0] overflow-x-auto">{ciExample}</pre>
      </div>
    </div>
  )
}
