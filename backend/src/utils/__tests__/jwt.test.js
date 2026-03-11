import { signToken, verifyToken, decodeToken, extractToken } from '../jwt.js'
import jwt from 'jsonwebtoken'

jest.mock('jsonwebtoken')

describe('JWT Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.JWT_SECRET = 'test-secret'
    process.env.JWT_EXPIRES_IN = '7d'
  })

  describe('signToken', () => {
    it('should sign a token with payload', () => {
      jwt.sign.mockReturnValue('token-xyz')

      const result = signToken({ id: 'user-1', email: 'test@example.com' })

      expect(result).toBe('token-xyz')
      expect(jwt.sign).toHaveBeenCalled()
    })

    it('should use correct payload', () => {
      jwt.sign.mockReturnValue('token')

      const payload = { id: 'user-123', email: 'user@example.com' }
      signToken(payload)

      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        expect.any(String),
        expect.any(Object)
      )
    })

    it('should use expiration time from env', () => {
      jwt.sign.mockReturnValue('token')

      signToken({ id: 'user-1' })

      const callArgs = jwt.sign.mock.calls[0]
      expect(callArgs[2]).toHaveProperty('expiresIn')
    })
  })

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const payload = { id: 'user-1' }
      jwt.verify.mockReturnValue(payload)

      const result = verifyToken('token-xyz')

      expect(result).toEqual(payload)
      expect(jwt.verify).toHaveBeenCalled()
    })

    it('should return null for invalid token', () => {
      jwt.verify.mockThrowValue(new Error('Invalid token'))

      const result = verifyToken('bad-token')

      expect(result).toBeNull()
    })

    it('should return null for expired token', () => {
      jwt.verify.mockThrowValue(new Error('Token expired'))

      const result = verifyToken('expired-token')

      expect(result).toBeNull()
    })

    it('should use correct secret', () => {
      jwt.verify.mockReturnValue({ id: 'user-1' })

      verifyToken('token')

      expect(jwt.verify).toHaveBeenCalledWith(
        'token',
        expect.any(String)
      )
    })
  })

  describe('decodeToken', () => {
    it('should decode a token without verification', () => {
      jwt.decode.mockReturnValue({ id: 'user-1' })

      const result = decodeToken('token-xyz')

      expect(result).toEqual({ id: 'user-1' })
      expect(jwt.decode).toHaveBeenCalledWith('token-xyz')
    })

    it('should return null for invalid token', () => {
      jwt.decode.mockThrowValue(new Error('Decode error'))

      const result = decodeToken('bad-token')

      expect(result).toBeNull()
    })

    it('should not verify signature', () => {
      jwt.decode.mockReturnValue({ id: 'user-1' })

      decodeToken('token')

      expect(jwt.decode).toHaveBeenCalled()
      expect(jwt.verify).not.toHaveBeenCalled()
    })
  })

  describe('extractToken', () => {
    it('should extract token from Bearer header', () => {
      const result = extractToken('Bearer token-xyz')

      expect(result).toBe('token-xyz')
    })

    it('should return null for missing Bearer prefix', () => {
      const result = extractToken('token-xyz')

      expect(result).toBeNull()
    })

    it('should return null for missing auth header', () => {
      const result = extractToken(null)

      expect(result).toBeNull()
    })

    it('should return null for empty string', () => {
      const result = extractToken('')

      expect(result).toBeNull()
    })

    it('should handle whitespace in bearer', () => {
      const result = extractToken('Bearer   token-with-spaces')

      expect(result).toBe('  token-with-spaces')
    })
  })
})
