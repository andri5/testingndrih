import { useEffect, useState } from 'react'
import { Alert, Spinner } from './ui'
import { userAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'

const PRIMARY_ADMIN_EMAIL = 'donkditren@gmail.com'

export default function UserManagement() {
  const currentUser = useAuthStore((state) => state.user)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await userAPI.list()
      setUsers(res.data.users || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleRoleChange = async (userId, role) => {
    setUpdatingId(userId)
    setError(null)
    try {
      const res = await userAPI.updateRole(userId, role)
      const updated = res.data.user
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role')
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && <Alert type="error">{error}</Alert>}

      <div className="overflow-x-auto rounded-lg border border-[#2D2D2F]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2D2D2F] bg-[#0F0E11] text-left text-[#A0A0A4]">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isPrimaryAdmin =
                u.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()
              const isSelf = u.id === currentUser?.id

              return (
                <tr
                  key={u.id}
                  className="border-b border-[#2D2D2F] last:border-0 hover:bg-[#0F0E11]/50"
                >
                  <td className="px-4 py-3 text-[#E0E0E2]">{u.name || '—'}</td>
                  <td className="px-4 py-3 text-[#A0A0A4]">
                    {u.email}
                    {isPrimaryAdmin && (
                      <span className="ml-2 text-xs text-[#5E6AD2]">(primary admin)</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isPrimaryAdmin ? (
                      <span className="inline-flex px-2 py-1 rounded text-xs font-semibold bg-[#5E6AD2]/15 text-[#5E6AD2] border border-[#5E6AD2]/25">
                        ADMIN
                      </span>
                    ) : (
                      <select
                        value={u.role}
                        disabled={updatingId === u.id || (isSelf && u.role === 'ADMIN')}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="px-2 py-1 bg-[#0F0E11] border border-[#2D2D2F] rounded text-[#E0E0E2] text-xs focus:outline-none focus:border-[#5E6AD2] disabled:opacity-50"
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#666] text-xs">
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString('en-US')
                      : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[#555]">
        {users.length} user{users.length !== 1 ? 's' : ''} registered
      </p>
    </div>
  )
}
