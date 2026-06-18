import { useState } from 'react'
import { Eye, Copy, Trash2, Star, Tag } from 'lucide-react'
import { Button, Badge, Spinner, Card, Tooltip } from './ui'
import ExportFormatButton from './ExportFormatButton'

const tooltipI18n = {
    view:   'View details & steps',
    edit:   'Edit name, description, and URL',
    clone:  'Duplicate scenario with all its steps',
    delete: 'Permanently delete this scenario',
    smoke:  'Mark as smoke test for deployment validation',
    unsmoke: 'Remove smoke test marker',
    stress: 'Mark as stress test for performance testing',
    unstress: 'Remove stress test marker',
    security: 'Mark for security testing and vulnerability scanning',
    unsecurity: 'Remove security testing marker',
  
}

export function ScenariosList({ 
  scenarios, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onView,
  onMarkSmoke,
  onMarkStress,
  onMarkSecurity,
  onToggleFavorite = null,
  onEditTags = null,
  isLoading = false,
  hasMore = false,
  onLoadMore = null,
  // Bulk select props
  selectedIds = new Set(),
  onToggleSelect = null,
  onSelectAll = null,
  bulkSelectEnabled = false,
}) {
  const tt = tooltipI18n

  // Track per-action loading state
  const [loadingStates, setLoadingStates] = useState({})

  const setActionLoading = (key, isLoading) => {
    setLoadingStates(prev => ({ ...prev, [key]: isLoading }))
  }

  const isActionLoading = (key) => loadingStates[key] ?? false

  // Wrapper functions dengan loading state
  const handleMarkSmoke = async (scenarioId, value) => {
    const key = `smoke-${scenarioId}`
    setActionLoading(key, true)
    try {
      await onMarkSmoke(scenarioId, value)
    } finally {
      setActionLoading(key, false)
    }
  }

  const handleMarkStress = async (scenarioId, value) => {
    const key = `stress-${scenarioId}`
    setActionLoading(key, true)
    try {
      await onMarkStress(scenarioId, value)
    } finally {
      setActionLoading(key, false)
    }
  }

  const handleMarkSecurity = async (scenarioId, value) => {
    const key = `security-${scenarioId}`
    setActionLoading(key, true)
    try {
      await onMarkSecurity(scenarioId, value)
    } finally {
      setActionLoading(key, false)
    }
  }
  if (isLoading && scenarios.length === 0) {
    return (
      <Card>
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" />
        </div>
      </Card>
    )
  }

  if (!isLoading && scenarios.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-[#888] text-lg mb-4">No scenarios found</p>
          <p className="text-[#555] text-sm">Create your first scenario to get started</p>
        </div>
      </Card>
    )
  }

  const allSelected = scenarios.length > 0 && scenarios.every(s => selectedIds.has(s.id))

  return (
    <div className="space-y-3">
      {/* Select all row */}
      {bulkSelectEnabled && onSelectAll && (
        <div className="flex items-center gap-2 px-1 pb-1">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => onSelectAll(allSelected ? [] : scenarios.map(s => s.id))}
            className="w-4 h-4 rounded border-[rgba(255,255,255,0.2)] bg-[#141316] accent-[#5E6AD2] cursor-pointer"
          />
          <span className="text-xs text-[#8A8A8F]">
            {allSelected ? 'Deselect all' : `Select all (${scenarios.length})`}
          </span>
        </div>
      )}

      {scenarios.map((scenario) => {
        const isSelected = selectedIds.has(scenario.id)
        return (
          <Card
            key={scenario.id}
            className={`hover:shadow-lg transition ${isSelected ? 'ring-1 ring-[#5E6AD2]/60 bg-[#5E6AD2]/5' : ''}`}
          >
            <div className="flex items-start gap-3">
              {/* Checkbox */}
              {bulkSelectEnabled && onToggleSelect && (
                <div className="pt-1 shrink-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(scenario.id)}
                    className="w-4 h-4 rounded border-[rgba(255,255,255,0.2)] bg-[#141316] accent-[#5E6AD2] cursor-pointer"
                  />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  {onToggleFavorite && (
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(scenario.id)}
                      className={`shrink-0 p-1 rounded transition ${
                        scenario.isFavorite
                          ? 'text-amber-400 hover:text-amber-300'
                          : 'text-[#555] hover:text-amber-400'
                      }`}
                      title={scenario.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star size={18} className={scenario.isFavorite ? 'fill-current' : ''} />
                    </button>
                  )}
                  <h3 className="text-lg font-semibold text-[#E0E0E2]">{scenario.name}</h3>
                  {scenario.stepCount > 0 && (
                    <Badge variant="primary">{scenario.stepCount} steps</Badge>
                  )}
                </div>
                
                {scenario.description && (
                  <p className="text-[#A0A0A4] mt-1 text-sm">{scenario.description}</p>
                )}

                {(scenario.tags?.length > 0 || onEditTags) && (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {(scenario.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#5E6AD2]/15 text-[#9BA3F0] text-xs font-medium"
                      >
                        <Tag size={10} />
                        {tag}
                      </span>
                    ))}
                    {onEditTags && (
                      <button
                        type="button"
                        onClick={() => onEditTags(scenario)}
                        className="text-xs text-[#8A8A8F] hover:text-[#E0E0E2] underline"
                      >
                        {scenario.tags?.length ? 'Edit tags' : '+ Add tags'}
                      </button>
                    )}
                  </div>
                )}
                
                <div className="flex items-center gap-4 mt-2 text-xs text-[#666] flex-wrap">
                  <span className="truncate max-w-[240px]">🌐 {scenario.url}</span>
                  <span>Created: {new Date(scenario.createdAt).toLocaleDateString()}</span>
                  {scenario.isSmoke && (
                    <span className="px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 font-medium text-xs">
                      ⚡ Smoke Test
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 ml-2 shrink-0">
                <Tooltip text={tt.view}>
                <ExportFormatButton
                  format="primary"
                  icon={Eye}
                  onClick={() => onView(scenario)}
                  disabled={isLoading}
                >
                  View
                </ExportFormatButton>
                </Tooltip>
                <Tooltip text={tt.edit}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onEdit(scenario)}
                  disabled={isLoading}
                >
                  Edit
                </Button>
                </Tooltip>
                <Tooltip text={tt.clone}>
                <ExportFormatButton
                  format="json"
                  icon={Copy}
                  onClick={() => onDuplicate(scenario.id)}
                  disabled={isLoading}
                >
                  Clone
                </ExportFormatButton>
                </Tooltip>
                {onMarkSmoke && (
                  <Tooltip text={scenario.isSmoke ? tt.unsmoke : tt.smoke}>
                  <Button
                    variant={scenario.isSmoke ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => handleMarkSmoke(scenario.id, !scenario.isSmoke)}
                    disabled={isLoading || isActionLoading(`smoke-${scenario.id}`)}
                  >
                    {isActionLoading(`smoke-${scenario.id}`) ? (
                      <div className="flex items-center gap-1">
                        <Spinner size="sm" variant="primary" />
                        <span>Marking...</span>
                      </div>
                    ) : (
                      scenario.isSmoke ? '⚡ Smoke' : '⚡ Mark'
                    )}
                  </Button>
                  </Tooltip>
                )}
                {onMarkStress && (
                  <Tooltip text={scenario.isStress ? tt.unstress : tt.stress}>
                  <Button
                    variant={scenario.isStress ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => handleMarkStress(scenario.id, !scenario.isStress)}
                    disabled={isLoading || isActionLoading(`stress-${scenario.id}`)}
                  >
                    {isActionLoading(`stress-${scenario.id}`) ? (
                      <div className="flex items-center gap-1">
                        <Spinner size="sm" variant="primary" />
                        <span>Marking...</span>
                      </div>
                    ) : (
                      scenario.isStress ? '⚙️ Stress' : '⚙️ Stress'
                    )}
                  </Button>
                  </Tooltip>
                )}
                {onMarkSecurity && (
                  <Tooltip text={scenario.isSecurity ? tt.unsecurity : tt.security}>
                  <Button
                    variant={scenario.isSecurity ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => handleMarkSecurity(scenario.id, !scenario.isSecurity)}
                    disabled={isLoading || isActionLoading(`security-${scenario.id}`)}
                  >
                    {isActionLoading(`security-${scenario.id}`) ? (
                      <div className="flex items-center gap-1">
                        <Spinner size="sm" variant="primary" />
                        <span>Marking...</span>
                      </div>
                    ) : (
                      scenario.isSecurity ? '🔒 Security' : '🔒 Security'
                    )}
                  </Button>
                  </Tooltip>
                )}
                <Tooltip text={tt.delete}>
                <ExportFormatButton
                  format="pdf"
                  icon={Trash2}
                  onClick={() => {
                    if (window.confirm(`Delete "${scenario.name}"?`)) {
                      onDelete(scenario.id)
                    }
                  }}
                  disabled={isLoading}
                >
                  Delete
                </ExportFormatButton>
                </Tooltip>
              </div>
            </div>
          </Card>
        )
      })}

      {/* Load More */}
      {hasMore && onLoadMore && (
        <div className="text-center py-4">
          <Button
            variant="ghost"
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  )
}
