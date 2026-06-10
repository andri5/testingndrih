import { prisma } from '../lib/prisma.js'

/**
 * Load the latest role from the database (JWT may be stale after role changes).
 */
export async function refreshUserRole(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true, email: true, isActive: true },
    })

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' })
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_INACTIVE',
        message: 'Your account has been deactivated. Contact an administrator.',
      })
    }

    req.user.role = user.role
    req.user.email = user.email
    next()
  } catch (error) {
    next(error)
  }
}
