import { useCallback, useEffect, useState } from 'react'
import { LayoutGrid, Save, RotateCcw } from 'lucide-react'
import { Button, Spinner, Alert } from './ui'
import { userAPI } from '../services/api'
import {
  MENU_DEFINITIONS,
  DEFAULT_USER_MENU_KEYS,
  ALL_MENU_KEYS,
  menuLabel,
} from '../constants/menuPermissions'
import {
  ROLE_DEFINITIONS,
  ROLE_MENU_PRESETS,
  ROLE_MENU_SUMMARY,
  getRoleMenuPreset,
} from '../constants/roles'

function MenuToggleRow({ def, checked, onToggle }) {
  return (
    <label className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg hover:bg-[#0F0E11] cursor-pointer border border-transparent hover:border-[#2D2D2F]">
      <div className="min-w-0">
        <p className="text-sm text-[#E0E0E2] font-medium truncate">{menuLabel(def, 'en')}</p>
        <p className="text-xs text-[#666] font-mono truncate">{def.path}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={(e) => {
          e.preventDefault()
          onToggle(def.key)
        }}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-[#0F766E]' : 'bg-[#2D2D2F]'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  )
}

export default function AdminMenuAccess() {
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [syncUsers, setSyncUsers] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await userAPI.getMenuDefaults()
      const menus = res.data.menus?.length
        ? res.data.menus
        : [...ALL_MENU_KEYS]
      setSelected(menus)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load menu settings')
      setSelected([...ALL_MENU_KEYS])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const toggle = (key) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
    setSuccess(null)
  }

  const handleSave = async () => {
    if (selected.length === 0) {
      setError('Enable at least one menu for non-admin accounts')
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await userAPI.updateMenuDefaults(selected, syncUsers)
      setSelected(res.data.menus)
      setSuccess(res.data.message || 'Saved')
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save menu access')
    } finally {
      setSaving(false)
    }
  }

  const mainMenus = MENU_DEFINITIONS.filter((m) => m.group === 'main')
  const toolMenus = MENU_DEFINITIONS.filter((m) => m.group === 'tools')
  const nonAdminRoles = ROLE_DEFINITIONS.filter((r) => r.key !== 'ADMIN')

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#0F766E]/15 flex items-center justify-center shrink-0">
          <LayoutGrid className="w-4 h-4 text-[#0F766E]" />
        </div>
        <div>
          <p className="text-sm text-[#E0E0E2] font-medium">Global menu catalog</p>
          <p className="text-xs text-[#666] mt-0.5">
            Ceiling for LEAD / Tester / Viewer. Role presets apply within this catalog when you
            create users or change roles. Per-user overrides live in the Users tab.
          </p>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      <div className="rounded-xl border border-[#2D2D2F] bg-[#0F0E11] p-4 space-y-3">
        <p className="text-xs font-semibold text-[#A0A0A4] uppercase tracking-wider">
          Recommended roles
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          {nonAdminRoles.map((role) => {
            const preset = ROLE_MENU_PRESETS[role.key] || []
            return (
              <div
                key={role.key}
                className="rounded-lg border border-[#2D2D2F] bg-[#1A1A1C] p-3 flex flex-col gap-2"
              >
                <div>
                  <p className="text-sm font-medium text-[#E0E0E2]">{role.label}</p>
                  <p className="text-[11px] text-[#666] mt-1 leading-relaxed">{role.description}</p>
                  <p className="text-[11px] text-[#0F766E] mt-2">
                    {ROLE_MENU_SUMMARY[role.key] || `${preset.length} menus`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(getRoleMenuPreset(role.key))
                    setSuccess(null)
                  }}
                  className="mt-auto text-xs px-2.5 py-1.5 rounded border border-[#2D2D2F] text-[#A0A0A4] hover:border-[#0F766E] hover:text-[#0F766E] transition"
                >
                  Use as catalog
                </button>
              </div>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => {
            setSelected([...ALL_MENU_KEYS])
            setSuccess(null)
          }}
          className="text-xs px-2.5 py-1.5 rounded border border-[#2D2D2F] text-[#A0A0A4] hover:border-[#0F766E] hover:text-[#0F766E]"
        >
          Unlock all menus in catalog (needed for QA Lead tools)
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#A0A0A4] uppercase tracking-wider px-1 mb-2">
            Main
          </p>
          {mainMenus.map((def) => (
            <MenuToggleRow
              key={def.key}
              def={def}
              checked={selected.includes(def.key)}
              onToggle={toggle}
            />
          ))}
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#A0A0A4] uppercase tracking-wider px-1 mb-2">
            Tools
          </p>
          {toolMenus.map((def) => (
            <MenuToggleRow
              key={def.key}
              def={def}
              checked={selected.includes(def.key)}
              onToggle={toggle}
            />
          ))}
        </div>
      </div>

      <label className="flex items-start gap-2.5 cursor-pointer py-1">
        <input
          type="checkbox"
          checked={syncUsers}
          onChange={(e) => setSyncUsers(e.target.checked)}
          className="mt-0.5 rounded border-[#2D2D2F] bg-[#0F0E11] text-[#0F766E] focus:ring-[#0F766E]"
        />
        <span className="text-xs text-[#A0A0A4]">
          Also re-apply each non-admin user&apos;s role preset (LEAD / Tester / Viewer) against this
          catalog.
        </span>
      </label>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2"
        >
          {saving ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
          Save menu access
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setSelected([...DEFAULT_USER_MENU_KEYS])
            setSuccess(null)
          }}
          className="inline-flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to Tester defaults
        </Button>
      </div>
    </div>
  )
}
