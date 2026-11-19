import { useState } from 'react'
import { X, CheckCircle, ChevronDown, FileUp, HelpCircle } from 'lucide-react'
import { Tooltip } from './ui'

export function ImportPreviewModal({ data, isLoading, onConfirm, onCancel }) {
  const [expandedScenario, setExpandedScenario] = useState(0)
  const [editedData, setEditedData] = useState(JSON.parse(JSON.stringify(data?.scenarios || [])))

  const bgClass = 'bg-white'
  const borderClass = 'border-gray-200'
  const textPrimaryClass = 'text-gray-900'
  const textSecondaryClass = 'text-gray-600'
  const inputBgClass = 'bg-gray-50'
  const inputBorderClass = 'border-gray-300'
  const buttonPrimaryClass = 'bg-[#0F766E] hover:bg-[#0d9488] text-white'
  const buttonSecondaryClass = 'bg-gray-200 hover:bg-gray-300 text-gray-900'
  const hoverRowClass = 'hover:bg-gray-50'

  const handleEditScenario = (idx, field, value) => {
    const updated = [...editedData]
    updated[idx] = { ...updated[idx], [field]: value }
    setEditedData(updated)
  }

  const handleConfirm = () => {
    onConfirm({ scenarios: editedData })
  }

  const totalSteps = editedData.reduce((sum, s) => sum + (s.steps?.length || 0), 0)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div
        className={`${bgClass} rounded-t-2xl sm:rounded-lg w-full max-w-4xl max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col border ${borderClass}`}
      >
        <div className={`flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b ${borderClass}`}>
          <div className="flex items-center gap-2 min-w-0">
            <FileUp size={20} className="text-[#0F766E] shrink-0" />
            <div className="flex items-center gap-2 min-w-0">
              <h2 className={`text-base sm:text-lg font-semibold ${textPrimaryClass} truncate`}>
                Preview Import
              </h2>
              <Tooltip
                text="Review parsed cases before create. Feature folder dibuat otomatis jika belum ada."
                position="right"
              >
                <HelpCircle size={16} className={textSecondaryClass} />
              </Tooltip>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={20} className={textSecondaryClass} />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-4 sm:px-6 py-4">
          <div className="mb-6 p-4 rounded-lg bg-teal-50 border border-teal-100">
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-teal-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${textPrimaryClass}`}>Siap diimport</p>
                <p className={`text-sm ${textSecondaryClass} mt-1`}>
                  {editedData.length} case dengan {totalSteps} step akan dibuat
                  {editedData.some((s) => s.featureFolder)
                    ? ' · Feature folder dari Excel dipakai (dibuat otomatis bila belum ada)'
                    : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {editedData.map((scenario, scenarioIdx) => (
              <div key={scenarioIdx} className={`border ${borderClass} rounded-lg overflow-hidden`}>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedScenario(expandedScenario === scenarioIdx ? null : scenarioIdx)
                  }
                  className={`w-full flex items-center gap-3 px-4 py-3 ${hoverRowClass} transition-colors`}
                >
                  <ChevronDown
                    size={18}
                    className={`shrink-0 transform transition-transform ${
                      expandedScenario === scenarioIdx ? '' : '-rotate-90'
                    }`}
                  />
                  <div className="flex-1 text-left min-w-0">
                    <p className={`font-medium ${textPrimaryClass} truncate`}>
                      {scenario.name}
                      <span className="ml-2 text-xs px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                        {scenario.steps?.length || 0} steps
                      </span>
                      {scenario.priority && (
                        <span className="ml-1 text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-800">
                          {scenario.priority}
                        </span>
                      )}
                    </p>
                    <p className={`text-sm ${textSecondaryClass} truncate`}>
                      {scenario.featureFolder ? `${scenario.featureFolder} · ` : ''}
                      {scenario.url}
                    </p>
                  </div>
                </button>

                {expandedScenario === scenarioIdx && (
                  <div className={`px-4 py-3 border-t ${borderClass} space-y-3 bg-gray-50`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className={`block text-xs font-medium ${textPrimaryClass}`}>
                          Feature Folder
                        </label>
                        <input
                          type="text"
                          value={scenario.featureFolder || ''}
                          onChange={(e) =>
                            handleEditScenario(scenarioIdx, 'featureFolder', e.target.value)
                          }
                          placeholder="mis. Login"
                          className={`w-full px-3 py-2 rounded border ${inputBorderClass} ${inputBgClass} ${textPrimaryClass} text-sm`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={`block text-xs font-medium ${textPrimaryClass}`}>
                          Case Name
                        </label>
                        <input
                          type="text"
                          value={scenario.name}
                          onChange={(e) => handleEditScenario(scenarioIdx, 'name', e.target.value)}
                          className={`w-full px-3 py-2 rounded border ${inputBorderClass} ${inputBgClass} ${textPrimaryClass} text-sm`}
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label className={`block text-xs font-medium ${textPrimaryClass}`}>
                          Description
                        </label>
                        <input
                          type="text"
                          value={scenario.description || ''}
                          onChange={(e) =>
                            handleEditScenario(scenarioIdx, 'description', e.target.value)
                          }
                          className={`w-full px-3 py-2 rounded border ${inputBorderClass} ${inputBgClass} ${textPrimaryClass} text-sm`}
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label className={`block text-xs font-medium ${textPrimaryClass}`}>
                          Base URL
                        </label>
                        <input
                          type="text"
                          value={scenario.url}
                          onChange={(e) => handleEditScenario(scenarioIdx, 'url', e.target.value)}
                          className={`w-full px-3 py-2 rounded border ${inputBorderClass} ${inputBgClass} ${textPrimaryClass} text-sm`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={`block text-xs font-medium ${textPrimaryClass}`}>
                          Priority
                        </label>
                        <select
                          value={scenario.priority || 'MEDIUM'}
                          onChange={(e) =>
                            handleEditScenario(scenarioIdx, 'priority', e.target.value)
                          }
                          className={`w-full px-3 py-2 rounded border ${inputBorderClass} ${inputBgClass} ${textPrimaryClass} text-sm`}
                        >
                          {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className={`block text-xs font-medium ${textPrimaryClass}`}>
                          Case Type
                        </label>
                        <input
                          type="text"
                          value={scenario.caseType || 'Functional'}
                          onChange={(e) =>
                            handleEditScenario(scenarioIdx, 'caseType', e.target.value)
                          }
                          className={`w-full px-3 py-2 rounded border ${inputBorderClass} ${inputBgClass} ${textPrimaryClass} text-sm`}
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label className={`block text-xs font-medium ${textPrimaryClass}`}>
                          Precondition
                        </label>
                        <textarea
                          value={scenario.precondition || ''}
                          onChange={(e) =>
                            handleEditScenario(scenarioIdx, 'precondition', e.target.value)
                          }
                          rows={2}
                          className={`w-full px-3 py-2 rounded border ${inputBorderClass} ${inputBgClass} ${textPrimaryClass} text-sm`}
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label className={`block text-xs font-medium ${textPrimaryClass}`}>
                          Case Expected Result
                        </label>
                        <textarea
                          value={scenario.expectedResult || ''}
                          onChange={(e) =>
                            handleEditScenario(scenarioIdx, 'expectedResult', e.target.value)
                          }
                          rows={2}
                          className={`w-full px-3 py-2 rounded border ${inputBorderClass} ${inputBgClass} ${textPrimaryClass} text-sm`}
                        />
                      </div>
                    </div>

                    <div className="mt-2">
                      <h4 className={`text-sm font-medium ${textPrimaryClass} mb-2`}>
                        Steps ({scenario.steps?.length || 0})
                      </h4>
                      <div className={`rounded border ${borderClass} overflow-x-auto`}>
                        <table className="w-full text-sm min-w-[520px]">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className={`px-3 py-2 text-left font-medium ${textPrimaryClass}`}>
                                #
                              </th>
                              <th className={`px-3 py-2 text-left font-medium ${textPrimaryClass}`}>
                                Type
                              </th>
                              <th className={`px-3 py-2 text-left font-medium ${textPrimaryClass}`}>
                                Description
                              </th>
                              <th className={`px-3 py-2 text-left font-medium ${textPrimaryClass}`}>
                                Expected
                              </th>
                              <th className={`px-3 py-2 text-left font-medium ${textPrimaryClass}`}>
                                Value
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {scenario.steps?.map((step, stepIdx) => (
                              <tr
                                key={stepIdx}
                                className={`border-t ${borderClass} ${hoverRowClass}`}
                              >
                                <td className={`px-3 py-2 ${textPrimaryClass}`}>
                                  {step.stepNumber}
                                </td>
                                <td className={`px-3 py-2 ${textSecondaryClass}`}>
                                  <span className="px-2 py-0.5 rounded text-xs bg-teal-100 text-teal-800">
                                    {step.type}
                                  </span>
                                </td>
                                <td className={`px-3 py-2 ${textPrimaryClass}`}>
                                  {step.description}
                                </td>
                                <td className={`px-3 py-2 ${textSecondaryClass} text-xs`}>
                                  {step.expectedResult || '—'}
                                </td>
                                <td
                                  className={`px-3 py-2 ${textSecondaryClass} text-xs truncate max-w-[140px]`}
                                >
                                  {step.value || '—'}
                                </td>
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

        <div
          className={`flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t ${borderClass}`}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className={`px-4 py-2.5 rounded transition-colors ${buttonSecondaryClass} disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || editedData.length === 0}
            className={`px-4 py-2.5 rounded transition-colors ${buttonPrimaryClass} disabled:opacity-50 flex items-center justify-center gap-2`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                Create Cases
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
