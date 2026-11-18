export function getPrimaryAdminEmail() {
  return (
    process.env.ADMIN_EMAIL || 'faizalandri04@gmail.com'
  )
    .trim()
    .toLowerCase()
}

/** @deprecated Prefer getPrimaryAdminEmail() so env updates apply at runtime */
export const PRIMARY_ADMIN_EMAIL = getPrimaryAdminEmail()

export function normalizeEmail(email) {
  return (email || '').trim().toLowerCase()
}

export function resolveRoleForEmail(email) {
  return normalizeEmail(email) === getPrimaryAdminEmail() ? 'ADMIN' : 'USER'
}

export function isPrimaryAdmin(email) {
  return normalizeEmail(email) === getPrimaryAdminEmail()
}
