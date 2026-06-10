import crypto from 'crypto'
import { hashPassword, comparePassword } from '../utils/password.js'
import { signToken } from '../utils/jwt.js'
import { sendPasswordResetEmail } from '../services/emailService.js'
import { prisma } from '../lib/prisma.js'
import { validateRegistrationEmail, validateRegistrationName } from '../utils/registerValidation.js'
import { verifyTurnstileToken } from '../utils/turnstile.js'

async function assertCaptcha(req, res) {
  const captcha = await verifyTurnstileToken(
    req.body.captchaToken,
    req.ip || req.headers?.['x-forwarded-for']
  )
  if (!captcha.ok) {
    res.status(400).json({ success: false, message: captcha.message })
    return false
  }
  return true
}

/**
 * Register a new user
 * POST /api/auth/register
 * Body: { email, password, name }
 */
export async function registerUser(req, res, next) {
  try {
    const { email, password, name } = req.body

    if (!(await assertCaptcha(req, res))) return

    const nameError = validateRegistrationName(name)
    if (nameError) {
      return res.status(400).json({ success: false, message: nameError })
    }

    const emailError = validateRegistrationEmail(email)
    if (emailError) {
      return res.status(400).json({ success: false, message: emailError })
    }

    // Validation
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      })
    }

    // OWASP password validation
    const passwordErrors = []
    if (password.length < 8) passwordErrors.push('Minimal 8 karakter')
    if (password.length > 64) passwordErrors.push('Maksimal 64 karakter')
    if (!/[A-Z]/.test(password)) passwordErrors.push('Minimal 1 huruf besar')
    if (!/[a-z]/.test(password)) passwordErrors.push('Minimal 1 huruf kecil')
    if (!/[0-9]/.test(password)) passwordErrors.push('Minimal 1 angka')
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) passwordErrors.push('Minimal 1 karakter spesial (!@#$%^&*)')

    if (passwordErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Password tidak memenuhi syarat: ' + passwordErrors.join(', ')
      })
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists'
      })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.trim(),
        password: hashedPassword,
        name: name.trim()
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    })

    // Sign token
    const token = signToken({ id: user.id, email: user.email })

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user,
      token
    })
  } catch (error) {
    console.error('❌ Registration error:', error.message)
    next(error)
  }
}

/**
 * Login user
 * POST /api/auth/login
 * Body: { email, password }
 */
export async function loginUser(req, res, next) {
  try {
    const { email, password } = req.body

    if (!(await assertCaptcha(req, res))) return

    const emailError = validateRegistrationEmail(email)
    if (emailError) {
      return res.status(400).json({ success: false, message: emailError })
    }

    // Validation
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.trim() }
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Password atau email nya salah'
      })
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Password atau email nya salah'
      })
    }

    // Sign token
    const token = signToken({ id: user.id, email: user.email })

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      },
      token
    })
  } catch (error) {
    console.error('❌ Login error:', error.message, error.stack)
    next(error)
  }
}

/**
 * Get current user
 * GET /api/auth/me
 * Requires authentication
 */
export async function getCurrentUser(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.json({
      success: true,
      user
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Request password reset
 * POST /api/auth/forgot-password
 * Body: { email }
 */
export async function forgotPassword(req, res, next) {
  try {
    if (!(await assertCaptcha(req, res))) return

    const { email } = req.body

    const emailError = validateRegistrationEmail(email)
    if (emailError) {
      return res.status(400).json({
        success: false,
        message: emailError
      })
    }

    const normalizedEmail = email.trim()

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    // Don't reveal if email exists (security best practice)
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link'
      })
    }

    // Generate reset token (secure random token)
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')
    
    // Token expires in 15 minutes
    const expiryTime = new Date(Date.now() + 15 * 60 * 1000)

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetTokenHash,
        resetTokenExpiry: expiryTime
      }
    })

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password/${resetToken}`
    
    try {
      const emailResult = await sendPasswordResetEmail(normalizedEmail, resetToken, resetUrl)
      
      // In development mode, email might fail but we still want to allow testing
      if (!emailResult.success && process.env.NODE_ENV === 'production') {
        throw new Error(emailResult.message || 'Failed to send reset email')
      }
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError)
      // Clear the reset token if email fails (only in production)
      if (process.env.NODE_ENV === 'production') {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            resetToken: null,
            resetTokenExpiry: null
          }
        })
        
        return res.status(500).json({
          success: false,
          message: 'Failed to send reset email. Please try again later'
        })
      }
    }

    res.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link'
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Validate reset token
 * GET /api/auth/validate-reset-token/:token
 */
export async function validateResetToken(req, res, next) {
  try {
    const { token } = req.params

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      })
    }

    // Hash the provided token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Find user with this token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: tokenHash,
        resetTokenExpiry: {
          gt: new Date() // Token must not be expired
        }
      },
      select: {
        id: true,
        email: true
      }
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      })
    }

    res.json({
      success: true,
      message: 'Token is valid',
      email: user.email
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Reset password with token
 * POST /api/auth/reset-password/:token
 * Body: { password, passwordConfirm }
 */
export async function resetPassword(req, res, next) {
  try {
    const { token } = req.params
    const { password, passwordConfirm } = req.body

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      })
    }

    if (!password || !passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: 'Password and password confirmation are required'
      })
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      })
    }

    // OWASP password validation
    const passwordErrors = []
    if (password.length < 8) passwordErrors.push('Minimal 8 karakter')
    if (password.length > 64) passwordErrors.push('Maksimal 64 karakter')
    if (!/[A-Z]/.test(password)) passwordErrors.push('Minimal 1 huruf besar')
    if (!/[a-z]/.test(password)) passwordErrors.push('Minimal 1 huruf kecil')
    if (!/[0-9]/.test(password)) passwordErrors.push('Minimal 1 angka')
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) passwordErrors.push('Minimal 1 karakter spesial (!@#$%^&*)')

    if (passwordErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Password tidak memenuhi syarat: ' + passwordErrors.join(', ')
      })
    }

    // Hash the provided token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Find user with valid token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: tokenHash,
        resetTokenExpiry: {
          gt: new Date() // Token must not be expired
        }
      }
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      })
    }

    // Hash new password
    const hashedPassword = await hashPassword(password)

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    })

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    })
  } catch (error) {
    next(error)
  }
}
