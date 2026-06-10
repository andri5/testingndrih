import {
  registerUser,
  loginUser,
  getCurrentUser,
  forgotPassword,
  validateResetToken,
  resetPassword
} from '../authController.js'
import { hashPassword, comparePassword } from '../../utils/password.js'
import { signToken } from '../../utils/jwt.js'
import { sendPasswordResetEmail } from '../../services/emailService.js'
import { prisma } from '../../lib/prisma.js'

// Mock dependencies
jest.mock('../../lib/prisma.js')
jest.mock('../../utils/password.js')
jest.mock('../../utils/jwt.js')
jest.mock('../../services/emailService.js')
jest.mock('../../utils/turnstile.js', () => ({
  verifyTurnstileToken: jest.fn().mockResolvedValue({ ok: true, skipped: true }),
}))

describe('AuthController', () => {
  let mockRes, mockReq, mockNext

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    }

    // Mock request object
    mockReq = {
      body: {},
      user: {},
      params: {},
      headers: {},
    }

    // Mock next middleware
    mockNext = jest.fn()

    // Setup default mocks for prisma methods
    prisma.user = {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  })

  describe('registerUser', () => {
    it('should return 400 if email or password is missing', async () => {
      mockReq.body = { name: 'Test User', email: '', password: '' }

      await registerUser(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('required')
        })
      )
    })

    it('should return 400 if name is invalid', async () => {
      mockReq.body = { name: 'User123', email: 'test@example.com', password: 'ValidPass123!' }

      await registerUser(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('letters and spaces')
        })
      )
    })

    it('should return 400 if password does not meet OWASP requirements', async () => {
      mockReq.body = { name: 'Test User', email: 'test@example.com', password: 'weak' }

      await registerUser(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Password')
        })
      )
    })

    it('should return 409 if user already exists', async () => {
      mockReq.body = { name: 'Existing User', email: 'existing@example.com', password: 'ValidPass123!' }
      prisma.user.findUnique.mockResolvedValue({ id: '1', email: 'existing@example.com' })

      await registerUser(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(409)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'User already exists'
        })
      )
    })

    it('should successfully register a new user', async () => {
      const email = 'newuser@example.com'
      const password = 'ValidPass123!'
      const hashedPassword = 'hashed_password_123'

      mockReq.body = { email, password, name: 'New User' }

      prisma.user.findUnique.mockResolvedValue(null)
      hashPassword.mockResolvedValue(hashedPassword)
      prisma.user.create.mockResolvedValue({
        id: '123',
        email,
        name: 'New User',
        createdAt: new Date()
      })
      signToken.mockReturnValue('jwt_token_xyz')

      await registerUser(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User registered successfully',
          token: 'jwt_token_xyz'
        })
      )
      expect(hashPassword).toHaveBeenCalledWith(password)
      expect(signToken).toHaveBeenCalled()
    })
  })

  describe('loginUser', () => {
    it('should return 400 if email or password is missing', async () => {
      mockReq.body = { email: '', password: '' }

      await loginUser(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('should return 404 if user not found', async () => {
      mockReq.body = { email: 'nonexistent@example.com', password: 'Password123!' }
      prisma.user.findUnique.mockResolvedValue(null)

      await loginUser(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'ACCOUNT_NOT_FOUND',
          message: expect.stringContaining('register'),
        })
      )
    })

    it('should return 401 if password is invalid', async () => {
      mockReq.body = { email: 'user@example.com', password: 'WrongPassword123!' }

      prisma.user.findUnique.mockResolvedValue({
        id: '123',
        email: 'user@example.com',
        password: 'hashed_password'
      })
      comparePassword.mockResolvedValue(false)

      await loginUser(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(comparePassword).toHaveBeenCalledWith('WrongPassword123!', 'hashed_password')
    })

    it('should successfully login a user', async () => {
      const email = 'user@example.com'
      const password = 'ValidPass123!'

      mockReq.body = { email, password }

      prisma.user.findUnique.mockResolvedValue({
        id: '123',
        email,
        name: 'Test User',
        password: 'hashed_password',
        createdAt: new Date()
      })
      comparePassword.mockResolvedValue(true)
      signToken.mockReturnValue('jwt_token_xyz')

      await loginUser(mockReq, mockRes, mockNext)

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'user@example.com' }
      })
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Login successful',
          token: 'jwt_token_xyz',
          user: expect.objectContaining({
            id: '123',
            email
          })
        })
      )
    })
  })

  describe('getCurrentUser', () => {
    it('should return user data for authenticated user', async () => {
      mockReq.user = { id: '123' }

      prisma.user.findUnique.mockResolvedValue({
        id: '123',
        email: 'user@example.com',
        name: 'Test User',
        createdAt: new Date()
      })

      await getCurrentUser(mockReq, mockRes, mockNext)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          user: expect.objectContaining({
            id: '123',
            email: 'user@example.com'
          })
        })
      )
    })

    it('should return 404 if user not found', async () => {
      mockReq.user = { id: 'nonexistent' }
      prisma.user.findUnique.mockResolvedValue(null)

      await getCurrentUser(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(404)
    })
  })

  describe('forgotPassword', () => {
    it('should return 400 if email is missing', async () => {
      mockReq.body = { email: '' }

      await forgotPassword(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('should return 404 if user does not exist', async () => {
      mockReq.body = { email: 'nonexistent@example.com' }
      prisma.user.findUnique.mockResolvedValue(null)

      await forgotPassword(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'ACCOUNT_NOT_FOUND',
          message: expect.stringContaining('register'),
        })
      )
    })

    it('should send password reset email for valid user', async () => {
      mockReq.body = { email: 'user@example.com' }
      process.env.NODE_ENV = 'development'

      prisma.user.findUnique.mockResolvedValue({
        id: '123',
        email: 'user@example.com'
      })
      prisma.user.update.mockResolvedValue({ id: '123' })
      sendPasswordResetEmail.mockResolvedValue({ success: true })

      await forgotPassword(mockReq, mockRes, mockNext)

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '123' }
        })
      )
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      )
    })
  })

  describe('validateResetToken', () => {
    it('should return 400 if token is missing', async () => {
      mockReq.params = { token: '' }

      await validateResetToken(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('should return 400 for invalid or expired token', async () => {
      mockReq.params = { token: 'invalid_token' }
      prisma.user.findFirst.mockResolvedValue(null)

      await validateResetToken(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid or expired reset token'
        })
      )
    })

    it('should validate a valid reset token', async () => {
      mockReq.params = { token: 'valid_token' }
      prisma.user.findFirst.mockResolvedValue({
        id: '123',
        email: 'user@example.com'
      })

      await validateResetToken(mockReq, mockRes, mockNext)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Token is valid',
          email: 'user@example.com'
        })
      )
    })
  })

  describe('resetPassword', () => {
    it('should return 400 if token is missing', async () => {
      mockReq.params = { token: '' }
      mockReq.body = { password: 'NewPass123!', passwordConfirm: 'NewPass123!' }

      await resetPassword(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('should return 400 if passwords do not match', async () => {
      mockReq.params = { token: 'token123' }
      mockReq.body = { password: 'NewPass123!', passwordConfirm: 'DifferentPass123!' }

      await resetPassword(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Passwords do not match'
        })
      )
    })

    it('should reset password for valid token', async () => {
      mockReq.params = { token: 'valid_token' }
      mockReq.body = { password: 'NewPass123!', passwordConfirm: 'NewPass123!' }

      prisma.user.findFirst.mockResolvedValue({
        id: '123',
        email: 'user@example.com'
      })
      hashPassword.mockResolvedValue('new_hashed_password')
      prisma.user.update.mockResolvedValue({ id: '123' })

      await resetPassword(mockReq, mockRes, mockNext)

      expect(hashPassword).toHaveBeenCalledWith('NewPass123!')
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '123' }
        })
      )
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('Password reset successfully')
        })
      )
    })
  })
})
