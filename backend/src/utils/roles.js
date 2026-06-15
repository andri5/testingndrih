export const PRIMARY_ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL || 'admin@testingndrih.local'
).trim().toLowerCase()

export function normalizeEmail(email) {
  return (email || '').trim().toLowerCase()
}

export function resolveRoleForEmail(email) {
  return normalizeEmail(email) === PRIMARY_ADMIN_EMAIL ? 'ADMIN' : 'USER'
}

export function isPrimaryAdmin(email) {
  return normalizeEmail(email) === PRIMARY_ADMIN_EMAIL
}
