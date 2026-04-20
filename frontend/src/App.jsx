import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ScenariosPage from './pages/ScenariosPage'
import ScenarioDetailPage from './pages/ScenarioDetailPage'
import ExecutionPage from './pages/ExecutionPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import ProtectedRoute from './components/ProtectedRoute'
import NotFoundPage from './pages/NotFoundPage'
import MaintenancePage from './pages/MaintenancePage'
import SessionExpiredPage from './pages/SessionExpiredPage'
import { useAuthStore } from './store/authStore'
import { useSettingsStore } from './store/settingsStore'

export default function App() {
  const token = useAuthStore((state) => state.token)
  const init = useSettingsStore((state) => state.init)

  useEffect(() => {
    init()
  }, [])

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={token ? <Navigate to="/dashboard" /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={token ? <Navigate to="/dashboard" /> : <RegisterPage />}
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scenarios"
          element={
            <ProtectedRoute>
              <ScenariosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scenarios/:id"
          element={
            <ProtectedRoute>
              <ScenarioDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/execution"
          element={
            <ProtectedRoute>
              <ExecutionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Maintenance */}
        <Route path="/maintenance" element={<MaintenancePage />} />

        {/* Session expired */}
        <Route path="/session-expired" element={<SessionExpiredPage />} />

        {/* Catch-all */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  )
}
