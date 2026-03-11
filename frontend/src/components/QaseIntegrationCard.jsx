import { useEffect } from 'react'
import { useQaseStore } from '../store/qaseStore'
import { Link } from 'react-router-dom'

export default function QaseIntegrationCard() {
  const {
    isConnected,
    projectCode,
    lastSyncedAt,
    syncedCases,
    isLoading,
    syncCases,
    getQaseStatus
  } = useQaseStore()

  // Load status on mount
  useEffect(() => {
    getQaseStatus()
  }, [])

  const formatDate = (dateString) => {
    if (!dateString) return 'Never synced'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString()
  }

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-gray-300">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Qase.io Integration</h3>
            <p className="mt-1 text-sm text-gray-600">Not connected</p>
            <p className="mt-2 text-xs text-gray-500">
              Connect to sync test cases and push execution results
            </p>
          </div>
          <Link
            to="/qase"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            Configure
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">Qase.io Integration</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Connected
            </span>
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Project:</span>
              <span className="text-sm font-medium text-gray-900">{projectCode}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Test Cases Synced:</span>
              <span className="text-sm font-medium text-gray-900">
                {syncedCases.length} case(s)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Last Sync:</span>
              <span className="text-sm font-medium text-gray-900">
                {formatDate(lastSyncedAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={syncCases}
            disabled={isLoading}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? 'Syncing...' : 'Sync'}
          </button>
          <Link
            to="/qase"
            className="px-3 py-1.5 bg-gray-200 text-gray-900 text-sm rounded-md hover:bg-gray-300 font-medium text-center"
          >
            Settings
          </Link>
        </div>
      </div>
    </div>
  )
}
