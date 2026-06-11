import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { AlertCircle, Lock, Loader2, Check, X } from 'lucide-react'
import api from '../services/api'
import TurnstileWidget from '../components/TurnstileWidget'
import { useTurnstileSiteKey } from '../hooks/useTurnstileSiteKey'
import AuthPageHeader from '../components/AuthPageHeader'

const translations = {
    title: 'Reset Password',
    subtitle: 'Enter your new password below.',
    emailLabel: 'Email',
    passwordLabel: 'New Password',
    passwordPlaceholder: 'Minimum 8 characters',
    confirmPasswordLabel: 'Confirm Password',
    confirmPasswordPlaceholder: 'Repeat password',
    submitBtn: 'Reset Password',
    submitting: 'Resetting...',
    backToLogin: 'Back to Login',
    validating: 'Verifying reset link...',
    linkInvalid: 'Invalid Link',
    linkExpired: 'Invalid or expired reset token. Please request a new one.',
    requestNew: 'Request New Link',
    workspace: 'Sign in to your workspace',
    passwordMismatch: 'Passwords do not match',
    copyright: 'Test Sambil Ngopi',
    successMessage: 'Password reset successful. Please login with your new password.',
    requirements: 'Password Requirements',
    req8Chars: 'At least 8 characters',
    reqUppercase: 'One uppercase letter (A-Z)',
    reqLowercase: 'One lowercase letter (a-z)',
    reqDigit: 'One digit (0-9)',
    reqSpecial: 'One special character (!@#$%^&*...)',
    captchaRequired: 'Please complete the captcha verification',
  
}

function AuthShell({ t, children }) {
  return (
    <div className="auth-page-bg min-h-screen bg-[#0F0E11] flex items-center justify-center px-4 py-10">
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

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [error, setError] = useState('')
  const [tokenValid, setTokenValid] = useState(false)
  const [email, setEmail] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const [captchaResetKey, setCaptchaResetKey] = useState(0)
  const turnstileSiteKey = useTurnstileSiteKey()

  const t = translations

  const resetCaptcha = () => {
    setCaptchaToken('')
    setCaptchaResetKey((key) => key + 1)
  }

  const passwordRequirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    digit: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password),
  }

  const isPasswordValid = Object.values(passwordRequirements).every((req) => req)

  useEffect(() => {
    validateToken()
  }, [token])

  const validateToken = async () => {
    try {
      const response = await api.get(`/auth/validate-reset-token/${token}`)
      if (response.data.success) {
        setTokenValid(true)
        setEmail(response.data.email)
      } else {
        setError(t.linkExpired)
      }
    } catch {
      setError(t.linkExpired)
    } finally {
      setValidating(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!password || !confirmPassword) {
      setError('Please fill all fields')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError(t.passwordMismatch)
      setLoading(false)
      return
    }

    if (!isPasswordValid) {
      setError('Password does not meet requirements')
      setLoading(false)
      return
    }

    if (turnstileSiteKey && !captchaToken) {
      setError(t.captchaRequired)
      setLoading(false)
      return
    }

    try {
      await api.post(`/auth/reset-password/${token}`, {
        password,
        passwordConfirm: confirmPassword,
        captchaToken: captchaToken || undefined,
      })
      navigate('/login', {
        state: { message: t.successMessage },
      })
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to reset password'
      )
      resetCaptcha()
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'auth-input w-full px-3 py-2 bg-[#0F0E11] border border-[rgba(255,255,255,0.1)] rounded-md focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] outline-none transition-all text-[#E0E0E2] placeholder-[#4A4A52] text-sm disabled:opacity-50'
  const labelClass = 'block text-xs font-medium text-[#8A8A8F] mb-1.5 uppercase tracking-wider'

  if (validating) {
    return (
      <AuthShell t={t}>
        <div className="auth-card bg-[#161618] border border-[rgba(255,255,255,0.08)] rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5E6AD2] mx-auto mb-4" />
          <p className="text-[#E0E0E2] font-medium">{t.validating}</p>
        </div>
      </AuthShell>
    )
  }

  if (!tokenValid) {
    return (
      <AuthShell t={t}>
        <div className="auth-card bg-[#161618] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 text-center">
          <h2 className="text-2xl font-bold text-[#E0E0E2] mb-2">{t.linkInvalid}</h2>
          <p className="text-[#8A8A8F] mb-6">{error}</p>
          <Link
            to="/forgot-password"
            className="inline-block px-6 py-2 bg-[#5E6AD2] hover:bg-[#6B7AE8] text-white rounded-md transition font-medium text-sm"
          >
            {t.requestNew}
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell t={t}>
      <div className="auth-card bg-[#161618] border border-[rgba(255,255,255,0.08)] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#5E6AD2]/20 flex items-center justify-center">
            <Lock size={20} className="text-[#5E6AD2]" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#E0E0E2]">{t.title}</h2>
            <p className="text-xs text-[#8A8A8F] mt-0.5">{t.subtitle}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className={labelClass}>
              {t.emailLabel}
            </label>
            <input
              type="email"
              value={email}
              disabled
              className={`${inputClass} opacity-50 cursor-not-allowed`}
            />
          </div>

          <div>
            <label htmlFor="password" className={labelClass}>
              {t.passwordLabel}
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.passwordPlaceholder}
              className={inputClass}
            />

            {password && (
              <div className="mt-3 p-3 rounded-md bg-[#1A1A1D] border border-[rgba(255,255,255,0.06)]">
                <p className="text-xs font-semibold text-[#8A8A8F] mb-2">{t.requirements}</p>
                <div className="space-y-1.5">
                  <RequirementItem met={passwordRequirements.length} text={t.req8Chars} />
                  <RequirementItem met={passwordRequirements.uppercase} text={t.reqUppercase} />
                  <RequirementItem met={passwordRequirements.lowercase} text={t.reqLowercase} />
                  <RequirementItem met={passwordRequirements.digit} text={t.reqDigit} />
                  <RequirementItem met={passwordRequirements.special} text={t.reqSpecial} />
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className={labelClass}>
              {t.confirmPasswordLabel}
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t.confirmPasswordPlaceholder}
              className={inputClass}
            />
          </div>

          {turnstileSiteKey && (
            <TurnstileWidget
              siteKey={turnstileSiteKey}
              resetKey={captchaResetKey}
              onVerify={setCaptchaToken}
              onExpire={resetCaptcha}
              onError={() => setCaptchaToken('')}
            />
          )}

          {error && (
            <div className="p-3 rounded-md border text-sm flex items-center gap-2 bg-[#1F0F0F] border-[#F87171]/30 text-[#F87171]">
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              !password ||
              !confirmPassword ||
              password !== confirmPassword ||
              !isPasswordValid ||
              (turnstileSiteKey && !captchaToken)
            }
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
          <Link
            to="/login"
            className="text-xs font-semibold text-[#9BA3F0] hover:text-[#5E6AD2] underline cursor-pointer hover:underline-offset-2 transition-all"
          >
            {t.backToLogin}
          </Link>
        </div>
      </div>
    </AuthShell>
  )
}

function RequirementItem({ met, text }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <Check size={16} className="text-green-500 shrink-0" />
      ) : (
        <X size={16} className="text-[#4A4A52] shrink-0" />
      )}
      <span className={`text-xs ${met ? 'text-green-400' : 'text-[#8A8A8F]'}`}>{text}</span>
    </div>
  )
}
