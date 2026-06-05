import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { Card, Button, Badge, Spinner } from '../components/ui'
import { issueAPI } from '../services/api'
import { useSettingsStore } from '../store/settingsStore'
import toast from 'react-hot-toast'
import { AlertTriangle } from 'lucide-react'

const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'CLOSED']
const SEVERITY_COLORS = { CRITICAL: 'danger', HIGH: 'danger', MEDIUM: 'warning', LOW: 'default' }

const i18n = {
  en: {
    title: 'Test Issues',
    subtitle: 'Failures auto-tracked from test executions',
    empty: 'No issues — all tests passing!',
    scenario: 'Scenario',
    status: 'Status',
    severity: 'Severity',
    step: 'Step',
    update: 'Update',
    allStatuses: 'All statuses',
    viewScenario: 'View scenario',
  },
  id: {
    title: 'Issue Pengujian',
    subtitle: 'Kegagalan otomatis dari eksekusi test',
    empty: 'Tidak ada issue — semua test lulus!',
    scenario: 'Skenario',
    status: 'Status',
    severity: 'Severity',
    step: 'Langkah',
    update: 'Perbarui',
    allStatuses: 'Semua status',
    viewScenario: 'Lihat skenario',
  },
}

export default function IssuesPage() {
  const navigate = useNavigate()
  const { language } = useSettingsStore()
  const t = i18n[language] || i18n.en
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      const res = await issueAPI.list({ status: filter || undefined, limit: 50 })
      setIssues(res.data.issues || [])
    } catch {
      toast.error('Failed to load issues')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filter])

  const handleStatusChange = async (issueId, status) => {
    try {
      await issueAPI.update(issueId, { status })
      await load()
      toast.success('Issue updated')
    } catch {
      toast.error('Update failed')
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-[#E0E0E2] flex items-center gap-2">
            <AlertTriangle size={22} className="text-amber-400" />
            {t.title}
          </h1>
          <p className="text-sm text-[#666] mt-0.5">{t.subtitle}</p>
        </div>

        <select
          className="px-3 py-2 bg-[#1A1A1C] border border-[#2D2D2F] rounded-lg text-sm text-[#E0E0E2]"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">{t.allStatuses}</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : issues.length === 0 ? (
          <Card><p className="text-[#8A8A8F] text-sm">{t.empty}</p></Card>
        ) : (
          <div className="space-y-3">
            {issues.map((issue) => (
              <Card key={issue.id}>
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="font-medium text-[#E0E0E2]">{issue.title}</p>
                    <p className="text-xs text-[#8A8A8F] mt-1">
                      {t.scenario}: {issue.execution?.scenario?.name || '—'}
                      {issue.stepNumber != null && ` · ${t.step} ${issue.stepNumber}`}
                    </p>
                    {issue.description && (
                      <p className="text-sm text-[#A0A0A4] mt-2 whitespace-pre-wrap">{issue.description}</p>
                    )}
                    {issue.execution?.scenario?.id && (
                      <button
                        type="button"
                        onClick={() => navigate(`/scenarios/${issue.execution.scenario.id}`)}
                        className="text-xs text-[#5E6AD2] hover:underline mt-2"
                      >
                        {t.viewScenario} →
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={SEVERITY_COLORS[issue.severity] || 'secondary'}>{issue.severity}</Badge>
                    <select
                      className="text-xs px-2 py-1 bg-[#0F0E11] border border-[#2D2D2F] rounded text-[#E0E0E2]"
                      value={issue.status}
                      onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
