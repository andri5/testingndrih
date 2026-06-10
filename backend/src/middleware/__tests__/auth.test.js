import { authenticateToken, optionalAuth, errorHandler } from '../auth.js'
import * as jwtUtils from '../../utils/jwt.js'
import { prisma } from '../../lib/prisma.js'

jest.mock('../../utils/jwt.js')
jest.mock('../../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}))

describe('Auth Middleware', () => {
  let req, res, next

  beforeEach(() => {
    req = {
      headers: {}
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    }
    next = jest.fn()
    jest.clearAllMocks()
  })

  describe('authenticateToken', () => {
    it('should authenticate with valid token', async () => {
      const decoded = { id: 'user-1', email: 'test@example.com', role: 'USER' }
      req.headers.authorization = 'Bearer token-xyz'

      jwtUtils.extractToken.mockReturnValue('token-xyz')
      jwtUtils.verifyToken.mockReturnValue(decoded)
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        role: 'USER',
        isActive: true,
      })

      await authenticateToken(req, res, next)

      expect(req.user).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        role: 'USER',
      })
      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })

    it('should reject inactive accounts', async () => {
      req.headers.authorization = 'Bearer token-xyz'
      jwtUtils.extractToken.mockReturnValue('token-xyz')
      jwtUtils.verifyToken.mockReturnValue({ id: 'user-1' })
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        role: 'USER',
        isActive: false,
      })

      await authenticateToken(req, res, next)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json.mock.calls[0][0].code).toBe('ACCOUNT_INACTIVE')
      expect(next).not.toHaveBeenCalled()
    })

    it('should reject missing token', async () => {
      req.headers.authorization = undefined

      jwtUtils.extractToken.mockReturnValue(null)

      await authenticateToken(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      const response = res.json.mock.calls[0][0]
      expect(response.success).toBe(false)
      expect(next).not.toHaveBeenCalled()
    })

    it('should reject invalid token', async () => {
      req.headers.authorization = 'Bearer invalid-token'

      jwtUtils.extractToken.mockReturnValue('invalid-token')
      jwtUtils.verifyToken.mockReturnValue(null)

      await authenticateToken(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      const response = res.json.mock.calls[0][0]
      expect(response.message).toContain('Invalid')
    })

    it('should extract token from header', async () => {
      req.headers.authorization = 'Bearer my-token'

      jwtUtils.extractToken.mockReturnValue('my-token')
      jwtUtils.verifyToken.mockReturnValue({ id: 'user-1' })
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        role: 'USER',
        isActive: true,
      })

      await authenticateToken(req, res, next)

      expect(jwtUtils.extractToken).toHaveBeenCalledWith('Bearer my-token')
    })
  })

  describe('optionalAuth', () => {
    it('should set user if valid token provided', () => {
      const decoded = { id: 'user-1' }
      req.headers.authorization = 'Bearer token-xyz'

      jwtUtils.extractToken.mockReturnValue('token-xyz')
      jwtUtils.verifyToken.mockReturnValue(decoded)

      optionalAuth(req, res, next)

      expect(req.user).toEqual(decoded)
      expect(next).toHaveBeenCalled()
    })

    it('should continue without token', () => {
      req.headers.authorization = undefined

      jwtUtils.extractToken.mockReturnValue(null)

      optionalAuth(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(req.user).toBeUndefined()
    })

    it('should not fail with invalid token', () => {
      req.headers.authorization = 'Bearer bad-token'

      jwtUtils.extractToken.mockReturnValue('bad-token')
      jwtUtils.verifyToken.mockReturnValue(null)

      optionalAuth(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(req.user).toBeUndefined()
    })

    it('should always call next', () => {
      jwtUtils.extractToken.mockReturnValue(null)

      optionalAuth(req, res, next)

      expect(next).toHaveBeenCalled()
    })
  })

  describe('errorHandler', () => {
    it('should handle JsonWebTokenError', () => {
      const error = new Error('Invalid token')
      error.name = 'JsonWebTokenError'

      errorHandler(error, req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      const response = res.json.mock.calls[0][0]
      expect(response.message).toContain('Invalid token')
    })

    it('should handle TokenExpiredError', () => {
      const error = new Error('Expired')
      error.name = 'TokenExpiredError'

      errorHandler(error, req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      const response = res.json.mock.calls[0][0]
      expect(response.message).toContain('expired')
    })

    it('should handle generic errors with status', () => {
      const error = new Error('Custom error')
      error.status = 403

      errorHandler(error, req, res, next)

      expect(res.status).toHaveBeenCalledWith(403)
    })

    it('should default to 500 status for unknown errors', () => {
      const error = new Error('Unknown error')

      errorHandler(error, req, res, next)

      expect(res.status).toHaveBeenCalledWith(500)
    })

    it('should always return success: false', () => {
      const error = new Error('Test error')

      errorHandler(error, req, res, next)

      const response = res.json.mock.calls[0][0]
      expect(response.success).toBe(false)
    })
  })
})
