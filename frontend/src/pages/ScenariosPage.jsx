import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { Card, Button, Alert } from '../components/ui'
import { ScenarioForm } from '../components/ScenarioForm'
import { ScenarioSearch } from '../components/ScenarioSearch'
import { ScenariosList } from '../components/ScenariosList'
import { useScenarioStore } from '../store/scenarioStore'

export default function ScenariosPage() {
  const navigate = useNavigate()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingScenario, setEditingScenario] = useState(null)
  const [searchTimeout, setSearchTimeout] = useState(null)

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

  // Load scenarios on mount
  useEffect(() => {
    fetchScenarios()
  }, [])

  const handleSearch = (query) => {
    // Debounce search
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

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
      // Fetch by creation date - already sorted
      fetchScenarios(0, 10)
    } else if (filter === 'active') {
      // Get most executed
      try {
        const response = await fetch('/api/scenarios/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        })
        const data = await response.json()
        // Scenarios are returned sorted by execution count
      } catch (err) {
        console.error('Failed to fetch scenario stats')
      }
    }
  }

  const handleCreateScenario = async (formData) => {
    try {
      await createScenario(formData.name, formData.description, formData.url)
      setShowCreateForm(false)
    } catch (error) {
      // Error is handled by store
    }
  }

  const handleUpdateScenario = async (formData) => {
    try {
      await updateScenario(editingScenario.id, formData.name, formData.description, formData.url)
      setEditingScenario(null)
    } catch (error) {
      // Error is handled by store
    }
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
    } catch (error) {
      // Error is handled by store
    }
  }

  const handleDuplicateScenario = async (scenarioId) => {
    try {
      await duplicateScenario(scenarioId)
    } catch (error) {
      // Error is handled by store
    }
  }

  const handleLoadMore = () => {
    const newSkip = pagination.skip + pagination.take
    fetchScenarios(newSkip, pagination.take)
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#E0E0E2]">Test Scenarios</h1>
            <p className="text-[#A0A0A4] mt-1">Create and manage your test scenarios</p>
          </div>
          {!showCreateForm && !editingScenario && (
            <Button
              onClick={() => setShowCreateForm(true)}
              variant="primary"
              size="lg"
              data-testid="create-scenario-btn"
              className="self-start sm:self-auto"
            >
              + Create Scenario
            </Button>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={clearError}
          />
        )}

        {/* Create/Edit Form */}
        {(showCreateForm || editingScenario) && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#E0E0E2]">
                {editingScenario ? 'Edit Scenario' : 'Create New Scenario'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setEditingScenario(null)
                }}
                className="text-[#666] hover:text-[#E0E0E2] text-2xl"
              >
                ✕
              </button>
            </div>
            <ScenarioForm
              onSubmit={editingScenario ? handleUpdateScenario : handleCreateScenario}
              initialScenario={editingScenario}
              isLoading={isLoading}
            />
          </Card>
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
          />
        )}

        {/* Stats */}
        {!showCreateForm && !editingScenario && scenarios.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Scenarios */}
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

            {/* Total Test Steps */}
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

            {/* Last Updated */}
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
    </Layout>
  )
}
