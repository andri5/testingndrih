import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { Card, Badge, Spinner, Alert, Button } from '../components/ui'
import ExportFormatButton from '../components/ExportFormatButton'
import { testRunAPI, scenarioAPI } from '../services/api'
import { ListChecks, Plus, Loader2, RefreshCw } from 'lucide-react'

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

  const openCreate = async () => {
    setShowCreate(true)
    setTitle(`Run ${new Date().toLocaleDateString('id-ID')}`)
    setSelected(new Set())
    try {
      const res = await scenarioAPI.getAll(0, 100)
      setScenarios(res.data.scenarios || [])
    } catch {
      setScenarios([])
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
      navigate(`/test-runs/${res.data.run.id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat test run')
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
              Multi-case run mirip Testiny — assign PIC, set Pass/Fail, lalu seal.
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
            <h2 className="text-lg font-bold text-ink mb-3">Create Test Run</h2>
            <label className="block text-xs font-medium text-ink-muted mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mb-3 text-sm rounded-lg border border-surface-border px-3 py-2"
              placeholder="Nama run / sprint / cycle"
            />
            <p className="text-xs text-ink-muted mb-2">Pilih test case ({selected.size} selected)</p>
            <div className="max-h-56 overflow-y-auto border border-surface-border rounded-lg divide-y divide-surface-border mb-4">
              {scenarios.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-muted cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(s.id)}
                    onChange={() => toggle(s.id)}
                    className="accent-brand"
                  />
                  <span className="truncate text-ink">{s.name}</span>
                  <span className="text-xs text-ink-subtle ml-auto shrink-0">
                    {s.stepCount ?? s.steps ?? 0} steps
                  </span>
                </label>
              ))}
              {scenarios.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-ink-muted">Belum ada scenario</p>
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
            <p className="text-center text-ink-muted py-10 text-sm">Belum ada test run</p>
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
