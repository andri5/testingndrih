/**
 * ChainBuilderPage - Create and edit test chains
 */

import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSettingsStore } from '../store/settingsStore'
import Layout from '../components/Layout'
import { chainAPI, scenarioAPI } from '../services/api'
import { Tooltip } from '../components/ui'
import { Plus, Trash2, ChevronUp, ChevronDown, Save, X } from 'lucide-react'

const i18n = {
  en: {
    createChain: 'Create Chain',
    editChain: 'Edit Chain',
    loadingChain: 'Loading chain...',
    chainDetails: 'Chain Details',
    name: 'Name',
    nameRequired: 'Chain name is required',
    description: 'Description',
    selectScenario: 'Select Scenario',
    selectScenarioError: 'Please select a scenario',
    addScenario: 'Add Scenario',
    deleteStepConfirm: 'Are you sure you want to delete this step?',
    deleteChainConfirm: 'Delete this chain?',
    chainDeleted: 'Chain deleted',
    tooltips: {
      moveUp: 'Move step up',
      moveDown: 'Move step down',
      editStep: 'Edit step config (wait, retry, stop on fail)',
      deleteStep: 'Remove this step from the chain',
    },
  },
  id: {
    createChain: 'Buat Chain',
    editChain: 'Edit Chain',
    loadingChain: 'Memuat chain...',
    chainDetails: 'Detail Chain',
    name: 'Nama',
    nameRequired: 'Nama chain wajib diisi',
    description: 'Deskripsi',
    selectScenario: 'Pilih Scenario',
    selectScenarioError: 'Silakan pilih scenario',
    addScenario: 'Tambah Scenario',
    deleteStepConfirm: 'Apakah Anda yakin ingin menghapus step ini?',
    deleteChainConfirm: 'Hapus chain ini?',
    chainDeleted: 'Chain berhasil dihapus',
    tooltips: {
      moveUp: 'Pindahkan step ke atas',
      moveDown: 'Pindahkan step ke bawah',
      editStep: 'Edit konfigurasi step ini (wait, retry, stop on fail)',
      deleteStep: 'Hapus step ini dari chain',
    },
  },
}

const chainTooltipI18n = {
  en: {
    moveUp:    'Move step up',
    moveDown:  'Move step down',
    editStep:  'Edit step config (wait, retry, stop on fail)',
    deleteStep:'Remove this step from the chain',
  },
  id: {
    moveUp:    'Pindahkan step ke atas',
    moveDown:  'Pindahkan step ke bawah',
    editStep:  'Edit konfigurasi step ini (wait, retry, stop on fail)',
    deleteStep:'Hapus step ini dari chain',
  },
}

export default function ChainBuilderPage() {
  const navigate = useNavigate()
  const { chainId } = useParams()
  const isNew = chainId === 'new'
  const { theme, language } = useSettingsStore()
  const ct = chainTooltipI18n[language] ?? chainTooltipI18n.en
  const t = i18n[language] ?? i18n.en
  const isDark = theme !== 'light'

  const [chain, setChain] = useState({
    name: '',
    description: '',
    isActive: true
  })
  const [steps, setSteps] = useState([])
  const [scenarios, setScenarios] = useState([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [editingStepId, setEditingStepId] = useState(null)

  useEffect(() => {
    if (!isNew) {
      loadChain()
    }
    loadScenarios()
  }, [chainId])

  async function loadChain() {
    try {
      const response = await chainAPI.getById(chainId)
      setChain(response.data.chain)
      setSteps(response.data.chain.chainSteps || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load chain')
    } finally {
      setLoading(false)
    }
  }

  async function loadScenarios() {
    try {
      const response = await scenarioAPI.getAll(0, 100)
      setScenarios(response.data.scenarios)
    } catch (err) {
      console.error('Failed to load scenarios:', err)
    }
  }

  async function handleSave() {
    if (!chain.name.trim()) {
      setError(t.nameRequired)
      return
    }

    setSaving(true)
    setError(null)
    try {
      if (isNew) {
        const response = await chainAPI.create(chain.name, chain.description)
        navigate(`/chains/${response.data.chain.id}`)
      } else {
        await chainAPI.update(chainId, chain.name, chain.description, chain.isActive)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save chain')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddStep(scenarioId) {
    if (!scenarioId) {
      setError(t.selectScenarioError)
      return
    }

    try {
      const response = await chainAPI.addStep(chainId, scenarioId)
      setSteps([...steps, response.data.step])
      setError(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add step')
    }
  }

  async function handleDeleteStep(stepId) {
    if (!window.confirm('Are you sure you want to delete this step?')) {
      return
    }

    try {
      await chainAPI.deleteStep(stepId)
      setSteps(steps.filter(s => s.id !== stepId))
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete step')
    }
  }

  async function handleUpdateStep(stepId, updates) {
    try {
      const response = await chainAPI.updateStep(
        stepId,
        updates.description,
        updates.runMode,
        updates.waitTime,
        updates.retryCount,
        updates.stopOnFail
      )
      setSteps(steps.map(s => s.id === stepId ? response.data.step : s))
      setEditingStepId(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update step')
    }
  }

  function moveStep(index, direction) {
    const newSteps = [...steps]
    if (direction === 'up' && index > 0) {
      [newSteps[index], newSteps[index - 1]] = [newSteps[index - 1], newSteps[index]]
    } else if (direction === 'down' && index < newSteps.length - 1) {
      [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]]
    }
    setSteps(newSteps)
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading chain...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {isNew ? 'Create Chain' : 'Edit Chain'}
          </h1>
          <button
            onClick={() => navigate('/chains')}
            className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-gray-700 text-gray-300 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}`}
          >
            <X size={24} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        {/* Chain Details */}
        <div className={`border rounded-lg p-6 mb-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Chain Details</h2>

          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Name *
              </label>
              <input
                type="text"
                value={chain.name}
                onChange={(e) => setChain({ ...chain, name: e.target.value })}
                placeholder="My Test Chain"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${isDark ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Description
              </label>
              <textarea
                value={chain.description || ''}
                onChange={(e) => setChain({ ...chain, description: e.target.value })}
                placeholder="Describe what this chain does..."
                rows={3}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${isDark ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
              />
            </div>

            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={chain.isActive}
                  onChange={(e) => setChain({ ...chain, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Active</span>
              </label>
            </div>
          </div>
        </div>

        {/* Steps Section */}
        <div className={`border rounded-lg p-6 mb-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Chain Steps</h2>

          {!isNew && (
            <div className="mb-4 space-y-4">
              {steps.length === 0 ? (
                <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No steps added yet</p>
              ) : (
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`border rounded-lg p-4 ${isDark ? 'bg-gray-900/50 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full text-white font-bold text-sm">
                              {step.stepNumber}
                            </span>
                            <span className={isDark ? 'text-white font-medium' : 'text-gray-900 font-medium'}>{step.scenario.name}</span>
                          </div>
                          {step.description && (
                            <p className={`text-sm ml-11 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{step.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Tooltip text={ct.moveUp}>
                          <button
                            onClick={() => moveStep(index, 'up')}
                            disabled={index === 0}
                            className={`p-2 disabled:opacity-50 rounded-lg transition ${isDark ? 'hover:bg-gray-700 text-gray-300 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}`}
                          >
                            <ChevronUp size={18} />
                          </button>
                          </Tooltip>
                          <Tooltip text={ct.moveDown}>
                          <button
                            onClick={() => moveStep(index, 'down')}
                            disabled={index === steps.length - 1}
                            className={`p-2 disabled:opacity-50 rounded-lg transition ${isDark ? 'hover:bg-gray-700 text-gray-300 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}`}
                          >
                            <ChevronDown size={18} />
                          </button>
                          </Tooltip>
                          <Tooltip text={ct.editStep}>
                          <button
                            onClick={() => setEditingStepId(step.id)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-900'}`}
                          >
                            Edit
                          </button>
                          </Tooltip>
                          <Tooltip text={ct.deleteStep}>
                          <button
                            onClick={() => handleDeleteStep(step.id)}
                            className="p-2 hover:bg-red-600/30 rounded-lg text-red-400 hover:text-red-300 transition"
                          >
                            <Trash2 size={18} />
                          </button>
                          </Tooltip>
                        </div>
                      </div>

                      {editingStepId === step.id && (
                        <StepEditor
                          step={step}
                          onSave={(updates) => handleUpdateStep(step.id, updates)}
                          onCancel={() => setEditingStepId(null)}
                        />
                      )}

                      <div className={`grid grid-cols-3 gap-2 mt-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <div>Wait: {step.waitTime}ms</div>
                        <div>Retry: {step.retryCount}x</div>
                        <div>Stop on fail: {step.stopOnFail ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isNew && (
            <AddStepForm
              scenarios={scenarios}
              onAddStep={handleAddStep}
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition"
          >
            <Save size={20} />
            {isNew ? 'Create Chain' : 'Save Changes'}
          </button>
          <button
            onClick={() => navigate('/chains')}
            className={`px-6 py-3 rounded-lg font-medium transition ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
          >
            Cancel
          </button>
        </div>
      </div>
    </Layout>
  )
}

function AddStepForm({ scenarios, onAddStep }) {
  const [selectedScenario, setSelectedScenario] = useState('')

  return (
    <div className="border-t border-slate-600 pt-4">
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Add Step
      </label>
      <div className="flex gap-2">
        <select
          value={selectedScenario}
          onChange={(e) => setSelectedScenario(e.target.value)}
          className="flex-1 px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">Select a scenario...</option>
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => onAddStep(selectedScenario)}
          disabled={!selectedScenario}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium transition"
        >
          <Plus size={18} />
          Add
        </button>
      </div>
    </div>
  )
}

function StepEditor({ step, onSave, onCancel }) {
  const [updates, setUpdates] = useState({
    description: step.description || '',
    runMode: step.runMode,
    waitTime: step.waitTime,
    retryCount: step.retryCount,
    stopOnFail: step.stopOnFail
  })

  return (
    <div className="bg-slate-800 border border-slate-500 rounded p-3 space-y-3">
      <div>
        <label className="text-xs text-slate-400 block mb-1">Description</label>
        <input
          type="text"
          value={updates.description}
          onChange={(e) => setUpdates({ ...updates, description: e.target.value })}
          className="w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Wait (ms)</label>
          <input
            type="number"
            value={updates.waitTime}
            onChange={(e) => setUpdates({ ...updates, waitTime: parseInt(e.target.value) || 0 })}
            min="0"
            className="w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Retry Count</label>
          <input
            type="number"
            value={updates.retryCount}
            onChange={(e) => setUpdates({ ...updates, retryCount: parseInt(e.target.value) || 1 })}
            min="1"
            className="w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={updates.stopOnFail}
          onChange={(e) => setUpdates({ ...updates, stopOnFail: e.target.checked })}
          className="w-3 h-3"
        />
        <span className="text-xs text-slate-300">Stop on failure</span>
      </label>

      <div className="flex gap-2">
        <button
          onClick={() => onSave(updates)}
          className="flex-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-medium transition"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
