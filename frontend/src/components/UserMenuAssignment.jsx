import { useEffect, useState } from 'react'
import { LayoutGrid } from 'lucide-react'
import { Button, Spinner } from './ui'
import { userAPI } from '../services/api'
import {
  MENU_DEFINITIONS,
  DEFAULT_USER_MENU_KEYS,
  HIDDEN_MENU_KEYS,
  resolveUserMenuKeys,
} from '../constants/menuPermissions'

function Modal({ title, children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#1A1A1C] border border-[#2D2D2F] rounded-xl p-6 shadow-xl"
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

export default function UserMenuAssignment({ user, onClose, onSaved }) {
  const [selected, setSelected] = useState([])
  const [enabledCatalog, setEnabledCatalog] = useState([...DEFAULT_USER_MENU_KEYS])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const res = await userAPI.getMenuDefaults()
        const catalog = res.data.menus?.length
          ? res.data.menus
          : [...DEFAULT_USER_MENU_KEYS]
        if (cancelled) return
        setEnabledCatalog(catalog)
        if (user) {
          const keys = resolveUserMenuKeys({
            ...user,
            enabledUserMenus: catalog,
          })
          setSelected(keys)
        }
      } catch {
        if (cancelled) return
        setEnabledCatalog([...DEFAULT_USER_MENU_KEYS])
        if (user) {
          setSelected(
            resolveUserMenuKeys({
              ...user,
              enabledUserMenus: DEFAULT_USER_MENU_KEYS,
            })
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  const toggle = (key) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const selectDefaults = () =>
    setSelected(DEFAULT_USER_MENU_KEYS.filter((k) => enabledCatalog.includes(k)))

  const selectAll = () => setSelected([...enabledCatalog])

  const handleSave = async () => {
    if (selected.length === 0) {
      setError('Select at least one menu')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await userAPI.updateMenus(user.id, selected)
      onSaved?.(res.data.user)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update menus')
    } finally {
      setSaving(false)
    }
  }

  const available = MENU_DEFINITIONS.filter(
    (m) => enabledCatalog.includes(m.key) && !HIDDEN_MENU_KEYS.includes(m.key)
  )
  const mainMenus = available.filter((m) => m.group === 'main')
  const toolMenus = available.filter((m) => m.group === 'tools')

  return (
    <Modal title={`Assign menus — ${user?.email}`} onClose={onClose}>
      <p className="text-sm text-[#A0A0A4] mb-4">
        Choose which sidebar menus this user can access. Only menus enabled in Settings → Menus are listed.
        Settings remains available to all users.
      </p>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={selectDefaults}
              className="text-xs px-2.5 py-1 rounded border border-[#2D2D2F] text-[#A0A0A4] hover:border-[#0F766E] hover:text-[#0F766E]"
            >
              Default USER set
            </button>
            <button
              type="button"
              onClick={selectAll}
              className="text-xs px-2.5 py-1 rounded border border-[#2D2D2F] text-[#A0A0A4] hover:border-[#0F766E] hover:text-[#0F766E]"
            >
              Select all enabled
            </button>
          </div>

          <div className="space-y-4">
            {mainMenus.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#666] uppercase tracking-wider mb-2">Main</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {mainMenus.map((m) => (
                    <label
                      key={m.key}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#2D2D2F] bg-[#0F0E11] cursor-pointer hover:border-[#0F766E]/40"
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(m.key)}
                        onChange={() => toggle(m.key)}
                        className="rounded border-[#2D2D2F] bg-[#0F0E11] text-[#0F766E] focus:ring-[#0F766E]"
                      />
                      <span className="text-sm text-[#E0E0E2]">{m.labelEn}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {toolMenus.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#666] uppercase tracking-wider mb-2">Tools</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {toolMenus.map((m) => (
                    <label
                      key={m.key}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#2D2D2F] bg-[#0F0E11] cursor-pointer hover:border-[#0F766E]/40"
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(m.key)}
                        onChange={() => toggle(m.key)}
                        className="rounded border-[#2D2D2F] bg-[#0F0E11] text-[#0F766E] focus:ring-[#0F766E]"
                      />
                      <span className="text-sm text-[#E0E0E2]">{m.labelEn}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {available.length === 0 && (
              <p className="text-sm text-amber-400/90">
                No menus are enabled globally. Open Settings → Menus first.
              </p>
            )}
          </div>
        </>
      )}

      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[#2D2D2F]">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving || loading}>
          {saving ? <Spinner size="sm" /> : 'Save menus'}
        </Button>
      </div>
    </Modal>
  )
}

export function MenuAssignButton({ user, onClick, disabled }) {
  if (user?.role === 'ADMIN') return null
  return (
    <button
      type="button"
      title="Assign menus"
      disabled={disabled}
      onClick={onClick}
      className="p-1.5 rounded text-[#8A8A8F] hover:text-[#0F766E] hover:bg-[#0F766E]/15 transition-colors disabled:opacity-50"
    >
      <LayoutGrid size={14} />
    </button>
  )
}
