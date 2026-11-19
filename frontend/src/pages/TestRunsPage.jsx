import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { Card, Badge, Spinner, Alert, Button } from '../components/ui'
import ExportFormatButton from '../components/ExportFormatButton'
import { testRunAPI, scenarioAPI } from '../services/api'
import toast from 'react-hot-toast'
import { ListChecks, Plus, Loader2, RefreshCw, Folder } from 'lucide-react'

function groupScenariosByFeature(scenarios = []) {
  const map = new Map()
  for (const s of scenarios) {
    const key = s.folderId || s.folder?.id || '__unfiled__'
    const label = s.folder?.name || 'No folder'
    if (!map.has(key)) map.set(key, { key, label, cases: [] })
    map.get(key).cases.push(s)
  }
  const groups = [...map.values()]
  groups.sort((a, b) => {
    if (a.key === '__unfiled__') return 1
    if (b.key === '__unfiled__') return -1
    return a.label.localeCompare(b.label, 'id')
  })
  for (const g of groups) {
    g.cases.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'id'))
  }
  return groups
}

export default function TestRunsPage() {
  const navigate = useNavigate()
  const [runs, setRuns] = useState([])
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState('') // '' | OPEN | CLOSED
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [scenarios, setScenarios] = useState([])
  const [selected, setSelected] = useState(() => new Set())
  const [creating, setCreating] = useState(false)
  const [featureFilter, setFeatureFilter] = useState('all') // all | __unfiled__ | folderId
  const [loadingCases, setLoadingCases] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await testRunAPI.list({
        ...(filter ? { status: filter } : {}),
        limit: 40,
        offset: 0,
      })
      setRuns(res.data.runs || [])
      setTotal(res.data.total || 0)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat test runs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [filter])

  const featureGroups = useMemo(() => groupScenariosByFeature(scenarios), [scenarios])

  const visibleGroups = useMemo(() => {
    if (featureFilter === 'all') return featureGroups
    return featureGroups.filter((g) => g.key === featureFilter)
  }, [featureGroups, featureFilter])

  const openCreate = async () => {
    setShowCreate(true)
    setTitle(`Run ${new Date().toLocaleDateString('id-ID')}`)
    setSelected(new Set())
    setFeatureFilter('all')
    setLoadingCases(true)
    try {
      const res = await scenarioAPI.getAll(0, 200)
      setScenarios(res.data.scenarios || [])
    } catch {
      setScenarios([])
    } finally {
      setLoadingCases(false)
    }
  }

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleFeature = (group) => {
    const ids = group.cases.map((c) => c.id)
    setSelected((prev) => {
      const next = new Set(prev)
      const allOn = ids.every((id) => next.has(id))
      if (allOn) ids.forEach((id) => next.delete(id))
      else ids.forEach((id) => next.add(id))
      return next
    })
  }

  const handleCreate = async () => {
    if (!title.trim() || selected.size === 0) {
      setError('Isi judul dan pilih minimal 1 test case')
      return
    }
    setCreating(true)
    setError(null)
    try {
      const res = await testRunAPI.create({
        title: title.trim(),
        scenarioIds: [...selected],
      })
      setShowCreate(false)
      toast.success('Test Run berhasil dibuat')
      navigate(`/test-runs/${res.data.run.id}`)
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal membuat test run'
      setError(msg)
      toast.error(msg)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-ink">Test Runs</h1>
            <p className="text-ink-muted mt-1 text-sm">
              Jalankan beberapa case per fitur — pilih feature folder, set Pass/Fail, lalu seal.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExportFormatButton
              format="json"
              icon={loading ? Loader2 : RefreshCw}
              onClick={load}
              disabled={loading}
              className={loading ? '[&_svg]:animate-spin' : ''}
            >
              Refresh
            </ExportFormatButton>
            <ExportFormatButton format="primary" icon={Plus} onClick={openCreate}>
              Create Run
            </ExportFormatButton>
          </div>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        <div className="flex gap-2">
          {[
            { id: '', label: 'All' },
            { id: 'OPEN', label: 'Open' },
            { id: 'CLOSED', label: 'Closed' },
          ].map((f) => (
            <button
              key={f.id || 'all'}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                filter === f.id ? 'bg-brand-soft text-brand' : 'text-ink-muted hover:bg-surface-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {showCreate && (
          <Card>
            <h2 className="text-lg font-bold text-ink mb-1">Create Test Run</h2>
            <p className="text-xs text-ink-muted mb-3">
              1 folder = 1 fitur. Pilih seluruh case di satu fitur, atau campur beberapa fitur.
            </p>
            <label className="block text-xs font-medium text-ink-muted mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mb-3 text-sm rounded-lg border border-surface-border px-3 py-2"
              placeholder="Mis. Sprint 12 · Login + Checkout"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <p className="text-xs text-ink-muted">Pilih test case ({selected.size} selected)</p>
              <select
                value={featureFilter}
                onChange={(e) => setFeatureFilter(e.target.value)}
                className="text-xs rounded-lg border border-surface-border px-2 py-1.5 bg-white text-ink"
              >
                <option value="all">Semua fitur</option>
                {featureGroups.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.label} ({g.cases.length})
                  </option>
                ))}
              </select>
            </div>

            <div className="max-h-72 overflow-y-auto border border-surface-border rounded-lg mb-4">
              {loadingCases ? (
                <div className="flex justify-center py-10">
                  <Spinner />
                </div>
              ) : visibleGroups.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-ink-muted">
                  Belum ada test case. Buat feature folder di Scenarios dulu.
                </p>
              ) : (
                visibleGroups.map((group) => {
                  const ids = group.cases.map((c) => c.id)
                  const selectedCount = ids.filter((id) => selected.has(id)).length
                  const allOn = ids.length > 0 && selectedCount === ids.length
                  return (
                    <div key={group.key} className="border-b border-surface-border last:border-b-0">
                      <div className="sticky top-0 z-[1] flex items-center gap-2 px-3 py-2 bg-surface-muted/90 backdrop-blur-sm">
                        <Folder size={14} className="text-brand shrink-0" />
                        <span className="text-xs font-semibold text-ink truncate flex-1">
                          {group.label}
                        </span>
                        <span className="text-[10px] text-ink-subtle tabular-nums">
                          {selectedCount}/{group.cases.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleFeature(group)}
                          className="text-[11px] font-semibold text-brand hover:text-brand-hover"
                        >
                          {allOn ? 'Unselect' : 'Select fitur'}
                        </button>
                      </div>
                      <div className="divide-y divide-surface-border">
                        {group.cases.map((s) => (
                          <label
                            key={s.id}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-muted/50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selected.has(s.id)}
                              onChange={() => toggle(s.id)}
                              className="accent-brand"
                            />
                            <span className="truncate text-ink flex-1">{s.name}</span>
                            <span className="text-xs text-ink-subtle shrink-0">
                              {s.stepCount ?? s.steps ?? 0} steps
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            <div className="flex gap-2">
              <ExportFormatButton
                format="primary"
                icon={creating ? Loader2 : ListChecks}
                onClick={handleCreate}
                disabled={creating}
                className={creating ? '[&_svg]:animate-spin' : ''}
              >
                {creating ? 'Creating…' : 'Create'}
              </ExportFormatButton>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        )}

        <Card>
          <p className="text-xs text-ink-muted mb-3">{total} test run</p>
          {loading && runs.length === 0 ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : runs.length === 0 ? (
            <p className="text-center text-ink-muted py-10 text-sm">
              Belum ada test run — Create Run dan pilih case per feature folder.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border text-left text-xs uppercase tracking-wider text-ink-subtle">
                    <th className="py-2 pr-3">Title</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3 hidden sm:table-cell">Progress</th>
                    <th className="py-2 pr-3 hidden md:table-cell">Created</th>
                    <th className="py-2 text-right">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} className="border-b border-surface-border/70 hover:bg-surface-muted/40">
                      <td className="py-3 pr-3 font-medium text-ink">{run.title}</td>
                      <td className="py-3 pr-3">
                        <Badge variant={run.status === 'OPEN' ? 'primary' : 'default'}>
                          {run.status}
                        </Badge>
                      </td>
                      <td className="py-3 pr-3 hidden sm:table-cell min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-surface-muted overflow-hidden">
                            <div
                              className="h-full bg-brand rounded-full"
                              style={{ width: `${run.progress?.percentComplete || 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-ink-muted w-16 text-right">
                            {run.progress?.done || 0}/{run.progress?.total || 0}
                          </span>
                        </div>
                        <p className="text-[10px] text-ink-subtle mt-0.5">
                          {run.progress?.passed || 0}P · {run.progress?.failed || 0}F ·{' '}
                          {run.progress?.blocked || 0}B · {run.progress?.skipped || 0}S
                        </p>
                      </td>
                      <td className="py-3 pr-3 hidden md:table-cell text-ink-muted text-xs">
                        {new Date(run.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        <ExportFormatButton
                          format="csv"
                          onClick={() => navigate(`/test-runs/${run.id}`)}
                          className="!px-2"
                        >
                          Open
                        </ExportFormatButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  )
}
