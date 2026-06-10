import { useEffect, useState } from 'react'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { Alert, Button, Input, Spinner } from './ui'
import { userAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'

const PRIMARY_ADMIN_EMAIL = 'donkditren@gmail.com'

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'USER',
}

function Modal({ title, children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#1A1A1C] border border-[#2D2D2F] rounded-xl p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#E0E0E2]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#666] hover:text-[#E0E0E2] text-sm"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function UserManagement() {
  const currentUser = useAuthStore((state) => state.user)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)

  const [viewUser, setViewUser] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [formMode, setFormMode] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [editingUser, setEditingUser] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

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

  const openCreate = () => {
    setFormData(emptyForm)
    setEditingUser(null)
    setFormMode('create')
    setError(null)
    setSuccess(null)
  }

  const openEdit = (user) => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'USER',
    })
    setEditingUser(user)
    setFormMode('edit')
    setError(null)
    setSuccess(null)
  }

  const openView = async (user) => {
    setViewLoading(true)
    setError(null)
    try {
      const res = await userAPI.get(user.id)
      setViewUser(res.data.user)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load user details')
    } finally {
      setViewLoading(false)
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      if (formMode === 'create') {
        const res = await userAPI.create(formData)
        setUsers((prev) => [...prev, res.data.user])
        setSuccess('User created successfully')
      } else if (formMode === 'edit' && editingUser) {
        const payload = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        }
        if (formData.password.trim()) {
          payload.password = formData.password
        }
        const res = await userAPI.update(editingUser.id, payload)
        const updated = res.data.user
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
        setSuccess('User updated successfully')
      }
      setFormMode(null)
      setEditingUser(null)
      setFormData(emptyForm)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await userAPI.delete(deleteTarget.id)
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id))
      setSuccess(`Deleted ${deleteTarget.email}`)
      setDeleteTarget(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user')
    } finally {
      setSaving(false)
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
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate}>
          <Plus size={14} />
          Add user
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#2D2D2F]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2D2D2F] bg-[#0F0E11] text-left text-[#A0A0A4]">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isPrimaryAdmin =
                u.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()
              const isSelf = u.id === currentUser?.id
              const canDelete = !isPrimaryAdmin && !isSelf

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
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        title="View"
                        onClick={() => openView(u)}
                        className="p-1.5 rounded text-[#8A8A8F] hover:text-[#E0E0E2] hover:bg-[#252528]"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        type="button"
                        title="Edit"
                        onClick={() => openEdit(u)}
                        className="p-1.5 rounded text-[#8A8A8F] hover:text-[#E0E0E2] hover:bg-[#252528]"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        disabled={!canDelete}
                        onClick={() => setDeleteTarget(u)}
                        className="p-1.5 rounded text-[#8A8A8F] hover:text-[#F87171] hover:bg-[#252528] disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
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

      {(formMode === 'create' || formMode === 'edit') && (
        <Modal
          title={formMode === 'create' ? 'Add user' : 'Edit user'}
          onClose={() => {
            setFormMode(null)
            setEditingUser(null)
          }}
        >
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
              disabled={editingUser && editingUser.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()}
              required
            />
            <Input
              label={formMode === 'create' ? 'Password' : 'New password (optional)'}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
              required={formMode === 'create'}
              placeholder={formMode === 'edit' ? 'Leave blank to keep current password' : ''}
            />
            {!(
              editingUser &&
              editingUser.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()
            ) && (
              <div>
                <label className="block text-xs font-medium text-[#8A8A8F] mb-1.5 uppercase tracking-wider">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#161618] border border-[rgba(255,255,255,0.1)] rounded-md text-[#E0E0E2] text-sm"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setFormMode(null)
                  setEditingUser(null)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : formMode === 'create' ? 'Create user' : 'Save changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {viewUser && (
        <Modal title="User details" onClose={() => setViewUser(null)}>
          {viewLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[#666] text-xs uppercase">Name</p>
                <p className="text-[#E0E0E2]">{viewUser.name || '—'}</p>
              </div>
              <div>
                <p className="text-[#666] text-xs uppercase">Email</p>
                <p className="text-[#E0E0E2]">{viewUser.email}</p>
              </div>
              <div>
                <p className="text-[#666] text-xs uppercase">Role</p>
                <p className="text-[#E0E0E2]">{viewUser.role}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-lg bg-[#0F0E11] p-3 border border-[#2D2D2F]">
                  <p className="text-[#666] text-xs">Scenarios</p>
                  <p className="text-[#E0E0E2] font-semibold">{viewUser._count?.scenarios ?? 0}</p>
                </div>
                <div className="rounded-lg bg-[#0F0E11] p-3 border border-[#2D2D2F]">
                  <p className="text-[#666] text-xs">Executions</p>
                  <p className="text-[#E0E0E2] font-semibold">{viewUser._count?.executions ?? 0}</p>
                </div>
                <div className="rounded-lg bg-[#0F0E11] p-3 border border-[#2D2D2F]">
                  <p className="text-[#666] text-xs">Schedules</p>
                  <p className="text-[#E0E0E2] font-semibold">{viewUser._count?.testSchedules ?? 0}</p>
                </div>
                <div className="rounded-lg bg-[#0F0E11] p-3 border border-[#2D2D2F]">
                  <p className="text-[#666] text-xs">API tokens</p>
                  <p className="text-[#E0E0E2] font-semibold">{viewUser._count?.apiTokens ?? 0}</p>
                </div>
              </div>
              <div className="text-xs text-[#666] pt-2">
                Joined {viewUser.createdAt ? new Date(viewUser.createdAt).toLocaleString('en-US') : '—'}
              </div>
            </div>
          )}
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Delete user" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-[#A0A0A4] mb-4">
            Delete <strong className="text-[#E0E0E2]">{deleteTarget.email}</strong>?
            All scenarios, executions, and related data for this user will be removed.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={saving}>
              {saving ? 'Deleting...' : 'Delete user'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
