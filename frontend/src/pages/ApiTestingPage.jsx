import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { Card, Button, Badge, Spinner, Alert } from '../components/ui'
import { scenarioAPI, apiTestAPI, environmentAPI } from '../services/api'
import { useSettingsStore } from '../store/settingsStore'
import toast from 'react-hot-toast'
import { Play, Plus, Trash2, Globe } from 'lucide-react'

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD']

const i18n = {
    title: 'API Testing',
    subtitle: 'HTTP request tests linked to scenarios',
    selectScenario: 'Select scenario',
    addTest: 'Add API Test',
    run: 'Run',
    noTests: 'No API tests yet',
    name: 'Name',
    method: 'Method',
    url: 'URL',
    expectedCode: 'Expected status',
    save: 'Save',
    cancel: 'Cancel',
    lastResult: 'Last result',
    passed: 'Passed',
    failed: 'Failed',
    ms: 'ms',
    headers: 'Headers (JSON)',
    body: 'Body',
    history: 'History',
  
}

const emptyForm = { name: '', method: 'GET', url: '', expectedCode: 200, headers: '', body: '' }

export default function ApiTestingPage() {
  const { selectedEnvironmentId } = useSettingsStore()
  const t = i18n
  const [scenarios, setScenarios] = useState([])
  const [scenarioId, setScenarioId] = useState('')
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [runningId, setRunningId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [environments, setEnvironments] = useState([])
  const [environmentId, setEnvironmentId] = useState(selectedEnvironmentId || '')

  useEffect(() => {
    environmentAPI.list().then((res) => {
      const list = res.data.environments || []
      setEnvironments(list)
      if (!environmentId && list.length) {
        const def = list.find((e) => e.isDefault) || list[0]
        setEnvironmentId(def.id)
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    scenarioAPI.getAll(0, 100).then((res) => {
      const list = res.data.scenarios || []
      setScenarios(list)
      if (list.length && !scenarioId) setScenarioId(list[0].id)
    }).catch(() => toast.error('Failed to load scenarios'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!scenarioId) return
    loadTests()
  }, [scenarioId])

  const loadTests = async () => {
    try {
      const res = await apiTestAPI.list(scenarioId)
      setTests(res.data.apiTests || [])
    } catch {
      toast.error('Failed to load API tests')
    }
  }

  const parseOptionalJson = (raw) => {
    if (!raw?.trim()) return undefined
    return JSON.parse(raw)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        name: form.name,
        method: form.method,
        url: form.url,
        expectedCode: form.expectedCode,
      }
      if (form.headers?.trim()) payload.headers = parseOptionalJson(form.headers)
      if (form.body?.trim()) payload.body = form.body
      await apiTestAPI.create(scenarioId, payload)
      setForm(emptyForm)
      setShowForm(false)
      await loadTests()
      toast.success('API test created')
    } catch (err) {
      const msg = err instanceof SyntaxError ? 'Invalid JSON in headers' : (err.response?.data?.message || 'Create failed')
      toast.error(msg)
    }
  }

  const handleRun = async (id) => {
    setRunningId(id)
    try {
      const res = await apiTestAPI.run(id, { environmentId: environmentId || undefined })
      toast.success(res.data.result?.passed ? t.passed : t.failed)
      await loadTests()
    } catch {
      toast.error('Run failed')
    } finally {
      setRunningId(null)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this API test?')) return
    try {
      await apiTestAPI.delete(id)
      await loadTests()
      toast.success('Deleted')
    } catch {
      toast.error('Delete failed')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-20"><Spinner /></div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-[#E0E0E2] flex items-center gap-2">
            <Globe size={22} className="text-[#5E6AD2]" />
            {t.title}
          </h1>
          <p className="text-sm text-[#666] mt-0.5">{t.subtitle}</p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <select
            className="px-3 py-2 bg-[#1A1A1C] border border-[#2D2D2F] rounded-lg text-sm text-[#E0E0E2]"
            value={environmentId}
            onChange={(e) => setEnvironmentId(e.target.value)}
            title="Environment"
          >
            {environments.map((env) => (
              <option key={env.id} value={env.id}>{env.name}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 bg-[#1A1A1C] border border-[#2D2D2F] rounded-lg text-sm text-[#E0E0E2]"
            value={scenarioId}
            onChange={(e) => setScenarioId(e.target.value)}
          >
            <option value="">{t.selectScenario}</option>
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <Button onClick={() => setShowForm(true)} disabled={!scenarioId}>
            <Plus size={16} /> {t.addTest}
          </Button>
        </div>

        {showForm && (
          <Card>
            <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
              <input className="input-dark" placeholder={t.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <select className="input-dark" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <input className="input-dark md:col-span-2" placeholder={t.url} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required />
              <input type="number" className="input-dark" placeholder={t.expectedCode} value={form.expectedCode} onChange={(e) => setForm({ ...form, expectedCode: parseInt(e.target.value) })} />
              <textarea className="input-dark md:col-span-2 font-mono text-xs" rows={2} placeholder={t.headers} value={form.headers} onChange={(e) => setForm({ ...form, headers: e.target.value })} />
              <textarea className="input-dark md:col-span-2 font-mono text-xs" rows={3} placeholder={t.body} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
              <div className="flex gap-2 md:col-span-2">
                <Button type="submit">{t.save}</Button>
                <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>{t.cancel}</Button>
              </div>
            </form>
          </Card>
        )}

        {tests.length === 0 ? (
          <Alert type="info" message={t.noTests} />
        ) : (
          <div className="space-y-3">
            {tests.map((test) => {
              const last = test.results?.[0]
              return (
                <Card key={test.id} className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-[#E0E0E2]">{test.name}</p>
                    <p className="text-xs text-[#8A8A8F] mt-1">
                      <Badge variant="primary">{test.method}</Badge>{' '}
                      <span className="font-mono">{test.url}</span>
                    </p>
                    {last && (
                      <p className="text-xs mt-2 text-[#666]">
                        {t.lastResult}:{' '}
                        <Badge variant={last.passed ? 'success' : 'danger'}>
                          {last.passed ? t.passed : t.failed} — {last.status} ({last.responseTime}{t.ms})
                        </Badge>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleRun(test.id)} disabled={runningId === test.id}>
                      {runningId === test.id ? <Spinner size="sm" /> : <Play size={14} />}
                      {t.run}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(test.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
      <style>{`.input-dark { width:100%; padding:0.5rem 0.75rem; background:#0F0E11; border:1px solid #2D2D2F; border-radius:0.5rem; color:#E0E0E2; font-size:0.875rem; }`}</style>
    </Layout>
  )
}
