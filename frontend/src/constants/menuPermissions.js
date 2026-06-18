/** Sidebar menu keys — keep in sync with backend/src/constants/menuPermissions.js */

export const MENU_DEFINITIONS = [
  { key: 'dashboard', path: '/dashboard', group: 'main', labelId: 'Dashboard', labelEn: 'Dashboard' },
  { key: 'scenarios', path: '/scenarios', group: 'main', labelId: 'Skenario', labelEn: 'Scenarios' },
  { key: 'execution', path: '/execution', group: 'main', labelId: 'Eksekusi', labelEn: 'Execution' },
  { key: 'environments', path: '/environments', group: 'main', labelId: 'Environment', labelEn: 'Environments' },
  { key: 'reports', path: '/reports', group: 'main', labelId: 'Laporan', labelEn: 'Reports' },
  { key: 'analytics', path: '/analytics', group: 'main', labelId: 'Analytics', labelEn: 'Analytics' },
  { key: 'visual-regression', path: '/visual-regression', group: 'tools', labelId: 'Visual Regression', labelEn: 'Visual Regression' },
  { key: 'chains', path: '/chains', group: 'tools', labelId: 'Chains', labelEn: 'Chains' },
  { key: 'api-testing', path: '/api-testing', group: 'tools', labelId: 'API Testing', labelEn: 'API Testing' },
  { key: 'scheduler', path: '/scheduler', group: 'tools', labelId: 'Scheduler', labelEn: 'Scheduler' },
  { key: 'parallel', path: '/parallel', group: 'tools', labelId: 'Parallel', labelEn: 'Parallel' },
  { key: 'smoke-test', path: '/smoke-test', group: 'tools', labelId: 'Smoke Test', labelEn: 'Smoke Test' },
  { key: 'stress-test', path: '/stress-test', group: 'tools', labelId: 'Stress Test', labelEn: 'Stress Test' },
  { key: 'security-test', path: '/security-test', group: 'tools', labelId: 'Security Test', labelEn: 'Security Test' },
  { key: 'browser-matrix', path: '/browser-matrix', group: 'tools', labelId: 'Browser Test', labelEn: 'Browser Test' },
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

export function resolveUserMenuKeys(user) {
  if (!user) return []
  if (user.role === 'ADMIN') return ALL_MENU_KEYS
  const assigned = Array.isArray(user.menuPermissions) ? user.menuPermissions : []
  if (assigned.length === 0) return DEFAULT_USER_MENU_KEYS
  return assigned.filter((key) => ALL_MENU_KEYS.includes(key))
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

export function menuLabel(def, lang = 'en') {
  return lang === 'id' ? def.labelId : def.labelEn
}
