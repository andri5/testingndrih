import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ScenariosPage from './pages/ScenariosPage'
import ExecutionPage from './pages/ExecutionPage'
import QaseSettingsPage from './pages/QaseSettingsPage'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuthStore } from './store/authStore'

export default function App() {
  const token = useAuthStore((state) => state.token)

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
          path="/execution"
          element={
            <ProtectedRoute>
              <ExecutionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/qase"
          element={
            <ProtectedRoute>
              <QaseSettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  )
}
