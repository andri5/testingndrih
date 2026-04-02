import { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { Badge, Button } from './ui'

export default function TestStepList({
  steps = [],
  onMoveStep,
  onEditStep,
  onDeleteStep,
  onToggleSelection,
  onToggleSelectAll,
  selectedStepIds = new Set(),
  executionResult = null,
  currentStepIndex = null,
  STEP_TYPES = [],
  isDeletingBulk = false
}) {
  const [expandedStepId, setExpandedStepId] = useState(null)

  const getStepTypeConfig = (type) => STEP_TYPES.find(t => t.value === type) || STEP_TYPES[0]

  const handleDragEnd = (result) => {
    const { source, destination } = result

    // Dropped outside the list
    if (!destination) return

    // Moved to same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return
    }

    // Calculate direction for move
    const direction = destination.index > source.index ? 1 : -1
    if (onMoveStep) {
      onMoveStep(source.index, direction)
    }
  }

  const toggleDetail = (stepId) => {
    setExpandedStepId(expandedStepId === stepId ? null : stepId)
  }

  if (steps.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-lg mb-2">Belum ada test steps</p>
        <p className="text-sm">Klik "Tambah Step" untuk mulai membuat langkah-langkah test</p>
      </div>
    )
  }

  // Calculate execution progress
  const executionProgress = executionResult ?
    Math.round(((executionResult.stepResults?.filter(r => r.status === 'PASSED' || r.status === 'FAILED').length || 0) / steps.length) * 100)
    : null

  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      {executionResult && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Eksekusi Progress</span>
            <span className="text-sm font-bold text-gray-900">{executionProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${
                executionResult.status === 'PASSED'
                  ? 'bg-green-500'
                  : executionResult.status === 'FAILED'
                  ? 'bg-red-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${executionProgress}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
            <span>Passed: {executionResult.stepResults?.filter(r => r.status === 'PASSED').length || 0} / {steps.length}</span>
            {executionResult.stepResults?.filter(r => r.status === 'FAILED').length > 0 && (
              <span className="text-red-600 font-medium">Failed: {executionResult.stepResults.filter(r => r.status === 'FAILED').length}</span>
            )}
          </div>
        </div>
      )}

      {/* Select All */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-200">
        <input
          type="checkbox"
          checked={selectedStepIds.size === steps.length && steps.length > 0}
          onChange={onToggleSelectAll}
          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
        />
        <span className="text-sm text-gray-500">
          {selectedStepIds.size === 0
            ? 'Pilih semua'
            : selectedStepIds.size === steps.length
            ? 'Batal pilih semua'
            : `${selectedStepIds.size} dari ${steps.length} dipilih`}
        </span>
      </div>

      {/* Drag & Drop Steps */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="steps-list">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`space-y-2 ${snapshot.isDraggingOver ? 'bg-indigo-50 rounded-lg p-2' : ''}`}
            >
              {steps.map((step, index) => {
                const config = getStepTypeConfig(step.type)
                const isExpanded = expandedStepId === step.id
                const stepResult = executionResult?.stepResults?.find(r => r.stepIndex === index)
                const isCurrentStep = currentStepIndex === index

                return (
                  <Draggable key={String(step.id)} draggableId={String(step.id)} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`p-3 border rounded-lg transition ${snapshot.isDragging ? 'shadow-lg bg-white' : ''} ${
                          isCurrentStep
                            ? 'border-yellow-400 bg-yellow-50 ring-2 ring-yellow-300'
                            : stepResult?.status === 'PASSED'
                            ? 'border-green-200 bg-green-50'
                            : stepResult?.status === 'FAILED'
                            ? 'border-red-200 bg-red-50'
                            : selectedStepIds.has(step.id)
                            ? 'border-indigo-300 bg-indigo-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Drag Handle */}
                          <div className="flex-shrink-0 text-gray-400 cursor-grab active:cursor-grabbing text-lg">
                            ⋮⋮
                          </div>

                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedStepIds.has(step.id)}
                            onChange={() => onToggleSelection(step.id)}
                            className="w-4 h-4 flex-shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />

                          {/* Step Number & Status */}
                          <div className="flex-shrink-0">
                            {stepResult?.status === 'PASSED' ? (
                              <div className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-sm">
                                ✓
                              </div>
                            ) : stepResult?.status === 'FAILED' ? (
                              <div className="w-8 h-8 bg-red-100 text-red-700 rounded-full flex items-center justify-center font-bold text-sm">
                                ✗
                              </div>
                            ) : isCurrentStep ? (
                              <div className="w-8 h-8 bg-yellow-100 text-yellow-700 rounded-full flex items-center justify-center font-bold text-sm animate-pulse">
                                ▶
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-sm">
                                {step.stepNumber || index + 1}
                              </div>
                            )}
                          </div>

                          {/* Step Type Badge */}
                          <div className="flex-shrink-0">
                            <Badge variant="primary">
                              {config.icon} {config.label}
                            </Badge>
                          </div>

                          {/* Step Description & Toggle */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleDetail(step.id)}>
                              <p className="font-medium text-gray-900 truncate">{step.description}</p>
                              <span className={`flex-shrink-0 text-gray-400 transition ${isExpanded ? 'rotate-180' : ''}`}>
                                ▼
                              </span>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                              <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                                {step.selector && (
                                  <div className="text-xs text-gray-600">
                                    <span className="font-medium">Selector:</span>
                                    <code className="block bg-gray-100 px-2 py-1 rounded mt-0.5 text-gray-700 break-all">
                                      {step.selector}
                                    </code>
                                  </div>
                                )}
                                {step.value && (
                                  <div className="text-xs text-gray-600">
                                    <span className="font-medium">Value:</span>
                                    <code className="block bg-gray-100 px-2 py-1 rounded mt-0.5 text-gray-700 break-all">
                                      {step.value}
                                    </code>
                                  </div>
                                )}
                                {step.metadata && (
                                  <div className="text-xs text-gray-600">
                                    <span className="font-medium">Metadata:</span>
                                    <code className="block bg-gray-100 px-2 py-1 rounded mt-0.5 text-gray-700 text-xs font-mono break-all">
                                      {step.metadata}
                                    </code>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => onEditStep(step)}
                              className="px-2 py-1 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => onDeleteStep(step.id)}
                              className="px-2 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                              disabled={isDeletingBulk}
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                )
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}
