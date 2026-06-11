import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { Card, Button, Badge, Spinner, Alert } from '../components/ui'
import { scenarioAPI, visualRegressionAPI } from '../services/api'
import { useSettingsStore } from '../store/settingsStore'
import toast from 'react-hot-toast'
import { Image, Play, Camera, CheckCircle2 } from 'lucide-react'

const STATUS_VARIANT = {
  PASSED: 'success',
  FAILED: 'danger',
  MISSING_BASELINE: 'warning',
  APPROVED: 'primary',
  ERROR: 'danger'
}

const i18n = {
  title: 'Visual Regression',
  subtitle: 'Detect unintended UI changes by comparing step screenshots to saved baselines',
  howItWorks:
    '1) Capture Baselines — run the scenario and save reference screenshots per step. 2) Run Visual Test — run again and pixel-compare each step. Steps that differ beyond the threshold are flagged.',
  selectScenario: 'Select scenario',
  threshold: 'Diff threshold (%)',
  capture: 'Capture Baselines',
  run: 'Run Visual Test',
  baselines: 'Baselines',
  comparisons: 'Recent Comparisons',
  noBaselines: 'No baselines yet — click "Capture Baselines" first',
  noComparisons: 'No comparisons yet — run a visual test after capturing baselines',
  noScenarios: 'Create a scenario with browser steps (Navigate, Click, etc.) first',
  noBaselinesWarning: 'No baselines for this scenario. Capture baselines before running a visual test.',
  noScreenshots: 'No screenshots were compared. Ensure the scenario has browser steps (not API-only) and steps complete successfully.',
  step: 'Step',
  diff: 'Diff',
  approve: 'Approve as baseline',
  baseline: 'Baseline',
  current: 'Current',
  diffImage: 'Diff',
  running: 'Running scenario & comparing screenshots…',
  capturing: 'Running scenario & saving baselines…',
  selectScenarioFirst: 'Select a scenario first',
}
export default function VisualRegressionPage() {
  const { selectedEnvironmentId } = useSettingsStore()
  const t = i18n
  const [scenarios, setScenarios] = useState([])
  const [scenarioId, setScenarioId] = useState('')
  const [threshold, setThreshold] = useState(0.1)
  const [baselines, setBaselines] = useState([])
  const [comparisons, setComparisons] = useState([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [runError, setRunError] = useState('')

  const load = async (sid = scenarioId) => {
    try {
      const [bRes, cRes] = await Promise.all([
        visualRegressionAPI.listBaselines(sid || undefined),
        visualRegressionAPI.listComparisons({ scenarioId: sid || undefined, limit: 20 })
      ])
      setBaselines(bRes.data.baselines || [])
      setComparisons(cRes.data.comparisons || [])
    } catch {
      toast.error('Failed to load visual regression data')
    }
  }

  useEffect(() => {
    scenarioAPI.getAll(0, 100).then((res) => {
      const list = res.data.scenarios || []
      setScenarios(list)
      if (list.length && !scenarioId) setScenarioId(list[0].id)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (scenarioId) load(scenarioId)
  }, [scenarioId])

  const handleCapture = async () => {
    if (!scenarioId) {
      setRunError(t.selectScenarioFirst)
      return
    }
    setCapturing(true)
    setRunError('')
    try {
      const res = await visualRegressionAPI.capture(scenarioId, {
        headless: true,
        environmentId: selectedEnvironmentId || undefined
      })
      toast.success(`Captured ${res.data.baselines?.length || 0} baselines`)
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Capture failed')
    } finally {
      setCapturing(false)
    }
  }

  const handleRun = async () => {
    if (!scenarioId) {
      setRunError(t.selectScenarioFirst)
      return
    }
    if (baselines.length === 0) {
      toast.error(t.noBaselinesWarning)
    }
    setRunning(true)
    setLastResult(null)
    setRunError('')
    try {
      const res = await visualRegressionAPI.run(scenarioId, {
        headless: true,
        threshold,
        environmentId: selectedEnvironmentId || undefined
      })
      const data = res.data
      setLastResult(data)
      if (data.summary?.total === 0) {
        toast.error(t.noScreenshots)
      } else if (data.summary?.failed > 0) {
        toast.error(`${data.summary.failed} step(s) failed visual check`)
      } else {
        toast.success('All visual checks passed')
      }
      await load()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Visual test failed'
      setRunError(msg)
      if (err.response?.data?.summary) {
        setLastResult(err.response.data)
        await load()
      }
      toast.error(msg)
    } finally {
      setRunning(false)
    }
  }

  const handleApprove = async (comparisonId) => {
    try {
      await visualRegressionAPI.approve(comparisonId)
      toast.success('Baseline updated')
      await load()
    } catch {
      toast.error('Approve failed')
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
            <Image size={22} className="text-[#5E6AD2]" />
            {t.title}
          </h1>
          <p className="text-sm text-[#666] mt-0.5">{t.subtitle}</p>
        </div>

        <Alert type="info" message={t.howItWorks} />

        {scenarios.length === 0 && (
          <Alert type="warning" message={t.noScenarios} />
        )}

        {(running || capturing) && (
          <Alert
            type="info"
            message={running ? t.running : t.capturing}
          />
        )}

        {runError && <Alert type="error" message={runError} />}

        <Card className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-xs text-[#8A8A8F] block mb-1">{t.selectScenario}</label>
            <select
              className="px-3 py-2 bg-[#0F0E11] border border-[#2D2D2F] rounded-lg text-sm text-[#E0E0E2] min-w-[200px]"
              value={scenarioId}
              onChange={(e) => setScenarioId(e.target.value)}
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-[#8A8A8F] block mb-1">{t.threshold}</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              className="px-3 py-2 bg-[#0F0E11] border border-[#2D2D2F] rounded-lg text-sm text-[#E0E0E2] w-24"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value) || 0)}
            />
          </div>
          <Button onClick={handleCapture} disabled={capturing || !scenarioId}>
            {capturing ? <Spinner size="sm" /> : <Camera size={16} />}
            {capturing ? t.capturing : t.capture}
          </Button>
          <Button variant="primary" onClick={handleRun} disabled={running || !scenarioId}>
            {running ? <Spinner size="sm" /> : <Play size={16} />}
            {running ? t.running : t.run}
          </Button>
        </Card>

        {lastResult?.summary && (
          <Alert
            type={
              lastResult.summary.total === 0
                ? 'warning'
                : lastResult.summary.failed > 0
                  ? 'warning'
                  : 'success'
            }
            message={
              lastResult.summary.total === 0
                ? t.noScreenshots
                : `${lastResult.summary.passed}/${lastResult.summary.total} passed · threshold ${lastResult.summary.threshold}%`
            }
          />
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-sm font-semibold text-[#E0E0E2] mb-4">{t.baselines}</h2>
            {baselines.length === 0 ? (
              <p className="text-sm text-[#8A8A8F]">{t.noBaselines}</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {baselines.map((b) => (
                  <div key={b.id} className="border border-[#2D2D2F] rounded-lg p-2">
                    <p className="text-xs text-[#8A8A8F] mb-1">{t.step} {b.stepNumber} · {b.browser}</p>
                    {b.imageUrl && (
                      <img src={b.imageUrl} alt={`step ${b.stepNumber}`} className="w-full rounded border border-[#2D2D2F]" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-[#E0E0E2] mb-4">{t.comparisons}</h2>
            {comparisons.length === 0 ? (
              <p className="text-sm text-[#8A8A8F]">{t.noComparisons}</p>
            ) : (
              <div className="space-y-4 max-h-[32rem] overflow-y-auto">
                {comparisons.map((c) => (
                  <div key={c.id} className="border border-[#2D2D2F] rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-[#E0E0E2]">{t.step} {c.stepNumber}</span>
                      <Badge variant={STATUS_VARIANT[c.status] || 'default'}>
                        {c.status} {c.diffPercent != null ? `· ${c.diffPercent}%` : ''}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        [t.baseline, c.baselineUrl],
                        [t.current, c.currentUrl],
                        [t.diffImage, c.diffUrl]
                      ].map(([label, url]) => (
                        <div key={label}>
                          <p className="text-[10px] text-[#8A8A8F] mb-1">{label}</p>
                          {url ? (
                            <img src={url} alt={label} className="w-full rounded border border-[#2D2D2F]" />
                          ) : (
                            <div className="h-16 bg-[#0F0E11] rounded border border-[#2D2D2F] flex items-center justify-center text-[10px] text-[#555]">—</div>
                          )}
                        </div>
                      ))}
                    </div>
                    {c.status === 'FAILED' && (
                      <Button size="sm" className="mt-2" onClick={() => handleApprove(c.id)}>
                        <CheckCircle2 size={14} /> {t.approve}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  )
}
