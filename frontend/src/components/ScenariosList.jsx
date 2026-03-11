import { Button, Badge, Spinner, Card } from './ui'

export function ScenariosList({ 
  scenarios, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onView,
  isLoading = false,
  hasMore = false,
  onLoadMore = null
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
          <p className="text-gray-500 text-lg mb-4">No scenarios found</p>
          <p className="text-gray-400 text-sm">Create your first scenario to get started</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {scenarios.map((scenario) => (
        <Card key={scenario.id} className="hover:shadow-lg transition">
          <div className="flex items-start justify-between">
            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900">{scenario.name}</h3>
                {scenario.stepCount > 0 && (
                  <Badge variant="primary">{scenario.stepCount} steps</Badge>
                )}
              </div>
              
              {scenario.description && (
                <p className="text-gray-600 mt-1 text-sm">{scenario.description}</p>
              )}
              
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span>🌐 {scenario.url}</span>
                <span>Created: {new Date(scenario.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 ml-4">
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
                variant="ghost"
                size="sm"
                onClick={() => onDuplicate(scenario.id)}
                disabled={isLoading}
                title="Duplicate this scenario"
              >
                Duplicate
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
      ))}

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
