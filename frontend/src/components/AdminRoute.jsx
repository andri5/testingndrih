import { Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import { useAuthStore } from '../store/authStore'

function AdminGate({ children }) {
  const user = useAuthStore((state) => state.user)

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/forbidden" replace />
  }

  return children
}

export default function AdminRoute({ children }) {
  return (
    <ProtectedRoute>
      <AdminGate>{children}</AdminGate>
    </ProtectedRoute>
  )
}
