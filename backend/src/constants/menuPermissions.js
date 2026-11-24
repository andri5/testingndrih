/** Sidebar menu keys — keep in sync with frontend/src/constants/menuPermissions.js */

export const MENU_DEFINITIONS = [
  { key: 'dashboard', path: '/dashboard', group: 'main', label: 'Dashboard' },
  { key: 'scenarios', path: '/scenarios', group: 'main', label: 'Cases' },
  { key: 'test-runs', path: '/test-runs', group: 'main', label: 'Test Runs' },
  { key: 'execution', path: '/execution', group: 'main', label: 'Execution' },
  { key: 'reports', path: '/reports', group: 'main', label: 'Reports' },
  { key: 'analytics', path: '/analytics', group: 'main', label: 'Analytics' },
  { key: 'issues', path: '/issues', group: 'main', label: 'Bugs' },
  { key: 'environments', path: '/environments', group: 'tools', label: 'Environments' },
  { key: 'visual-regression', path: '/visual-regression', group: 'tools', label: 'Visual Regression' },
  { key: 'chains', path: '/chains', group: 'tools', label: 'Chains' },
  { key: 'api-testing', path: '/api-testing', group: 'tools', label: 'API Testing' },
  { key: 'scheduler', path: '/scheduler', group: 'tools', label: 'Scheduler' },
  { key: 'parallel', path: '/parallel', group: 'tools', label: 'Parallel' },
  { key: 'smoke-test', path: '/smoke-test', group: 'tools', label: 'Smoke Test' },
  { key: 'stress-test', path: '/stress-test', group: 'tools', label: 'Stress Test' },
  { key: 'security-test', path: '/security-test', group: 'tools', label: 'Security Test' },
  { key: 'browser-matrix', path: '/browser-matrix', group: 'tools', label: 'Browser Test' },
]

export const ALL_MENU_KEYS = MENU_DEFINITIONS.map((m) => m.key)

/** Temporarily hidden from product UI (definition kept for later). */
export const HIDDEN_MENU_KEYS = ['analytics', 'execution']

/** Manual QA core path — Tools stay for ADMIN/LEAD */
export const DEFAULT_USER_MENU_KEYS = [
  'dashboard',
  'scenarios',
  'test-runs',
  'reports',
  'issues',
]

const PATH_BY_KEY = Object.fromEntries(MENU_DEFINITIONS.map((m) => [m.key, m.path]))
const KEY_BY_PATH = Object.fromEntries(MENU_DEFINITIONS.map((m) => [m.path, m.key]))

export function isValidMenuKey(key) {
  return ALL_MENU_KEYS.includes(key)
}

// Local fallbacks to avoid circular import with roles.js
const ROLE_FALLBACK_BY_ROLE = {
  LEAD: ALL_MENU_KEYS,
  USER: DEFAULT_USER_MENU_KEYS,
  VIEWER: ['dashboard', 'scenarios', 'test-runs', 'reports', 'issues'],
}

/**
 * @param {object} user
 * @param {string[]|null} [enabledMenus] global catalog allowed for non-admin roles
 * @param {string[]|null} [rolePreset] recommended menus for the user's role
 */
export function resolveUserMenuKeys(user, enabledMenus = null, rolePreset = null) {
  if (!user) return []
  const visibleKeys = ALL_MENU_KEYS.filter((key) => !HIDDEN_MENU_KEYS.includes(key))
  if (user.role === 'ADMIN') return visibleKeys
  const catalog = Array.isArray(enabledMenus) && enabledMenus.length > 0
    ? enabledMenus.filter((key) => visibleKeys.includes(key))
    : visibleKeys
  const preset = Array.isArray(rolePreset) && rolePreset.length > 0
    ? rolePreset.filter((key) => visibleKeys.includes(key))
    : (ROLE_FALLBACK_BY_ROLE[user.role] || DEFAULT_USER_MENU_KEYS).filter(
        (key) => !HIDDEN_MENU_KEYS.includes(key)
      )
  const assigned = Array.isArray(user.menuPermissions) ? user.menuPermissions : []
  const base = assigned.length === 0
    ? preset
    : assigned.filter((key) => visibleKeys.includes(key))
  return base.filter((key) => catalog.includes(key) && !HIDDEN_MENU_KEYS.includes(key))
}

export function resolveUserMenuPaths(user, enabledMenus = null) {
  return resolveUserMenuKeys(user, enabledMenus).map((key) => PATH_BY_KEY[key]).filter(Boolean)
}

export function pathToMenuKey(pathname) {
  const base = (pathname || '').split('?')[0]
  const match = MENU_DEFINITIONS.find(
    (m) => base === m.path || base.startsWith(`${m.path}/`)
  )
  return match?.key || null
}

export function menuKeyToPath(key) {
  return PATH_BY_KEY[key] || null
}

export function validateMenuKeys(keys) {
  if (!Array.isArray(keys)) return { valid: false, message: 'menus must be an array' }
  const invalid = keys.filter((k) => !isValidMenuKey(k))
  if (invalid.length) {
    return { valid: false, message: `Invalid menu keys: ${invalid.join(', ')}` }
  }
  if (keys.length === 0) {
    return { valid: false, message: 'Select at least one menu for the user' }
  }
  return { valid: true, keys: [...new Set(keys)] }
}

export { KEY_BY_PATH }
