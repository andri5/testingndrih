import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Button } from './ui'

export default function Layout({ children }) {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Scenarios', path: '/scenarios', icon: '🧪' },
    { name: 'Execution', path: '/execution', icon: '▶️' },
    { name: 'Reports', path: '/reports', icon: '📈' },
    { name: 'Qase.io', path: '/qase', icon: '🔗' },
    { name: 'Settings', path: '/settings', icon: '⚙️' }
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`bg-gray-900 text-white transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="p-4 border-b border-gray-700">
          {/* Logo */}
          <Link to="/dashboard" className="block">
            <h1 className={`font-bold ${sidebarOpen ? 'text-2xl' : 'text-xl'}`}>
              {sidebarOpen ? 'testingndrih' : 'TD'}
            </h1>
            {sidebarOpen && <p className="text-gray-400 text-xs">Test Automation</p>}
          </Link>
        </div>

        {/* Menu Items */}
        <nav className="p-4">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition mb-2"
              title={item.name}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Toggle Sidebar */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-600 hover:text-gray-900 transition"
              title="Toggle sidebar"
            >
              {sidebarOpen ? '◀️' : '▶️'}
            </button>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* User Info */}
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>

              {/* Logout Button */}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
