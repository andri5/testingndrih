import { extractToken } from '../utils/jwt.js'
import { verifyToken } from '../utils/jwt.js'
import { resolveUserFromApiToken } from '../services/apiTokenService.js'

/**
 * Authenticate via JWT or API token (tsn_...)
 */
export async function authenticateTokenOrApiKey(req, res, next) {
  const token = extractToken(req.headers.authorization)
  if (!token) {
    return res.status(401).json({ success: false, message: 'No authentication token provided' })
  }

  if (token.startsWith('tsn_')) {
    const user = await resolveUserFromApiToken(token)
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid or expired API token' })
    }
    req.user = user
    req.authMethod = 'api_token'
    return next()
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
  req.user = decoded
  req.authMethod = 'jwt'
  next()
}
