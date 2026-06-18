import { extractToken, verifyToken } from '../utils/jwt.js'
import { prisma } from '../lib/prisma.js'

/**
 * Middleware to authenticate JWT token from Authorization header
 */
export async function authenticateToken(req, res, next) {
  const token = extractToken(req.headers.authorization)

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No authentication token provided'
    })
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isActive: true },
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      })
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_INACTIVE',
        message: 'Your account has been deactivated. Contact an administrator.',
      })
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    }
    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Optional middleware - does not fail if token is missing, but will set req.user if valid
 */
export function optionalAuth(req, res, next) {
  const token = extractToken(req.headers.authorization)

  if (token) {
    const decoded = verifyToken(token)
    if (decoded) {
      req.user = decoded
    }
  }

  next()
}

/**
 * Error handling middleware
 */
export function errorHandler(err, req, res, next) {
  console.error('Error:', err.message)

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    })
  }

  const status = err.status || 500
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
    code: err.code || undefined,
  })
}
