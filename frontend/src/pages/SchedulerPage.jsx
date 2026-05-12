import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '../store/settingsStore'
import Layout from '../components/Layout'
import api from '../services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Alert } from '../components/ui'
import { Loader } from 'lucide-react'

const FREQUENCIES = [
  { value: 'ONCE', label: 'Run Once', icon: '⏰' },
  { value: 'HOURLY', label: 'Every Hour', icon: '🕐' },
  { value: 'DAILY', label: 'Daily', icon: '📅' },
  { value: 'WEEKLY', label: 'Weekly', icon: '📆' }
]

export default function SchedulerPage() {
  const navigate = useNavigate()
  const { theme, language } = useSettingsStore()
  const isDark = theme === 'dark'

  const [schedules, setSchedules] = useState([])
  const [scenarios, setScenarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [formData, setFormData] = useState({
    scenarioId: '',
    frequency: 'DAILY',
    timeOfDay: '09:00',
    daysOfWeek: []
  })

  const i18n = {
    en: {
      title: 'Test Scheduler',
      description: 'Schedule automated test execution at specific times',
      newSchedule: 'New Schedule',
      noSchedules: 'No schedules yet',
      createOne: 'Create one to get started',
      scenario: 'Scenario',
      frequency: 'Frequency',
      time: 'Time of Day',
      days: 'Days (Weekly only)',
      create: 'Create Schedule',
      cancel: 'Cancel',
      testNow: 'Test Now',
      delete: 'Delete',
      status: 'Status',
      lastRun: 'Last Run',
      nextRun: 'Next Run',
      stats: 'Stats',
      passed: 'Passed',
      failed: 'Failed',
      selectScenario: 'Select a scenario',
      successRate: 'Success Rate',
      loading: 'Loading schedules...',
      creating: 'Creating schedule...'
    },
    id: {
      title: 'Penjadwal Test',
      description: 'Jadwalkan eksekusi test otomatis pada waktu tertentu',
      newSchedule: 'Jadwal Baru',
      noSchedules: 'Belum ada jadwal',
      createOne: 'Buat satu untuk memulai',
      scenario: 'Scenario',
      frequency: 'Frekuensi',
      time: 'Waktu',
      days: 'Hari (Mingguan saja)',
      create: 'Buat Jadwal',
      cancel: 'Batalkan',
      testNow: 'Test Sekarang',
      delete: 'Hapus',
      status: 'Status',
      lastRun: 'Terakhir Dijalankan',
      nextRun: 'Akan Dijalankan',
      stats: 'Statistik',
      passed: 'Berhasil',
      failed: 'Gagal',
      selectScenario: 'Pilih scenario',
      successRate: 'Tingkat Keberhasilan',
      loading: 'Memuat jadwal...',
      creating: 'Membuat jadwal...'
    }
  }

  const t = i18n[language] || i18n.id

  useEffect(() => {
    loadSchedules()
    loadScenarios()
  }, [])

  const loadSchedules = async () => {
    try {
      setLoading(true)
      const res = await api.get('/scheduler')
      setSchedules(res.data.schedules || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load schedules')
    } finally {
      setLoading(false)
    }
  }

  const loadScenarios = async () => {
    try {
      const res = await api.get('/scenarios')
      setScenarios(res.data.scenarios || [])
    } catch (err) {
      console.error('Failed to load scenarios:', err)
    }
  }

  const handleCreateSchedule = async (e) => {
    e.preventDefault()
    if (!formData.scenarioId) {
      setError('Please select a scenario')
      return
    }

    try {
      setCreating(true)
      setError(null)
      const res = await api.post('/scheduler', {
        ...formData,
        isActive: true
      })
      setSchedules([...schedules, res.data.schedule])
      setSuccess('Schedule created successfully')
      setFormData({
        scenarioId: '',
        frequency: 'DAILY',
        timeOfDay: '09:00',
        daysOfWeek: []
      })
      setShowForm(false)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create schedule')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteSchedule = async (scheduleId) => {
    if (!confirm('Delete this schedule?')) return

    try {
      await api.delete(`/scheduler/${scheduleId}`)
      setSchedules(schedules.filter(s => s.id !== scheduleId))
      setSuccess('Schedule deleted')
      setTimeout(() => setSuccess(null), 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete schedule')
    }
  }

  const handleTestNow = async (scheduleId) => {
    try {
      setLoading(true)
      await api.post(`/scheduler/${scheduleId}/test`)
      setSuccess('Test execution triggered')
      setTimeout(() => setSuccess(null), 2000)
      loadSchedules()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to trigger test')
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (date) => {
    if (!date) return '—'
    return new Date(date).toLocaleString(language === 'id' ? 'id-ID' : 'en-US')
  }

  const getFrequencyLabel = (freq) => {
    return FREQUENCIES.find(f => f.value === freq)?.label || freq
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t.title}
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {t.description}
          </p>
        </div>

        {/* Alerts */}
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        {/* Create Button */}
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="mb-6 bg-blue-600 hover:bg-blue-700"
          >
            + {t.newSchedule}
          </Button>
        )}

        {/* Create Form */}
        {showForm && (
          <Card className={`mb-6 border ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
            <CardHeader>
              <CardTitle>{t.newSchedule}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSchedule} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t.scenario}
                  </label>
                  <select
                    value={formData.scenarioId}
                    onChange={(e) => setFormData({ ...formData, scenarioId: e.target.value })}
                    className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                  >
                    <option value="">{t.selectScenario}</option>
                    {scenarios.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t.frequency}
                    </label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                      className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                    >
                      {FREQUENCIES.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t.time}
                    </label>
                    <input
                      type="time"
                      value={formData.timeOfDay}
                      onChange={(e) => setFormData({ ...formData, timeOfDay: e.target.value })}
                      className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {creating ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        {t.creating}
                      </>
                    ) : (
                      t.create
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className={`flex-1 ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                  >
                    {t.cancel}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Schedules List */}
        {loading ? (
          <div className="text-center py-12">
            <Loader className={`w-6 h-6 mx-auto animate-spin ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t.loading}</p>
          </div>
        ) : schedules.length === 0 ? (
          <Card className={`border ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
            <CardContent className="text-center py-12">
              <p className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {t.noSchedules}
              </p>
              <p className={isDark ? 'text-gray-500' : 'text-gray-500'}>
                {t.createOne}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {schedules.map(schedule => (
              <Card key={schedule.id} className={`border ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Scenario
                      </p>
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {schedule.scenario?.name || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t.frequency}
                      </p>
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {getFrequencyLabel(schedule.frequency)} @ {schedule.timeOfDay}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t.stats}
                      </p>
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {schedule.successCount || 0}✓ {schedule.failureCount || 0}✗
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t.nextRun}
                      </p>
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatDateTime(schedule.nextRunAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      onClick={() => handleTestNow(schedule.id)}
                      className={`${isDark ? 'bg-green-900 hover:bg-green-800' : 'bg-green-100 hover:bg-green-200 text-green-900'}`}
                      size="sm"
                    >
                      {t.testNow}
                    </Button>
                    <Button
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className={`${isDark ? 'bg-red-900 hover:bg-red-800' : 'bg-red-100 hover:bg-red-200 text-red-900'}`}
                      size="sm"
                    >
                      {t.delete}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
