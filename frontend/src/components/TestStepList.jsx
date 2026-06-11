import { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { Badge, Button } from './ui'

export default function TestStepList({
  steps = [],
  onReorderSteps,
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

    if (onReorderSteps) {
      onReorderSteps(source.index, destination.index)
    }
  }

  const toggleDetail = (stepId) => {
    setExpandedStepId(expandedStepId === stepId ? null : stepId)
  }

  if (steps.length === 0) {
    return (
      <div className="text-center py-8 text-[#888]">
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
        <div className="bg-[#1A1A1C] border border-[#2D2D2F] rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#A0A0A4]">Eksekusi Progress</span>
            <span className="text-sm font-bold text-[#E0E0E2]">{executionProgress}%</span>
          </div>
          <div className="w-full bg-[#2D2D2F] rounded-full h-2.5">
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
          <div className="mt-2 flex items-center justify-between text-xs text-[#888]">
            <span>Passed: {executionResult.stepResults?.filter(r => r.status === 'PASSED').length || 0} / {steps.length}</span>
            {executionResult.stepResults?.filter(r => r.status === 'FAILED').length > 0 && (
              <span className="text-red-600 font-medium">Failed: {executionResult.stepResults.filter(r => r.status === 'FAILED').length}</span>
            )}
          </div>
        </div>
      )}

      {/* Select All */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-[#2D2D2F]">
        <input
          type="checkbox"
          checked={selectedStepIds.size === steps.length && steps.length > 0}
          onChange={onToggleSelectAll}
          className="w-4 h-4 rounded border-[#2D2D2F] text-[#5E6AD2] focus:ring-[#5E6AD2] cursor-pointer"
        />
        <span className="text-sm text-[#888]">
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
              className={`space-y-2 ${snapshot.isDraggingOver ? 'bg-[#1A1A2E] rounded-lg p-2' : ''}`}
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
                        className={`p-3 border rounded-lg transition ${snapshot.isDragging ? 'shadow-lg bg-[#1A1A1C]' : ''} ${
                          isCurrentStep
                            ? 'border-yellow-500/50 bg-yellow-900/20 ring-1 ring-yellow-500/30'
                            : stepResult?.status === 'PASSED'
                            ? 'border-green-700/30 bg-green-900/20'
                            : stepResult?.status === 'FAILED'
                            ? 'border-red-700/30 bg-red-900/20'
                            : selectedStepIds.has(step.id)
                            ? 'border-[#5E6AD2]/50 bg-[#1A1A2E]'
                            : 'border-[#2D2D2F] hover:bg-[#1A1A1C]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Drag Handle */}
                          <div className="flex-shrink-0 text-[#555] cursor-grab active:cursor-grabbing text-lg">
                            ⋮⋮
                          </div>

                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedStepIds.has(step.id)}
                            onChange={() => onToggleSelection(step.id)}
                            className="w-4 h-4 flex-shrink-0 rounded border-[#2D2D2F] text-[#5E6AD2] focus:ring-[#5E6AD2] cursor-pointer"
                          />

                          {/* Step Number & Status */}
                          <div className="flex-shrink-0">
                            {stepResult?.status === 'PASSED' ? (
                              <div className="w-8 h-8 bg-green-500/15 text-green-400 rounded-full flex items-center justify-center font-bold text-sm">
                                ✓
                              </div>
                            ) : stepResult?.status === 'FAILED' ? (
                              <div className="w-8 h-8 bg-red-500/15 text-red-400 rounded-full flex items-center justify-center font-bold text-sm">
                                ✗
                              </div>
                            ) : isCurrentStep ? (
                              <div className="w-8 h-8 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center font-bold text-sm animate-pulse">
                                ▶
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-[#5E6AD2]/15 text-[#5E6AD2] rounded-full flex items-center justify-center font-bold text-sm">
                                {index + 1}
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
                              <p className="font-medium text-[#E0E0E2] truncate">{step.description}</p>
                              <span className={`flex-shrink-0 text-[#555] transition ${isExpanded ? 'rotate-180' : ''}`}>
                                ▼
                              </span>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                              <div className="mt-2 pt-2 border-t border-[#2D2D2F] space-y-1">
                                {step.selector && (
                                  <div className="text-xs text-[#888]">
                                    <span className="font-medium">Selector:</span>
                                    <code className="block bg-[#0F0E11] px-2 py-1 rounded mt-0.5 text-[#A0A0A4] break-all">
                                      {step.selector}
                                    </code>
                                  </div>
                                )}
                                {step.value && (
                                  <div className="text-xs text-[#888]">
                                    <span className="font-medium">Value:</span>
                                    <code className="block bg-[#0F0E11] px-2 py-1 rounded mt-0.5 text-[#A0A0A4] break-all">
                                      {step.value}
                                    </code>
                                  </div>
                                )}
                                {step.metadata && (
                                  <div className="text-xs text-[#888]">
                                    <span className="font-medium">Metadata:</span>
                                    <code className="block bg-[#0F0E11] px-2 py-1 rounded mt-0.5 text-[#A0A0A4] text-xs font-mono break-all">
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
                              className="px-2 py-1 text-sm bg-[#5E6AD2]/10 text-[#5E6AD2] rounded hover:bg-[#5E6AD2]/20 transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => onDeleteStep(step.id)}
                              className="px-2 py-1 text-sm bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition"
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
