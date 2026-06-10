import { prisma } from '../lib/prisma.js'

/**
 * Load the latest role from the database (JWT may be stale after role changes).
 */
export async function refreshUserRole(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true, email: true },
    })

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' })
    }

    req.user.role = user.role
    req.user.email = user.email
    next()
  } catch (error) {
    next(error)
  }
}
