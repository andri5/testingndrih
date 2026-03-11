import { useState, useEffect } from 'react'
import { useQaseStore } from '../store/qaseStore'

export default function QaseSettingsPage() {
  const [apiKey, setApiKey] = useState('')
  const [projectCode, setProjectCode] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const {
    isConnected,
    projectCode: connectedProject,
    lastSyncedAt,
    syncedCases,
    projectDetails,
    isLoading,
    error,
    connectQase,
    getQaseStatus,
    syncCases,
    fetchSyncedCases,
    fetchProjectDetails,
    pushAllExecutions,
    disconnectQase,
    clearError
  } = useQaseStore()

  // Load status on mount
  useEffect(() => {
    getQaseStatus()
    if (isConnected) {
      fetchSyncedCases()
      fetchProjectDetails()
    }
  }, [])

  const handleConnect = async (e) => {
    e.preventDefault()
    clearError()

    if (!apiKey.trim() || !projectCode.trim()) {
      return
    }

    try {
      await connectQase(apiKey, projectCode)
      setApiKey('')
      setProjectCode('')
      setShowForm(false)
      await fetchProjectDetails()
      await fetchSyncedCases()
    } catch (err) {
      console.error('Connection failed:', err)
    }
  }

  const handleSync = async () => {
    clearError()
    try {
      await syncCases()
    } catch (err) {
      console.error('Sync failed:', err)
    }
  }

  const handlePushAll = async () => {
    clearError()
    try {
      await pushAllExecutions()
      alert('Successfully pushed all executions to Qase')
    } catch (err) {
      console.error('Push failed:', err)
    }
  }

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect Qase integration?')) {
      clearError()
      try {
        await disconnectQase()
      } catch (err) {
        console.error('Disconnect failed:', err)
      }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString() +
      ' ' +
      new Date(dateString).toLocaleTimeString()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Qase.io Integration</h1>
          <p className="mt-2 text-sm text-gray-600">
            Connect your Qase.io account to sync test cases and push execution results
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={clearError}
                  className="inline-flex text-red-400 hover:text-red-500"
                >
                  <span className="sr-only">Close</span>
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Connection Status</h2>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                isConnected
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {isConnected ? 'Connected' : 'Not Connected'}
            </div>
          </div>

          {isConnected ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Project Code
                </label>
                <p className="mt-1 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  {connectedProject}
                </p>
              </div>

              {projectDetails && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Project Name
                  </label>
                  <p className="mt-1 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {projectDetails.title}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Synced
                </label>
                <p className="mt-1 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  {formatDate(lastSyncedAt)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Synced Test Cases
                </label>
                <p className="mt-1 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  {syncedCases.length} case(s)
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSync}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Syncing...' : 'Sync Cases'}
                </button>
                <button
                  onClick={handlePushAll}
                  disabled={isLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Pushing...' : 'Push All Executions'}
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              Not connected to Qase.io. Click the button below to connect.
            </p>
          )}
        </div>

        {/* Connect Form */}
        {!isConnected && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <button
              onClick={() => setShowForm(!showForm)}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
            >
              {showForm ? 'Cancel' : 'Connect Qase.io'}
            </button>

            {showForm && (
              <form onSubmit={handleConnect} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                    API Key
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      id="apiKey"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your Qase.io API key"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showApiKey ? '✕' : '◉'}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Find your API key in Qase.io account settings
                  </p>
                </div>

                <div>
                  <label htmlFor="projectCode" className="block text-sm font-medium text-gray-700">
                    Project Code
                  </label>
                  <input
                    type="text"
                    id="projectCode"
                    value={projectCode}
                    onChange={(e) => setProjectCode(e.target.value.toUpperCase())}
                    placeholder="e.g., PROJ"
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Your project code from Qase.io (e.g., the code shown in project URL)
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isLoading || !apiKey.trim() || !projectCode.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                  >
                    {isLoading ? 'Connecting...' : 'Connect'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Synced Cases List */}
        {isConnected && syncedCases.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Synced Test Cases ({syncedCases.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {syncedCases.map((testCase) => (
                    <tr key={testCase.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {testCase.qaseId}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {testCase.caseTitle}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {testCase.qaseStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
