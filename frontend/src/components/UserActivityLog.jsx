import { useEffect, useState } from 'react'
import { Eye, RefreshCw } from 'lucide-react'
import { Alert, Button, Spinner } from './ui'
import { userAPI } from '../services/api'

function ActivityModal({ title, children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-hidden bg-[#1A1A1C] border border-[#2D2D2F] rounded-xl shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D2D2F]">
          <h3 className="text-lg font-semibold text-[#E0E0E2]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#666] hover:text-[#E0E0E2] text-sm"
          >
            Close
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>
  )
}

function formatWhen(date) {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function typeBadge(type) {
  const colors = {
    EXECUTION: 'bg-[#5E6AD2]/15 text-[#9BA3F0] border-[#5E6AD2]/25',
    SCENARIO_CREATED: 'bg-[#3DAF7A]/15 text-[#34D399] border-[#3DAF7A]/25',
    SCENARIO_UPDATED: 'bg-[#3A9E9E]/15 text-[#5EEAD4] border-[#3A9E9E]/25',
    CHAIN_EXECUTION: 'bg-[#A78BFA]/15 text-[#C4B5FD] border-[#A78BFA]/25',
    SECURITY_SCAN: 'bg-[#F59E0B]/15 text-[#FBBF24] border-[#F59E0B]/25',
  }
  const label = (type || 'ACTIVITY').replace(/_/g, ' ')
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold border ${colors[type] || 'bg-[#2D2D2F] text-[#A0A0A4] border-[#3A3A3C]'}`}
    >
      {label}
    </span>
  )
}

export default function UserActivityLog() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [logLoading, setLogLoading] = useState(false)
  const [activities, setActivities] = useState([])

  const loadSummary = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await userAPI.activitySummary()
      setUsers(res.data.users || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load user activity')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSummary()
  }, [])

  const openLog = async (user) => {
    setSelectedUser(user)
    setLogLoading(true)
    setActivities([])
    try {
      const res = await userAPI.activityLog(user.id, 50)
      setActivities(res.data.activities || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load activity log')
      setSelectedUser(null)
    } finally {
      setLogLoading(false)
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

      <div className="flex justify-end">
        <Button size="sm" variant="secondary" onClick={loadSummary}>
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#2D2D2F]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2D2D2F] bg-[#0F0E11] text-left text-[#A0A0A4]">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Last activity</th>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">7d runs</th>
              <th className="px-4 py-3 font-medium text-right">Log</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#666]">
                  No USER accounts to monitor yet.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-[#2D2D2F] last:border-0 hover:bg-[#0F0E11]/50"
                >
                  <td className="px-4 py-3">
                    <p className="text-[#E0E0E2]">{u.name || '—'}</p>
                    <p className="text-xs text-[#666]">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {u.lastActivity ? (
                      <div className="space-y-1">
                        {typeBadge(u.lastActivity.type)}
                        <p className="text-[#A0A0A4] text-xs">{u.lastActivity.action}</p>
                      </div>
                    ) : (
                      <span className="text-[#666] text-xs">No activity yet</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#666]">
                    {formatWhen(u.lastActivity?.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-[#A0A0A4]">
                    {u.stats?.executionsLast7Days ?? 0}
                    <span className="text-[#666] text-xs ml-1">
                      / {u.stats?.executions ?? 0} total
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      title="View activity log"
                      onClick={() => openLog(u)}
                      className="p-1.5 rounded text-[#8A8A8F] hover:text-[#E0E0E2] hover:bg-[#252528]"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[#555]">
        Monitoring {users.length} USER account{users.length !== 1 ? 's' : ''}. Admin accounts are
        excluded.
      </p>

      {selectedUser && (
        <ActivityModal
          title={`Activity log — ${selectedUser.name || selectedUser.email}`}
          onClose={() => {
            setSelectedUser(null)
            setActivities([])
          }}
        >
          {logLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : activities.length === 0 ? (
            <p className="text-sm text-[#666] text-center py-8">No recorded activity yet.</p>
          ) : (
            <div className="space-y-3">
              {activities.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-[#2D2D2F] bg-[#0F0E11] px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {typeBadge(item.type)}
                    <span className="text-xs text-[#666]">{formatWhen(item.createdAt)}</span>
                  </div>
                  <p className="text-sm text-[#E0E0E2]">{item.action}</p>
                  {item.detail && (
                    <p className="text-xs text-[#666] mt-1">{item.detail}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </ActivityModal>
      )}
    </div>
  )
}
