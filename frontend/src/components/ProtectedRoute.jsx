import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Spinner } from './ui'

export default function ProtectedRoute({ children }) {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const isLoading = useAuthStore((state) => state.isLoading)

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  // Not authenticated - redirect to login
  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  return children
}
