import { useState } from 'react'
import { X, AlertCircle, CheckCircle, ChevronDown, ChevronUp, FileUp, Edit2, HelpCircle } from 'lucide-react'
import { Tooltip } from './ui'
import { useSettingsStore } from '../store/settingsStore'

export function ImportPreviewModal({ data, isLoading, onConfirm, onCancel }) {
  const { theme } = useSettingsStore()
  const isDarkMode = theme === 'dark'
  const [editingScenarioIdx, setEditingScenarioIdx] = useState(null)
  const [editingStepIdx, setEditingStepIdx] = useState(null)
  const [expandedScenario, setExpandedScenario] = useState(0)
  const [editedData, setEditedData] = useState(JSON.parse(JSON.stringify(data?.scenarios || [])))

  // Color classes
  const bgClass = isDarkMode ? 'bg-[#161618]' : 'bg-white'
  const borderClass = isDarkMode ? 'border-[rgba(255,255,255,0.08)]' : 'border-gray-200'
  const textPrimaryClass = isDarkMode ? 'text-[#E0E0E2]' : 'text-gray-900'
  const textSecondaryClass = isDarkMode ? 'text-[#8A8A8F]' : 'text-gray-600'
  const inputBgClass = isDarkMode ? 'bg-[#1F1E22]' : 'bg-gray-50'
  const inputBorderClass = isDarkMode ? 'border-[rgba(255,255,255,0.12)]' : 'border-gray-300'
  const buttonPrimaryClass = isDarkMode
    ? 'bg-[#5E6AD2] hover:bg-[#6B7AE8] text-white'
    : 'bg-blue-600 hover:bg-blue-700 text-white'
  const buttonSecondaryClass = isDarkMode
    ? 'bg-[#2A2A2D] hover:bg-[#3A3A3D] text-[#E0E0E2]'
    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
  const hoverRowClass = isDarkMode
    ? 'hover:bg-[#2A2A2D]'
    : 'hover:bg-gray-50'

  const handleEditScenario = (idx, field, value) => {
    const updated = [...editedData]
    updated[idx] = { ...updated[idx], [field]: value }
    setEditedData(updated)
  }

  const handleEditStep = (scenarioIdx, stepIdx, field, value) => {
    const updated = [...editedData]
    updated[scenarioIdx].steps[stepIdx] = {
      ...updated[scenarioIdx].steps[stepIdx],
      [field]: value
    }
    setEditedData(updated)
  }

  const handleConfirm = () => {
    onConfirm({ scenarios: editedData })
  }

  const totalSteps = editedData.reduce((sum, s) => sum + (s.steps?.length || 0), 0)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${bgClass} rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border ${borderClass}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${borderClass}`}>
          <div className="flex items-center gap-2">
            <FileUp size={20} className="text-[#5E6AD2]" />
            <div className="flex items-center gap-2">
              <h2 className={`text-lg font-semibold ${textPrimaryClass}`}>Preview Import</h2>
              <Tooltip text="Review parsed data before creating scenarios. Edit any fields as needed." position="right">
                <HelpCircle size={16} className={textSecondaryClass} />
              </Tooltip>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-1 hover:bg-[rgba(255,255,255,0.06)] rounded transition-colors"
          >
            <X size={20} className={textSecondaryClass} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {/* Summary */}
          <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-[#2A2A2D]' : 'bg-blue-50'} border ${borderClass}`}>
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className={`font-medium ${textPrimaryClass}`}>Ready to Import</p>
                  <Tooltip text="All data validated and ready. Click 'Create Scenarios' to proceed." position="right">
                    <HelpCircle size={14} className={textSecondaryClass} />
                  </Tooltip>
                </div>
                <p className={`text-sm ${textSecondaryClass} mt-1`}>
                  {editedData.length} scenario(s) with {totalSteps} step(s) will be created
                </p>
              </div>
            </div>
          </div>

          {/* Scenarios List */}
          <div className="space-y-3">
            {editedData.map((scenario, scenarioIdx) => (
              <div key={scenarioIdx} className={`border ${borderClass} rounded-lg overflow-hidden`}>
                {/* Scenario Header */}
                <button
                  onClick={() => setExpandedScenario(expandedScenario === scenarioIdx ? null : scenarioIdx)}
                  className={`w-full flex items-center gap-3 px-4 py-3 ${hoverRowClass} transition-colors`}
                >
                  <ChevronDown
                    size={18}
                    className={`transform transition-transform ${expandedScenario === scenarioIdx ? '' : '-rotate-90'}`}
                  />
                  <div className="flex-1 text-left">
                    <p className={`font-medium ${textPrimaryClass}`}>
                      {scenario.name}
                      <span className={`ml-2 text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-[#5E6AD2]/20 text-[#8FB3FF]' : 'bg-blue-100 text-blue-700'}`}>
                        {scenario.steps?.length || 0} steps
                      </span>
                    </p>
                    <p className={`text-sm ${textSecondaryClass}`}>{scenario.url}</p>
                  </div>
                  <Edit2 size={16} className={textSecondaryClass} />
                </button>

                {/* Scenario Details (Editable) */}
                {expandedScenario === scenarioIdx && (
                  <div className={`px-4 py-3 border-t ${borderClass} space-y-3 ${isDarkMode ? 'bg-[#1F1E22]' : 'bg-gray-50'}`}>
                  {/* Edit Scenario Fields */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className={`block text-sm font-medium ${textPrimaryClass}`}>Scenario Name</label>
                        <Tooltip text="Unique name for this test scenario" position="right">
                          <HelpCircle size={14} className={textSecondaryClass} />
                        </Tooltip>
                      </div>
                      <input
                        type="text"
                        value={scenario.name}
                        onChange={(e) => handleEditScenario(scenarioIdx, 'name', e.target.value)}
                        className={`w-full px-3 py-2 rounded border ${inputBorderClass} ${inputBgClass} ${textPrimaryClass} text-sm`}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className={`block text-sm font-medium ${textPrimaryClass}`}>Description</label>
                        <Tooltip text="Optional summary of what this scenario tests" position="right">
                          <HelpCircle size={14} className={textSecondaryClass} />
                        </Tooltip>
                      </div>
                      <input
                        type="text"
                        value={scenario.description || ''}
                        onChange={(e) => handleEditScenario(scenarioIdx, 'description', e.target.value)}
                        className={`w-full px-3 py-2 rounded border ${inputBorderClass} ${inputBgClass} ${textPrimaryClass} text-sm`}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className={`block text-sm font-medium ${textPrimaryClass}`}>Base URL</label>
                        <Tooltip text="Starting URL where the test will begin (must start with http:// or https://)" position="right">
                          <HelpCircle size={14} className={textSecondaryClass} />
                        </Tooltip>
                      </div>
                      <input
                        type="text"
                        value={scenario.url}
                        onChange={(e) => handleEditScenario(scenarioIdx, 'url', e.target.value)}
                        className={`w-full px-3 py-2 rounded border ${inputBorderClass} ${inputBgClass} ${textPrimaryClass} text-sm`}
                      />
                    </div>

                    {/* Steps Preview */}
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className={`text-sm font-medium ${textPrimaryClass}`}>Test Steps ({scenario.steps?.length || 0})</h4>
                        <Tooltip text="Sequence of actions to execute in this scenario. Each step has a type (NAVIGATE, CLICK, FILL, etc.) and target selector." position="right">
                          <HelpCircle size={14} className={textSecondaryClass} />
                        </Tooltip>
                      </div>
                      <div className={`rounded border ${borderClass} overflow-hidden`}>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className={isDarkMode ? 'bg-[#2A2A2D]' : 'bg-gray-100'}>
                              <th className={`px-3 py-2 text-left font-medium ${textPrimaryClass}`}>Step</th>
                              <th className={`px-3 py-2 text-left font-medium ${textPrimaryClass}`}>Type</th>
                              <th className={`px-3 py-2 text-left font-medium ${textPrimaryClass}`}>Description</th>
                              <th className={`px-3 py-2 text-left font-medium ${textPrimaryClass}`}>Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {scenario.steps?.map((step, stepIdx) => (
                              <tr key={stepIdx} className={`border-t ${borderClass} ${hoverRowClass}`}>
                                <td className={`px-3 py-2 ${textPrimaryClass}`}>{step.stepNumber}</td>
                                <td className={`px-3 py-2 ${textSecondaryClass}`}>
                                  <span className={`px-2 py-1 rounded text-xs ${isDarkMode ? 'bg-[#5E6AD2]/20 text-[#8FB3FF]' : 'bg-blue-100 text-blue-700'}`}>
                                    {step.type}
                                  </span>
                                </td>
                                <td className={`px-3 py-2 ${textPrimaryClass}`}>{step.description}</td>
                                <td className={`px-3 py-2 ${textSecondaryClass} text-xs truncate`}>{step.value || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${borderClass}`}>
          <Tooltip text="Close preview without creating scenarios" position="top">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className={`px-4 py-2 rounded transition-colors ${buttonSecondaryClass} disabled:opacity-50`}
            >
              Cancel
            </button>
          </Tooltip>
          <Tooltip text="Create all scenarios and test steps. This action cannot be undone." position="top">
            <button
              onClick={handleConfirm}
              disabled={isLoading || editedData.length === 0}
              className={`px-4 py-2 rounded transition-colors ${buttonPrimaryClass} disabled:opacity-50 flex items-center gap-2`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Create Scenarios
                </>
              )}
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
