import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { Card, Button, Input, Alert } from '../components/ui'
import { useAuthStore } from '../store/authStore'

export default function SettingsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const [activeTab, setActiveTab] = useState('profile')
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)

  // Profile state
  const [name, setName] = useState(user?.name || '')
  const [email] = useState(user?.email || '')

  // App settings
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'id')
  const [executionTimeout, setExecutionTimeout] = useState(localStorage.getItem('executionTimeout') || '30')
  const [autoScreenshot, setAutoScreenshot] = useState(localStorage.getItem('autoScreenshot') !== 'false')

  const tabs = [
    { id: 'profile', label: '👤 Profile', icon: '👤' },
    { id: 'app', label: '⚙️ Application', icon: '⚙️' },
    { id: 'about', label: 'ℹ️ About', icon: 'ℹ️' }
  ]

  const handleSaveProfile = () => {
    // Update local storage user
    const updatedUser = { ...user, name }
    localStorage.setItem('user', JSON.stringify(updatedUser))
    setSuccess('Profile berhasil diperbarui')
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleSaveAppSettings = () => {
    localStorage.setItem('theme', theme)
    localStorage.setItem('language', language)
    localStorage.setItem('executionTimeout', executionTimeout)
    localStorage.setItem('autoScreenshot', autoScreenshot.toString())
    setSuccess('Pengaturan berhasil disimpan')
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">⚙️ Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account and application settings</p>
        </div>

        {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        <div className="flex gap-6">
          {/* Sidebar Tabs */}
          <div className="w-48 shrink-0">
            <div className="space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition ${
                    activeTab === tab.id
                      ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <>
                <Card>
                  <h2 className="text-lg font-bold text-gray-900 mb-4">User Profile</h2>
                  <div className="space-y-4 max-w-md">
                    <Input
                      label="Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                    />
                    <Input
                      label="Email"
                      value={email}
                      disabled
                    />
                    <Button onClick={handleSaveProfile}>
                      Save Profile
                    </Button>
                  </div>
                </Card>

                <Card>
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Account Actions</h2>
                  <div className="space-y-3">
                    <Button variant="danger" onClick={handleLogout}>
                      🚪 Logout
                    </Button>
                  </div>
                </Card>
              </>
            )}

            {/* Application Tab */}
            {activeTab === 'app' && (
              <>
                <Card>
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Execution Settings</h2>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Execution Timeout (seconds)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="300"
                        value={executionTimeout}
                        onChange={(e) => setExecutionTimeout(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">Max timeout per step in seconds (5-300)</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Auto Screenshot</p>
                        <p className="text-sm text-gray-500">Capture screenshot after each step</p>
                      </div>
                      <button
                        onClick={() => setAutoScreenshot(!autoScreenshot)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          autoScreenshot ? 'bg-indigo-600' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          autoScreenshot ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                </Card>

                <Card>
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Display Settings</h2>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      >
                        <option value="id">Bahasa Indonesia</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
                      <select
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark (coming soon)</option>
                      </select>
                    </div>

                    <Button onClick={handleSaveAppSettings}>
                      Save Settings
                    </Button>
                  </div>
                </Card>
              </>
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <Card>
                <h2 className="text-lg font-bold text-gray-900 mb-4">About testingndrih</h2>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Application</span>
                      <span className="font-medium">testingndrih</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Version</span>
                      <span className="font-medium">1.0.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Description</span>
                      <span className="font-medium text-right">Automated Web Testing Platform</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <h3 className="font-semibold text-gray-900">Tech Stack</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-gray-600">Frontend:</span><span>React 18 + Vite + TailwindCSS</span>
                      <span className="text-gray-600">Backend:</span><span>Node.js + Express.js</span>
                      <span className="text-gray-600">Database:</span><span>PostgreSQL 16 + Prisma ORM</span>
                      <span className="text-gray-600">Test Runner:</span><span>Playwright (Chromium)</span>
                      <span className="text-gray-600">State:</span><span>Zustand</span>
                      <span className="text-gray-600">Integration:</span><span>Qase.io</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <h3 className="font-semibold text-gray-900">Supported Step Types</h3>
                    <div className="flex flex-wrap gap-2">
                      {['NAVIGATE', 'CLICK', 'FILL', 'WAIT', 'ASSERTION', 'SCREENSHOT', 'API_CALL'].map(t => (
                        <span key={t} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-mono">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
