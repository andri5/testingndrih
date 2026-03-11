import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

/**
 * Sign a JWT token
 */
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  })
}

/**
 * Verify a JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

/**
 * Decode a JWT token without validation
 */
export function decodeToken(token) {
  try {
    return jwt.decode(token)
  } catch (error) {
    return null
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}
