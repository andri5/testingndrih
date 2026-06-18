/** Routes restricted to ADMIN role (Option A — strict). */
export const ADMIN_ROUTE_PATHS = [
  '/chains',
  '/api-testing',
  '/scheduler',
  '/parallel',
  '/smoke-test',
  '/stress-test',
  '/security-test',
  '/browser-matrix',
  '/visual-regression',
  '/help/smoke-test',
  '/help/stress-test',
  '/help/security-test',
]

export function isAdminPath(pathname) {
  return ADMIN_ROUTE_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )
}
