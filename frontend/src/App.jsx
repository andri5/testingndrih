import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
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
import IssuesPage from './pages/IssuesPage'
import EnvironmentsPage from './pages/EnvironmentsPage'
import VisualRegressionPage from './pages/VisualRegressionPage'
import SmokeTestHelpPage from './pages/SmokeTestHelpPage'
import StressTestHelpPage from './pages/StressTestHelpPage'
import SecurityTestHelpPage from './pages/SecurityTestHelpPage'
import ProtectedRoute from './components/ProtectedRoute'
import NotFoundPage from './pages/NotFoundPage'
import MaintenancePage from './pages/MaintenancePage'
import SessionExpiredPage from './pages/SessionExpiredPage'
import ForbiddenPage from './pages/ForbiddenPage'
import ServerErrorPage from './pages/ServerErrorPage'
import ErrorBoundary from './components/ErrorBoundary'
import OfflineBanner from './components/OfflineBanner'
import { useAuthStore } from './store/authStore'
import { useSettingsStore } from './store/settingsStore'

export default function App() {
  const token = useAuthStore((state) => state.token)
  const init = useSettingsStore((state) => state.init)

  useEffect(() => {
    init()
  }, [])

  return (
    <ErrorBoundary>
      <OfflineBanner />
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
        <Route
          path="/chains"
          element={
            <ProtectedRoute>
              <ChainsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chains/:chainId"
          element={
            <ProtectedRoute>
              <ChainBuilderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chains/:chainId/execute"
          element={
            <ProtectedRoute>
              <ChainExecutorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scheduler"
          element={
            <ProtectedRoute>
              <SchedulerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parallel"
          element={
            <ProtectedRoute>
              <ParallelExecutionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/browser-matrix"
          element={
            <ProtectedRoute>
              <BrowserMatrixPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/smoke-test"
          element={
            <ProtectedRoute>
              <SmokeTestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stress-test"
          element={
            <ProtectedRoute>
              <StressTestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/security-test"
          element={
            <ProtectedRoute>
              <SecurityTestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/api-testing"
          element={
            <ProtectedRoute>
              <ApiTestingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/issues"
          element={
            <ProtectedRoute>
              <IssuesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/environments"
          element={
            <ProtectedRoute>
              <EnvironmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/visual-regression"
          element={
            <ProtectedRoute>
              <VisualRegressionPage />
            </ProtectedRoute>
          }
        />

        {/* Help Pages */}
        <Route
          path="/help/smoke-test"
          element={
            <ProtectedRoute>
              <SmokeTestHelpPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/help/stress-test"
          element={
            <ProtectedRoute>
              <StressTestHelpPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/help/security-test"
          element={
            <ProtectedRoute>
              <SecurityTestHelpPage />
            </ProtectedRoute>
          }
        />

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
