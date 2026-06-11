import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Mail, Loader2, CheckCircle2 } from 'lucide-react'
import api from '../services/api'
import { validateEmail } from '../utils/validation'
import AuthPageHeader from '../components/AuthPageHeader'

const translations = {
    title: 'Forgot Password?',
    subtitle: 'Enter your email to receive a password reset link.',
    emailLabel: 'Email Address',
    emailPlaceholder: 'your@email.com',
    submitBtn: 'Send Reset Link',
    submitting: 'Sending...',
    backToLogin: 'Back to Login',
    noAccount: 'Remember your password? ',
    noAccountLink: 'Login here',
    copyright: 'Test Sambil Ngopi',
    successTitle: 'Email Sent!',
    successMessage: 'We have sent a password reset link to your email. Please check your inbox (including spam folder).',
    successHint: 'Did not receive it? Check spam or try again in a few minutes.',
    tryAgain: 'Try Again',
    workspace: 'Sign in to your workspace',
    emailRequired: 'Email is required',
    emailMissingAt: 'Email must contain @ (example: user@email.com)',
    emailInvalid: 'Email format is invalid (example: user@email.com)',
    errorOccurred: 'Failed to send reset link',
    notRegistered: 'No account found with this email. Please register first.',
    createAccount: 'Create an account',
  
}

function AuthShell({ t, children }) {
  return (
    <div className="auth-page-bg min-h-screen bg-[#0F0E11] flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-slide-up">
        <AuthPageHeader subtitle={t.workspace} />
        {children}
        <p className="text-center text-xs text-[#4A4A52] mt-5">
          {t.copyright} &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [accountNotFound, setAccountNotFound] = useState(false)
  const t = translations

  const validationMessages = {
    emailRequired: t.emailRequired,
    emailMissingAt: t.emailMissingAt,
    emailInvalid: t.emailInvalid,
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setAccountNotFound(false)

    const emailError = validateEmail(email, validationMessages)
    if (emailError) {
      setError(emailError)
      setLoading(false)
      return
    }

    try {
      await api.post('/auth/forgot-password', { email: email.trim() })
      setSubmitted(true)
    } catch (err) {
      const code = err.response?.data?.code
      const message = err.response?.data?.message || t.errorOccurred
      setAccountNotFound(code === 'ACCOUNT_NOT_FOUND')
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleTryAgain = () => {
    setSubmitted(false)
    setError('')
  }

  if (submitted) {
    return (
      <AuthShell t={t}>
        <div className="auth-card bg-[#161618] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#0F1F17] border border-[#34D399]/30 text-[#34D399]">
              <CheckCircle2 size={28} className="shrink-0" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-[#E0E0E2] mb-2">{t.successTitle}</h2>
          <p className="text-sm text-[#8A8A8F] mb-2">{t.successMessage}</p>
          {email && (
            <p className="text-xs text-[#8A8A8F] mb-4 font-mono">{email.trim()}</p>
          )}
          <p className="text-xs text-[#8A8A8F] mb-6">{t.successHint}</p>
          <div className="flex flex-col gap-2">
            <Link
              to="/login"
              className="w-full py-2.5 px-4 rounded-md font-medium text-sm text-white bg-[#5E6AD2] hover:bg-[#6B7AE8] transition-colors duration-150 inline-block"
            >
              {t.backToLogin}
            </Link>
            <button
              type="button"
              onClick={handleTryAgain}
              className="text-xs font-semibold text-[#9BA3F0] hover:text-[#5E6AD2] transition-all underline"
            >
              {t.tryAgain}
            </button>
          </div>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell t={t}>
      <div className="auth-card bg-[#161618] border border-[rgba(255,255,255,0.08)] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#5E6AD2]/20 flex items-center justify-center">
            <Mail size={20} className="text-[#5E6AD2]" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#E0E0E2]">{t.title}</h2>
            <p className="text-xs text-[#8A8A8F] mt-0.5">{t.subtitle}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-[#8A8A8F] mb-1.5 uppercase tracking-wider"
            >
              {t.emailLabel}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              disabled={loading}
              autoComplete="email"
              className="auth-input w-full px-3 py-2 bg-[#0F0E11] border border-[rgba(255,255,255,0.1)] rounded-md focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] outline-none transition-all text-[#E0E0E2] placeholder-[#4A4A52] text-sm disabled:opacity-50"
            />
          </div>

          {error && (
            <div className="p-3 rounded-md border text-sm bg-[#1F0F0F] border-[#F87171]/30 text-[#F87171]">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </div>
              {accountNotFound && (
                <Link
                  to="/register"
                  className="inline-block mt-2 text-xs font-semibold text-[#9BA3F0] hover:text-[#5E6AD2] underline"
                >
                  {t.createAccount}
                </Link>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-md font-medium text-sm text-white bg-[#5E6AD2] hover:bg-[#6B7AE8] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2] focus:ring-offset-2 focus:ring-offset-[#161618] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={15} className="animate-spin" />
                {t.submitting}
              </span>
            ) : (
              t.submitBtn
            )}
          </button>
        </form>

        <div className="mt-5 pt-5 border-t border-[rgba(255,255,255,0.06)] text-center">
          <span className="text-xs text-[#8A8A8F]">{t.noAccount}</span>
          <Link
            to="/login"
            className="text-xs font-semibold text-[#9BA3F0] hover:text-[#5E6AD2] underline cursor-pointer hover:underline-offset-2 transition-all"
          >
            {t.noAccountLink}
          </Link>
        </div>
      </div>
    </AuthShell>
  )
}
