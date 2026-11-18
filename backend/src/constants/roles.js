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
      'All testing menus (core + tools). Owns Test Runs cycles and advanced suites; no admin/user settings.',
  },
  {
    key: 'USER',
    label: 'Tester',
    description:
      'Day-to-day QA: Scenarios, Manual/Automated runs, Test Runs, Environments, Reports, Analytics, Bugs.',
  },
  {
    key: 'VIEWER',
    label: 'Viewer',
    description:
      'Read-focused: Dashboard, Scenarios, Test Runs, Reports, Analytics, Bugs — follow progress without tools menus.',
  },
]

/**
 * Recommended menus per role (ADMIN is always all menus).
 *
 * USER  — core Manual QA path (no smoke/stress/security/chains…)
 * LEAD  — full testing surface including Tools
 * VIEWER — see cases/runs/reports; no Execution/Environments/Tools
 */
export const ROLE_MENU_PRESETS = {
  ADMIN: [...ALL_MENU_KEYS],
  LEAD: [...ALL_MENU_KEYS],
  USER: [...DEFAULT_USER_MENU_KEYS],
  VIEWER: ['dashboard', 'scenarios', 'test-runs', 'reports', 'analytics', 'issues'],
}

export const ROLE_MENU_SUMMARY = {
  ADMIN: 'All menus + Settings admin tabs',
  LEAD: 'All testing menus (Main + Tools) — runs, matrix, smoke/stress/security',
  USER: 'Dashboard, Scenarios, Test Runs, Execution, Environments, Reports, Analytics, Bugs',
  VIEWER: 'Dashboard, Scenarios, Test Runs, Reports, Analytics, Bugs (no Execution/Tools)',
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
