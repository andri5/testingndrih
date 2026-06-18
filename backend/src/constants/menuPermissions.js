/** Sidebar menu keys — keep in sync with frontend/src/constants/menuPermissions.js */

export const MENU_DEFINITIONS = [
  { key: 'dashboard', path: '/dashboard', group: 'main', label: 'Dashboard' },
  { key: 'scenarios', path: '/scenarios', group: 'main', label: 'Scenarios' },
  { key: 'execution', path: '/execution', group: 'main', label: 'Execution' },
  { key: 'environments', path: '/environments', group: 'main', label: 'Environments' },
  { key: 'reports', path: '/reports', group: 'main', label: 'Reports' },
  { key: 'analytics', path: '/analytics', group: 'main', label: 'Analytics' },
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

export const DEFAULT_USER_MENU_KEYS = [
  'dashboard',
  'scenarios',
  'execution',
  'environments',
  'reports',
  'analytics',
]

const PATH_BY_KEY = Object.fromEntries(MENU_DEFINITIONS.map((m) => [m.key, m.path]))
const KEY_BY_PATH = Object.fromEntries(MENU_DEFINITIONS.map((m) => [m.path, m.key]))

export function isValidMenuKey(key) {
  return ALL_MENU_KEYS.includes(key)
}

export function resolveUserMenuKeys(user) {
  if (!user) return []
  if (user.role === 'ADMIN') return ALL_MENU_KEYS
  const assigned = Array.isArray(user.menuPermissions) ? user.menuPermissions : []
  if (assigned.length === 0) return DEFAULT_USER_MENU_KEYS
  return assigned.filter((key) => isValidMenuKey(key))
}

export function resolveUserMenuPaths(user) {
  return resolveUserMenuKeys(user).map((key) => PATH_BY_KEY[key]).filter(Boolean)
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
