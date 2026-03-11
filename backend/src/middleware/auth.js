import { extractToken, verifyToken } from '../utils/jwt.js'

/**
 * Middleware to authenticate JWT token from Authorization header
 */
export function authenticateToken(req, res, next) {
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

  req.user = decoded
  next()
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

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  })
}
