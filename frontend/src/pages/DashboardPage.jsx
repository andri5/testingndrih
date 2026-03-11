import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Card } from '../components/ui'
import Layout from '../components/Layout'
import QaseIntegrationCard from '../components/QaseIntegrationCard'

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user?.name || 'User'}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your test scenarios and automations
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600">0</div>
              <p className="text-gray-600 mt-2">Test Scenarios</p>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">0</div>
              <p className="text-gray-600 mt-2">Executions</p>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">0%</div>
              <p className="text-gray-600 mt-2">Success Rate</p>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('/scenarios')}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition text-left"
            >
              <p className="font-semibold text-gray-900">+ Create Scenario</p>
              <p className="text-sm text-gray-600 mt-1">Start recording a new test</p>
            </button>
            
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition text-left">
              <p className="font-semibold text-gray-900">▶️ Run Execution</p>
              <p className="text-sm text-gray-600 mt-1">Execute a test scenario</p>
            </button>
          </div>
        </Card>

        {/* Qase.io Integration */}
        <QaseIntegrationCard />

        {/* Recent Activity */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="text-center py-8 text-gray-500">
            <p>No recent activity yet</p>
          </div>
        </Card>
      </div>
    </Layout>
  )
}
