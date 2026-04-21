import { Button, Badge, Spinner, Card } from './ui'

export function ScenariosList({ 
  scenarios, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onView,
  isLoading = false,
  hasMore = false,
  onLoadMore = null,
  // Bulk select props
  selectedIds = new Set(),
  onToggleSelect = null,
  onSelectAll = null,
  bulkSelectEnabled = false,
}) {
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
                  <h3 className="text-lg font-semibold text-[#E0E0E2]">{scenario.name}</h3>
                  {scenario.stepCount > 0 && (
                    <Badge variant="primary">{scenario.stepCount} steps</Badge>
                  )}
                </div>
                
                {scenario.description && (
                  <p className="text-[#A0A0A4] mt-1 text-sm">{scenario.description}</p>
                )}
                
                <div className="flex items-center gap-4 mt-2 text-xs text-[#666] flex-wrap">
                  <span className="truncate max-w-[240px]">🌐 {scenario.url}</span>
                  <span>Created: {new Date(scenario.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 ml-2 shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onView(scenario)}
                  disabled={isLoading}
                >
                  View
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onEdit(scenario)}
                  disabled={isLoading}
                >
                  Edit
                </Button>
                <Button
                  variant="cyan"
                  size="sm"
                  onClick={() => onDuplicate(scenario.id)}
                  disabled={isLoading}
                  title="Clone scenario beserta semua steps-nya"
                >
                  📋 Clone
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(`Delete "${scenario.name}"?`)) {
                      onDelete(scenario.id)
                    }
                  }}
                  disabled={isLoading}
                >
                  Delete
                </Button>
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
