/**
 * Restrict route to users with one of the given roles.
 * Must run after authenticateToken (req.user must be set).
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      })
    }
    next()
  }
}
