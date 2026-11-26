import { ALL_MENU_KEYS, DEFAULT_USER_MENU_KEYS } from './menuPermissions.js'

/** Platform roles — keep in sync with frontend/src/constants/roles.js */
export const ASSIGNABLE_ROLES = ['ADMIN', 'LEAD', 'USER', 'VIEWER']

export const NON_ADMIN_ROLES = ['LEAD', 'USER', 'VIEWER']

export const ROLE_DEFINITIONS = [
  {
    key: 'ADMIN',
    label: 'Admin',
    description:
      'Full platform access: all menus, plus Admin (/admin) for users, menus, integrations.',
  },
  {
    key: 'LEAD',
    label: 'QA Lead',
    description:
      'Manual QA lead: Cases, Test Runs, Reports, Bugs, Environments. Advanced Tools stay Admin-only.',
  },
  {
    key: 'USER',
    label: 'Tester',
    description:
      'Day-to-day Manual QA: Cases, Test Runs, Reports, Bugs.',
  },
  {
    key: 'VIEWER',
    label: 'Viewer',
    description:
      'Read-focused: Dashboard, Cases, Test Runs, Reports, Bugs — follow progress without Tools.',
  },
]

/** LEAD = Manual QA core + Environments (Tools suites remain ADMIN-only in routes). */
const LEAD_MENU_KEYS = [...DEFAULT_USER_MENU_KEYS, 'environments']

/**
 * Recommended menus per role (ADMIN is always all menus).
 *
 * USER  — core Manual QA path
 * LEAD  — Manual QA + Environments (advanced Tools = ADMIN)
 * VIEWER — see cases/runs/reports
 */
export const ROLE_MENU_PRESETS = {
  ADMIN: [...ALL_MENU_KEYS],
  LEAD: [...LEAD_MENU_KEYS],
  USER: [...DEFAULT_USER_MENU_KEYS],
  VIEWER: ['dashboard', 'scenarios', 'test-runs', 'reports', 'issues'],
}

export const ROLE_MENU_SUMMARY = {
  ADMIN: 'All menus + Admin (/admin)',
  LEAD: 'Dashboard, Cases, Test Runs, Reports, Bugs, Environments',
  USER: 'Dashboard, Cases, Test Runs, Reports, Bugs',
  VIEWER: 'Dashboard, Cases, Test Runs, Reports, Bugs (no Tools)',
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
