import nodemailer from 'nodemailer'

/**
 * Email service using Nodemailer
 * Supports: SMTP, Gmail, Outlook, etc.
 */

// Create transporter based on environment
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: process.env.SMTP_PORT || 1025,
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER && process.env.SMTP_PASSWORD ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  } : undefined,
  logger: process.env.NODE_ENV === 'development',
  debug: process.env.NODE_ENV === 'development'
})

/**
 * Send password reset email
 * @param {string} email - User email
 * @param {string} resetToken - Reset token
 * @param {string} resetUrl - Full reset URL for user to click
 */
export async function sendPasswordResetEmail(email, resetToken, resetUrl) {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'Test Sambil Ngopi <noreply@testsambilngopi.local>',
      to: email,
      subject: 'Reset Password — Test Sambil Ngopi',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
            <h2 style="color: #5E6AD2;">Reset Password — Test Sambil Ngopi</h2>
            
            <p>Halo,</p>
            
            <p>Kami menerima permintaan untuk mereset password akun Anda. Jika Anda tidak meminta ini, abaikan email ini.</p>
            
            <p>Klik tombol di bawah untuk membuat password baru (link berlaku 15 menit):</p>
            
            <div style="margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #5E6AD2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 13px;">
              Atau salin link berikut ke browser Anda:<br/>
              <code style="background-color: #f0f0f0; padding: 2px 6px; border-radius: 3px; word-break: break-all;">${resetUrl}</code>
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px;">
              Email otomatis dari Test Sambil Ngopi. Mohon jangan membalas email ini.
            </p>
          </div>
        </div>
      `,
      text: `
        Reset Password — Test Sambil Ngopi
        
        Halo,
        
        Kami menerima permintaan untuk mereset password akun Anda. Jika Anda tidak meminta ini, abaikan email ini.
        
        Buka link berikut untuk membuat password baru (berlaku 15 menit):
        ${resetUrl}
        
        Email otomatis dari Test Sambil Ngopi. Mohon jangan membalas email ini.
      `
    }

    const result = await transporter.sendMail(mailOptions)
    
    console.log(`[Email Service] Reset email sent to ${email}:`, result.messageId)
    
    return {
      success: true,
      messageId: result.messageId
    }
  } catch (error) {
    console.error(`[Email Service] Failed to send reset email to ${email}:`, error.message)
    
    // In development, log the error but don't throw - allow the flow to continue
    // This allows testing without a real SMTP server
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Failed to send reset email: ${error.message}`)
    }
    
    console.warn('[Email Service] Email sending failed in development mode - this is expected without a real SMTP server')
    
    return {
      success: false,
      message: `Failed to send email: ${error.message}`,
      isDevelopment: true
    }
  }
}

/**
 * Send welcome email to new user
 * @param {string} email - User email
 * @param {string} name - User name
 */
export async function sendWelcomeEmail(email, name) {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@testingndrih.local',
      to: email,
      subject: 'Welcome to TestingNDRIH!',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
            <h2 style="color: #5E6AD2;">Welcome to TestingNDRIH!</h2>
            
            <p>Hello ${name || 'User'},</p>
            
            <p>Thank you for signing up! Your account has been successfully created.</p>
            
            <p>You can now log in and start creating automated test scenarios.</p>
            
            <div style="margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="background-color: #5E6AD2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Login Now
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px;">
              This is an automated email. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
      text: `
        Welcome to TestingNDRIH!
        
        Hello ${name || 'User'},
        
        Thank you for signing up! Your account has been successfully created.
        
        You can now log in and start creating automated test scenarios.
        
        Visit: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login
        
        This is an automated email. Please do not reply to this email.
      `
    }

    const result = await transporter.sendMail(mailOptions)
    
    console.log(`[Email Service] Welcome email sent to ${email}:`, result.messageId)
    
    return {
      success: true,
      messageId: result.messageId
    }
  } catch (error) {
    console.error(`[Email Service] Failed to send welcome email to ${email}:`, error.message)
    // Don't throw, as this is non-critical
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Send test failure / alert email
 */
export async function sendTestAlertEmail(email, subject, payload) {
  try {
    const lines = [
      `Scenario: ${payload.scenarioName}`,
      `Status: ${payload.status}`,
      payload.passedSteps != null ? `Steps: ${payload.passedSteps}/${payload.totalSteps}` : null,
      payload.errorMessage ? `Error: ${payload.errorMessage}` : null,
      `Time: ${payload.timestamp}`,
      `Details: ${payload.detailUrl}`
    ].filter(Boolean)

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@testingndrih.local',
      to: email,
      subject: `[Test Sambil Ngopi] ${subject}`,
      text: lines.join('\n'),
      html: `<pre style="font-family:monospace">${lines.join('\n')}</pre>`
    }

    const result = await transporter.sendMail(mailOptions)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error(`[Email Service] Alert email failed: ${error.message}`)
    if (process.env.NODE_ENV === 'production') throw error
    return { success: false, error: error.message }
  }
}

/**
 * Verify email transporter is working
 */
export async function verifyEmailService() {
  try {
    await transporter.verify()
    console.log('[Email Service] SMTP connection verified successfully')
    return { success: true }
  } catch (error) {
    console.error('[Email Service] SMTP connection failed:', error.message)
    return { success: false, error: error.message }
  }
}
