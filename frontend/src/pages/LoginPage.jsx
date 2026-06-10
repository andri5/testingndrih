import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useSettingsStore } from '../store/settingsStore'
import { CheckCircle2, AlertCircle, Eye, EyeOff, Loader2, ShieldCheck, Globe } from 'lucide-react'
import TurnstileWidget from '../components/TurnstileWidget'
import { useTurnstileSiteKey } from '../hooks/useTurnstileSiteKey'
import { validateEmail } from '../utils/validation'

const translations = {
  en: {
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
  },
  id: {
    title: 'Masuk ke workspace Anda',
    emailLabel: 'Email',
    emailPlaceholder: 'anda@email.com',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    signingIn: 'Masuk...',
    login: 'Masuk',
    noAccount: 'Belum punya akun? ',
    createOne: 'Buat satu',
    forgotPassword: 'Lupa password?',
    copyright: 'Test Sambil Ngopi',
    signedIn: 'Masuk berhasil',
    emailRequired: 'Email dan password wajib diisi',
    emailMissingAt: 'Email harus mengandung @ (contoh: user@email.com)',
    emailInvalid: 'Format email tidak valid (contoh: user@email.com)',
    captchaRequired: 'Selesaikan verifikasi captcha terlebih dahulu',
  }
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((state) => state.login)
  const isLoading = useAuthStore((state) => state.isLoading)
  const error = useAuthStore((state) => state.error)
  const clearError = useAuthStore((state) => state.clearError)
  const { language, setLanguage } = useSettingsStore()
  const turnstileSiteKey = useTurnstileSiteKey()
  const t = translations[language] || translations.en

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const [captchaResetKey, setCaptchaResetKey] = useState(0)

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
      clearError()
      await login(email.trim(), password, captchaToken || undefined)
      setSuccessMessage(t.signedIn)
      setTimeout(() => {
        navigate('/dashboard')
      }, 1000)
    } catch (err) {
      setLocalError(err.message)
      resetCaptcha()
    }
  }

  return (
    <div className="auth-page-bg min-h-screen bg-[#0F0E11] flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-slide-up">

        {/* Logo mark */}
        <div className="flex flex-col items-center mb-8">
          <img 
            src="/logo-icon.png" 
            alt="Logo" 
            className="w-9 h-9 mb-4 rounded"
          />
          <h1 className="text-lg font-semibold text-[#E0E0E2]">Test Sambil Ngopi</h1>
          <p className="text-sm text-[#8A8A8F] mt-0.5">{t.title}</p>
        </div>

        {/* Language Toggle */}
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
            className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 bg-[#2A2A2D] text-white hover:bg-[#3A3A3D]"
            title={language === 'en' ? 'Ganti ke Bahasa Indonesia' : 'Switch to English'}
          >
            <Globe size={16} />
            {language === 'en' ? 'ID' : 'EN'}
          </button>
        </div>

        {/* Card */}
        <div className="auth-card bg-[#161618] border border-[rgba(255,255,255,0.08)] rounded-xl p-6">

          {/* Success */}
          {successMessage && (
            <div className="mb-4 p-3 rounded-md bg-[#0F1F17] border border-[#34D399]/30 text-[#34D399] text-sm flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0" />
              {successMessage}
            </div>
          )}

          {/* Error */}
          {(localError || error) && (
            <div className="mb-4 p-3 rounded-md bg-[#1F0F0F] border border-[#F87171]/30 text-[#F87171] text-sm flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              {localError || error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-[#8A8A8F] mb-1.5 uppercase tracking-wider">
                {t.emailLabel}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                disabled={isLoading}
                className="auth-input w-full px-3 py-2 bg-[#0F0E11] border border-[rgba(255,255,255,0.1)] rounded-md focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] outline-none transition-all text-[#E0E0E2] placeholder-[#4A4A52] text-sm disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-[#8A8A8F] mb-1.5 uppercase tracking-wider">
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
                  className="auth-input w-full px-3 py-2 pr-10 bg-[#0F0E11] border border-[rgba(255,255,255,0.1)] rounded-md focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] outline-none transition-all text-[#E0E0E2] placeholder-[#4A4A52] text-sm disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#4A4A52] hover:text-[#8A8A8F] transition-colors"
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

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 rounded-md font-medium text-sm text-white bg-[#5E6AD2] hover:bg-[#6B7AE8] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2] focus:ring-offset-2 focus:ring-offset-[#161618] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={15} className="animate-spin" />
                  {t.signingIn}
                </span>
              ) : t.login}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-[rgba(255,255,255,0.06)] space-y-3">
            <div className="text-center">
              <span className="text-xs text-[#8A8A8F]">{t.noAccount}</span>
              <Link
                to="/register"
                className="text-xs font-semibold text-[#9BA3F0] hover:text-[#5E6AD2] underline cursor-pointer hover:underline-offset-2 transition-all"
              >
                {t.createOne}
              </Link>
            </div>
            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-[#9BA3F0] hover:text-[#5E6AD2] underline cursor-pointer hover:underline-offset-2 transition-all"
              >
                {t.forgotPassword}
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-[#4A4A52] mt-5">
          {t.copyright} &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
