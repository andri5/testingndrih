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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Test Scenarios</h1>
            <p className="text-gray-600 mt-2">Create and manage your test scenarios</p>
          </div>
          {!showCreateForm && !editingScenario && (
            <Button
              onClick={() => setShowCreateForm(true)}
              variant="primary"
              size="lg"
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
              <h2 className="text-xl font-bold text-gray-900">
                {editingScenario ? 'Edit Scenario' : 'Create New Scenario'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setEditingScenario(null)
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
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
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-indigo-600">{scenarios.length}</p>
                <p className="text-gray-600 mt-2">Total Scenarios</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {scenarios.reduce((sum, s) => sum + (s.stepCount || 0), 0)}
                </p>
                <p className="text-gray-600 mt-2">Total Test Steps</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {new Date().toLocaleDateString()}
                </p>
                <p className="text-gray-600 mt-2">Last Updated</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  )
}
