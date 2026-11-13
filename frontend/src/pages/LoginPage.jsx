import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { CheckCircle2, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import TurnstileWidget from '../components/TurnstileWidget'
import { useTurnstileSiteKey } from '../hooks/useTurnstileSiteKey'
import { validateEmail } from '../utils/validation'
import AuthPageHeader from '../components/AuthPageHeader'

const translations = {
    title: 'Sign in to your workspace',
    emailLabel: 'Email',
    emailPlaceholder: 'your@email.com',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    signingIn: 'Signing in...',
    login: 'Login',
    noAccount: "Don't have an account? ",
    createOne: 'Create one',
    forgotPassword: 'Forgot password?',
    copyright: 'Test Sambil Ngopi',
    signedIn: 'Signed in successfully',
    emailRequired: 'Email and password are required',
    emailMissingAt: 'Email must contain @ (example: user@email.com)',
    emailInvalid: 'Email format is invalid (example: user@email.com)',
    captchaRequired: 'Please complete the captcha verification',
    notRegistered: 'No account found with this email. Please register first.',
    createAccount: 'Create an account',
  
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((state) => state.login)
  const isLoading = useAuthStore((state) => state.isLoading)
  const error = useAuthStore((state) => state.error)
  const clearError = useAuthStore((state) => state.clearError)
  const turnstileSiteKey = useTurnstileSiteKey()
  const t = translations

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const [captchaResetKey, setCaptchaResetKey] = useState(0)
  const [accountNotFound, setAccountNotFound] = useState(false)

  const validationMessages = {
    emailRequired: t.emailRequired,
    emailMissingAt: t.emailMissingAt,
    emailInvalid: t.emailInvalid,
  }

  const resetCaptcha = () => {
    setCaptchaToken('')
    setCaptchaResetKey((key) => key + 1)
  }

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state?.message, location.pathname, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccessMessage('')

    const emailError = validateEmail(email, validationMessages)
    if (emailError) {
      setLocalError(emailError)
      return
    }

    if (!password) {
      setLocalError(t.emailRequired)
      return
    }

    if (turnstileSiteKey && !captchaToken) {
      setLocalError(t.captchaRequired)
      return
    }

    try {
      setLocalError('')
      setAccountNotFound(false)
      clearError()
      await login(email.trim(), password, captchaToken || undefined)
      setSuccessMessage(t.signedIn)
      setTimeout(() => {
        navigate('/dashboard')
      }, 1000)
    } catch (err) {
      setAccountNotFound(err.code === 'ACCOUNT_NOT_FOUND')
      setLocalError(err.message)
      resetCaptcha()
    }
  }

  return (
    <div className="auth-page-bg min-h-screen bg-surface-muted flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-slide-up">

        <AuthPageHeader subtitle={t.title} />

        <div className="auth-card bg-white border border-surface-border rounded-xl p-6 shadow-sm">

          {successMessage && (
            <div className="mb-4 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0" />
              {successMessage}
            </div>
          )}

          {(localError || error) && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                {localError || error}
              </div>
              {accountNotFound && (
                <Link
                  to="/register"
                  className="inline-block mt-2 text-xs font-semibold text-brand hover:text-brand-hover underline"
                >
                  {t.createAccount}
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-ink-muted mb-1.5 uppercase tracking-wider">
                {t.emailLabel}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                disabled={isLoading}
                className="auth-input w-full px-3 py-2 bg-white border border-surface-border rounded-md focus:ring-1 focus:ring-brand focus:border-brand outline-none transition-all text-ink placeholder-ink-subtle text-sm disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-ink-muted mb-1.5 uppercase tracking-wider">
                {t.passwordLabel}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  disabled={isLoading}
                  className="auth-input w-full px-3 py-2 pr-10 bg-white border border-surface-border rounded-md focus:ring-1 focus:ring-brand focus:border-brand outline-none transition-all text-ink placeholder-ink-subtle text-sm disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink-subtle hover:text-ink-muted transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff size={15} />
                  ) : (
                    <Eye size={15} />
                  )}
                </button>
              </div>
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 rounded-md font-medium text-sm text-white bg-brand hover:bg-brand-hover transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={15} className="animate-spin" />
                  {t.signingIn}
                </span>
              ) : t.login}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-surface-border space-y-3">
            <div className="text-center">
              <span className="text-xs text-ink-muted">{t.noAccount}</span>
              <Link
                to="/register"
                className="text-xs font-semibold text-brand hover:text-brand-hover underline cursor-pointer hover:underline-offset-2 transition-all"
              >
                {t.createOne}
              </Link>
            </div>
            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-brand hover:text-brand-hover underline cursor-pointer hover:underline-offset-2 transition-all"
              >
                {t.forgotPassword}
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-ink-subtle mt-5">
          <Link to="/" className="text-ink-muted hover:text-brand transition mr-3">
            ← Home
          </Link>
          {t.copyright} &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
