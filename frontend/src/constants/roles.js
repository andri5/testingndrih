import { ALL_MENU_KEYS, DEFAULT_USER_MENU_KEYS } from './menuPermissions'

/** Platform roles — keep in sync with backend/src/constants/roles.js */
export const ASSIGNABLE_ROLES = ['ADMIN', 'LEAD', 'USER', 'VIEWER']

export const NON_ADMIN_ROLES = ['LEAD', 'USER', 'VIEWER']

export const ROLE_DEFINITIONS = [
  {
    key: 'ADMIN',
    label: 'Admin',
    description:
      'Full platform access: all menus, user management, integrations, and settings.',
  },
  {
    key: 'LEAD',
    label: 'QA Lead',
    description:
      'All testing menus (core + tools). Can run advanced suites; no admin/user settings.',
  },
  {
    key: 'USER',
    label: 'Tester',
    description:
      'Day-to-day testing: scenarios, execution, environments, reports, analytics, bugs.',
  },
  {
    key: 'VIEWER',
    label: 'Viewer',
    description:
      'Read-focused: dashboard, reports, analytics, and bugs. No create/run tools.',
  },
]

export const ROLE_MENU_PRESETS = {
  ADMIN: [...ALL_MENU_KEYS],
  LEAD: [...ALL_MENU_KEYS],
  USER: [...DEFAULT_USER_MENU_KEYS],
  VIEWER: ['dashboard', 'reports', 'analytics', 'issues'],
}

export function getRoleMenuPreset(role) {
  if (role === 'ADMIN') return [...ALL_MENU_KEYS]
  return ROLE_MENU_PRESETS[role]
    ? [...ROLE_MENU_PRESETS[role]]
    : [...DEFAULT_USER_MENU_KEYS]
}

export function roleLabel(role) {
  return ROLE_DEFINITIONS.find((r) => r.key === role)?.label || role
}

export function roleBadgeClass(role) {
  if (role === 'ADMIN') return 'bg-brand-soft text-brand'
  if (role === 'LEAD') return 'bg-[#0F766E]/15 text-[#5EEAD4] border border-[#0F766E]/25'
  if (role === 'VIEWER') return 'bg-[#2D2D2F] text-[#A0A0A4] border border-[#3D3D3F]'
  return 'bg-surface-muted text-ink-muted'
}
