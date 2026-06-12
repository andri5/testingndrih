import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import AnalyticsPage from './pages/AnalyticsPage'
import ScenariosPage from './pages/ScenariosPage'
import ScenarioDetailPage from './pages/ScenarioDetailPage'
import ExecutionPage from './pages/ExecutionPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import ChainsPage from './pages/ChainsPage'
import ChainBuilderPage from './pages/ChainBuilderPage'
import ChainExecutorPage from './pages/ChainExecutorPage'
import SchedulerPage from './pages/SchedulerPage'
import ParallelExecutionPage from './pages/ParallelExecutionPage'
import BrowserMatrixPage from './pages/BrowserMatrixPage'
import SmokeTestPage from './pages/SmokeTest'
import StressTestPage from './pages/StressTestPage'
import SecurityTestPage from './pages/SecurityTestPage'
import ApiTestingPage from './pages/ApiTestingPage'
import EnvironmentsPage from './pages/EnvironmentsPage'
import VisualRegressionPage from './pages/VisualRegressionPage'
import SmokeTestHelpPage from './pages/SmokeTestHelpPage'
import StressTestHelpPage from './pages/StressTestHelpPage'
import SecurityTestHelpPage from './pages/SecurityTestHelpPage'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import NotFoundPage from './pages/NotFoundPage'
import MaintenancePage from './pages/MaintenancePage'
import SessionExpiredPage from './pages/SessionExpiredPage'
import ForbiddenPage from './pages/ForbiddenPage'
import ServerErrorPage from './pages/ServerErrorPage'
import ErrorBoundary from './components/ErrorBoundary'
import OfflineBanner from './components/OfflineBanner'
import ServerHealthMonitor from './components/ServerHealthMonitor'
import { useAuthStore } from './store/authStore'
import { useSettingsStore } from './store/settingsStore'

export default function App() {
  const token = useAuthStore((state) => state.token)
  const refreshUser = useAuthStore((state) => state.refreshUser)
  const init = useSettingsStore((state) => state.init)

  useEffect(() => {
    init()
    if (token) {
      refreshUser()
    }
  }, [])

  return (
    <ErrorBoundary>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#1A1A1C', color: '#E0E0E2', border: '1px solid rgba(255,255,255,0.1)' }
        }}
      />
      <OfflineBanner />
      <Router>
      <ServerHealthMonitor />
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
        <Route
          path="/forgot-password"
          element={token ? <Navigate to="/dashboard" /> : <ForgotPasswordPage />}
        />
        <Route
          path="/reset-password/:token"
          element={token ? <Navigate to="/dashboard" /> : <ResetPasswordPage />}
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
          path="/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsPage />
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
        <Route path="/chains" element={<AdminRoute><ChainsPage /></AdminRoute>} />
        <Route path="/chains/:chainId" element={<AdminRoute><ChainBuilderPage /></AdminRoute>} />
        <Route path="/chains/:chainId/execute" element={<AdminRoute><ChainExecutorPage /></AdminRoute>} />
        <Route path="/scheduler" element={<AdminRoute><SchedulerPage /></AdminRoute>} />
        <Route path="/parallel" element={<AdminRoute><ParallelExecutionPage /></AdminRoute>} />
        <Route path="/browser-matrix" element={<AdminRoute><BrowserMatrixPage /></AdminRoute>} />
        <Route path="/smoke-test" element={<AdminRoute><SmokeTestPage /></AdminRoute>} />
        <Route path="/stress-test" element={<AdminRoute><StressTestPage /></AdminRoute>} />
        <Route path="/security-test" element={<AdminRoute><SecurityTestPage /></AdminRoute>} />
        <Route path="/api-testing" element={<AdminRoute><ApiTestingPage /></AdminRoute>} />
        <Route path="/issues" element={<Navigate to="/dashboard" replace />} />
        <Route path="/environments" element={<AdminRoute><EnvironmentsPage /></AdminRoute>} />
        <Route path="/visual-regression" element={<AdminRoute><VisualRegressionPage /></AdminRoute>} />

        {/* Help Pages */}
        <Route path="/help/smoke-test" element={<AdminRoute><SmokeTestHelpPage /></AdminRoute>} />
        <Route path="/help/stress-test" element={<AdminRoute><StressTestHelpPage /></AdminRoute>} />
        <Route path="/help/security-test" element={<AdminRoute><SecurityTestHelpPage /></AdminRoute>} />

        {/* Maintenance */}
        <Route path="/maintenance" element={<MaintenancePage />} />

        {/* Session expired */}
        <Route path="/session-expired" element={<SessionExpiredPage />} />

        {/* Forbidden */}
        <Route path="/forbidden" element={<ForbiddenPage />} />

        {/* Server error */}
        <Route path="/server-error" element={<ServerErrorPage />} />

        {/* Catch-all */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
    </ErrorBoundary>
  )
}
