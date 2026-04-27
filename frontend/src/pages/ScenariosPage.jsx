import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { Card, Button, Alert, Spinner } from '../components/ui'
import { ScenarioForm } from '../components/ScenarioForm'
import { ScenarioSearch } from '../components/ScenarioSearch'
import { ScenariosList } from '../components/ScenariosList'
import { TemplatePickerModal } from '../components/TemplatePickerModal'
import { QuickRecordModal } from '../components/QuickRecordModal'
import { useScenarioStore } from '../store/scenarioStore'
import { executionAPI } from '../services/api'
import { useSettingsStore } from '../store/settingsStore'

const i18n = {
  en: {
    selectedCount: (n) => `${n} scenario${n !== 1 ? 's' : ''} selected`,
    runningBulk: 'Running executions sequentially (headless)...',
    close: 'Close',
    cancel: 'Cancel',
    quickRecordTitle: 'Create scenario & start recording immediately',
    templatesTitle: 'Create scenario from ready-made template',
  },
  id: {
    selectedCount: (n) => `${n} scenario dipilih`,
    runningBulk: 'Menjalankan eksekusi secara berurutan (headless)...',
    close: 'Tutup',
    cancel: 'Batal',
    quickRecordTitle: 'Buat scenario & langsung mulai recording',
    templatesTitle: 'Buat scenario dari template siap pakai',
  },
}

export default function ScenariosPage() {
  const navigate = useNavigate()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingScenario, setEditingScenario] = useState(null)
  const [searchTimeout, setSearchTimeout] = useState(null)

  // New feature state
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [showQuickRecord, setShowQuickRecord] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkExecuteStatus, setBulkExecuteStatus] = useState(null) // null | 'running' | 'done'
  const [bulkResults, setBulkResults] = useState([]) // [{id, name, status, executionId}]

  const {
    scenarios,
    isLoading,
    error,
    pagination,
    fetchScenarios,
    createScenario,
    updateScenario,
    deleteScenario,
    duplicateScenario,
    setSelectedScenario,
    clearError
  } = useScenarioStore()

  const { language } = useSettingsStore()
  const t = i18n[language] || i18n.en

  // Load scenarios on mount
  useEffect(() => {
    fetchScenarios()
  }, [])

  const handleSearch = (query) => {
    if (searchTimeout) clearTimeout(searchTimeout)
    const timeout = setTimeout(() => {
      if (query.trim()) {
        fetchScenarios(0, 10, query)
      } else {
        fetchScenarios(0, 10)
      }
    }, 300)
    setSearchTimeout(timeout)
  }

  const handleFilterChange = async (filter) => {
    if (filter === 'recent') {
      fetchScenarios(0, 10)
    } else if (filter === 'active') {
      try {
        const response = await fetch('/api/scenarios/stats', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        })
        await response.json()
      } catch (err) {
        console.error('Failed to fetch scenario stats')
      }
    }
  }

  const handleCreateScenario = async (formData) => {
    try {
      await createScenario(formData.name, formData.description, formData.url)
      setShowCreateForm(false)
    } catch (error) {}
  }

  const handleUpdateScenario = async (formData) => {
    try {
      await updateScenario(editingScenario.id, formData.name, formData.description, formData.url)
      setEditingScenario(null)
    } catch (error) {}
  }

  const handleViewScenario = (scenario) => {
    setSelectedScenario(scenario)
    navigate(`/scenarios/${scenario.id}`)
  }

  const handleEditScenario = (scenario) => {
    setEditingScenario(scenario)
    setShowCreateForm(false)
  }

  const handleDeleteScenario = async (scenarioId) => {
    try {
      await deleteScenario(scenarioId)
      setSelectedIds(prev => { const n = new Set(prev); n.delete(scenarioId); return n })
    } catch (error) {}
  }

  const handleDuplicateScenario = async (scenarioId) => {
    try {
      await duplicateScenario(scenarioId)
    } catch (error) {}
  }

  const handleLoadMore = () => {
    const newSkip = pagination.skip + pagination.take
    fetchScenarios(newSkip, pagination.take)
  }

  // ── Template Library ────────────────────────────────────────────────────────
  const handleTemplateCreated = (scenario) => {
    setShowTemplatePicker(false)
    fetchScenarios() // refresh list
    navigate(`/scenarios/${scenario.id}`)
  }

  // ── Quick Record ────────────────────────────────────────────────────────────
  const handleQuickRecordCreated = (scenario) => {
    setShowQuickRecord(false)
    fetchScenarios()
    // Navigate to detail page — recording panel will be visible there
    navigate(`/scenarios/${scenario.id}?autoRecord=1`)
  }

  // ── Bulk Select ─────────────────────────────────────────────────────────────
  const handleToggleSelect = (id) => {
    setSelectedIds(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  const handleSelectAll = (ids) => {
    setSelectedIds(new Set(ids))
  }

  // ── Bulk Execute ─────────────────────────────────────────────────────────────
  const handleBulkExecute = async () => {
    const ids = [...selectedIds]
    const scenarioMap = Object.fromEntries(scenarios.map(s => [s.id, s.name]))
    setBulkResults(ids.map(id => ({ id, name: scenarioMap[id] || id, status: 'pending', executionId: null })))
    setBulkExecuteStatus('running')

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]
      setBulkResults(prev => prev.map(r => r.id === id ? { ...r, status: 'running' } : r))
      try {
        const res = await executionAPI.executeScenario(id, { browser: 'chromium', headless: true })
        const execution = res.data.execution
        setBulkResults(prev => prev.map(r =>
          r.id === id ? { ...r, status: execution.status === 'FAILED' ? 'failed' : 'passed', executionId: execution.id } : r
        ))
      } catch {
        setBulkResults(prev => prev.map(r => r.id === id ? { ...r, status: 'error' } : r))
      }
    }
    setBulkExecuteStatus('done')
  }

  const clearBulkState = () => {
    setSelectedIds(new Set())
    setBulkExecuteStatus(null)
    setBulkResults([])
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#E0E0E2]">Test Scenarios</h1>
            <p className="text-[#A0A0A4] mt-1">Create and manage your test scenarios</p>
          </div>
          {!showCreateForm && !editingScenario && (
            <div className="flex flex-wrap gap-2 self-start">
              {/* Quick Record */}
              <Button
                onClick={() => setShowQuickRecord(true)}
                variant="success"
                size="md"
                title="Buat scenario & langsung mulai recording"
              >
                ⚡ Quick Record
              </Button>
              {/* Template Library */}
              <Button
                onClick={() => setShowTemplatePicker(true)}
                variant="secondary"
                size="md"
                title="Buat scenario dari template siap pakai"
              >
                📋 Templates
              </Button>
              {/* Create Manual */}
              <Button
                onClick={() => setShowCreateForm(true)}
                variant="primary"
                size="md"
                data-testid="create-scenario-btn"
              >
                + Create Scenario
              </Button>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert type="error" message={error} onClose={clearError} />
        )}

        {/* Create/Edit Form */}
        {(showCreateForm || editingScenario) && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#E0E0E2]">
                {editingScenario ? 'Edit Scenario' : 'Create New Scenario'}
              </h2>
              <button
                onClick={() => { setShowCreateForm(false); setEditingScenario(null) }}
                className="text-[#666] hover:text-[#E0E0E2] text-2xl"
              >✕</button>
            </div>
            <ScenarioForm
              onSubmit={editingScenario ? handleUpdateScenario : handleCreateScenario}
              initialScenario={editingScenario}
              isLoading={isLoading}
            />
          </Card>
        )}

        {/* Bulk Execute Panel */}
        {!showCreateForm && !editingScenario && selectedIds.size > 0 && (
          <div className="bg-[#5E6AD2]/10 border border-[#5E6AD2]/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#E0E0E2]">
                {t.selectedCount(selectedIds.size)}
              </p>
              {bulkExecuteStatus === 'running' && (
                <p className="text-xs text-[#8A8A8F] mt-1">{t.runningBulk}</p>
              )}
            </div>

            {/* Bulk Results */}
            {bulkResults.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {bulkResults.map(r => (
                  <div key={r.id} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[#0F0E11] border border-[rgba(255,255,255,0.07)]">
                    {r.status === 'pending' && <span className="text-[#555]">⏳</span>}
                    {r.status === 'running' && <Spinner size="sm" />}
                    {r.status === 'passed' && <span className="text-green-400">✓</span>}
                    {r.status === 'failed' && <span className="text-red-400">✗</span>}
                    {r.status === 'error' && <span className="text-yellow-400">!</span>}
                    <span className={
                      r.status === 'passed' ? 'text-green-400' :
                      r.status === 'failed' ? 'text-red-400' :
                      r.status === 'running' ? 'text-[#5E6AD2]' :
                      'text-[#8A8A8F]'
                    }>{r.name.length > 20 ? r.name.slice(0, 20) + '…' : r.name}</span>
                    {r.executionId && (
                      <button
                        onClick={() => navigate(`/scenarios/${r.id}`)}
                        className="text-[#5E6AD2] hover:underline ml-1"
                      >↗</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 shrink-0">
              {bulkExecuteStatus !== 'running' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleBulkExecute}
                  disabled={bulkExecuteStatus === 'running'}
                >
                  ▶ Run Selected ({selectedIds.size})
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={clearBulkState}>
                {bulkExecuteStatus === 'done' ? t.close : t.cancel}
              </Button>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        {!showCreateForm && !editingScenario && (
          <Card>
            <ScenarioSearch
              onSearch={handleSearch}
              onFilterChange={handleFilterChange}
              isLoading={isLoading}
            />
          </Card>
        )}

        {/* Scenarios List */}
        {!showCreateForm && !editingScenario && (
          <ScenariosList
            scenarios={scenarios}
            onEdit={handleEditScenario}
            onDelete={handleDeleteScenario}
            onDuplicate={handleDuplicateScenario}
            onView={handleViewScenario}
            isLoading={isLoading}
            hasMore={pagination.hasMore}
            onLoadMore={handleLoadMore}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            bulkSelectEnabled={true}
          />
        )}

        {/* Stats */}
        {!showCreateForm && !editingScenario && scenarios.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="linear-card p-5">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#5E6AD2]/10 flex items-center justify-center shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9BA3F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#E0E0E2] leading-none">{scenarios.length}</p>
                  <p className="text-xs text-[#8A8A8F] mt-1.5 font-medium uppercase tracking-wider">Total Scenarios</p>
                </div>
              </div>
            </div>
            <div className="linear-card p-5">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#34D399]/10 flex items-center justify-center shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#E0E0E2] leading-none">
                    {scenarios.reduce((sum, s) => sum + (s.stepCount || 0), 0)}
                  </p>
                  <p className="text-xs text-[#8A8A8F] mt-1.5 font-medium uppercase tracking-wider">Total Test Steps</p>
                </div>
              </div>
            </div>
            <div className="linear-card p-5">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#FBBF24]/10 flex items-center justify-center shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#E0E0E2] leading-none">
                    {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-[#8A8A8F] mt-1.5 font-medium uppercase tracking-wider">Last Updated</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showTemplatePicker && (
        <TemplatePickerModal
          onClose={() => setShowTemplatePicker(false)}
          onCreated={handleTemplateCreated}
        />
      )}
      {showQuickRecord && (
        <QuickRecordModal
          onClose={() => setShowQuickRecord(false)}
          onCreated={handleQuickRecordCreated}
        />
      )}
    </Layout>
  )
}
