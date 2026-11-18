import { ALL_MENU_KEYS, DEFAULT_USER_MENU_KEYS } from './menuPermissions.js'

/** Platform roles — keep in sync with frontend/src/constants/roles.js */
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

/** Recommended menus per role (ADMIN is always all menus). */
export const ROLE_MENU_PRESETS = {
  ADMIN: [...ALL_MENU_KEYS],
  LEAD: [...ALL_MENU_KEYS],
  USER: [...DEFAULT_USER_MENU_KEYS],
  VIEWER: ['dashboard', 'reports', 'analytics', 'issues'],
}

export function isAssignableRole(role) {
  return ASSIGNABLE_ROLES.includes(role)
}

export function isAdminRole(role) {
  return role === 'ADMIN'
}

export function getRoleMenuPreset(role) {
  if (role === 'ADMIN') return [...ALL_MENU_KEYS]
  return ROLE_MENU_PRESETS[role] ? [...ROLE_MENU_PRESETS[role]] : [...DEFAULT_USER_MENU_KEYS]
}
