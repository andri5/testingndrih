import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { AlertCircle, Lock, Loader2, CheckCircle2, ShieldCheck, Check, X } from 'lucide-react'
import api from '../services/api'
import { useSettingsStore } from '../store/settingsStore'

const translations = {
  en: {
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
    passwordTooShort: 'Password must be at least 8 characters',
    copyright: 'Test Sambil Ngopi',
    successMessage: 'Password reset successful. Please login with your new password.',
    requirements: 'Password Requirements',
    req8Chars: 'At least 8 characters',
    reqUppercase: 'One uppercase letter (A-Z)',
    reqLowercase: 'One lowercase letter (a-z)',
    reqDigit: 'One digit (0-9)',
    reqSpecial: 'One special character (!@#$%^&*...)'
  },
  id: {
    title: 'Reset Password',
    subtitle: 'Masukkan password baru Anda di bawah ini.',
    emailLabel: 'Email',
    passwordLabel: 'Password Baru',
    passwordPlaceholder: 'Minimal 8 karakter',
    confirmPasswordLabel: 'Konfirmasi Password',
    confirmPasswordPlaceholder: 'Ulangi password',
    submitBtn: 'Reset Password',
    submitting: 'Mereset...',
    backToLogin: 'Kembali ke Login',
    validating: 'Memverifikasi link reset...',
    linkInvalid: 'Link Tidak Valid',
    linkExpired: 'Token reset tidak valid atau sudah kadaluarsa. Silakan minta link baru.',
    requestNew: 'Minta Link Baru',
    workspace: 'Masuk ke workspace Anda',
    passwordMismatch: 'Password tidak cocok',
    passwordTooShort: 'Password harus minimal 8 karakter',
    copyright: 'Test Sambil Ngopi',
    successMessage: 'Password berhasil direset. Silakan login dengan password baru Anda.',
    requirements: 'Persyaratan Password',
    req8Chars: 'Minimal 8 karakter',
    reqUppercase: 'Satu huruf besar (A-Z)',
    reqLowercase: 'Satu huruf kecil (a-z)',
    reqDigit: 'Satu digit (0-9)',
    reqSpecial: 'Satu karakter khusus (!@#$%^&*...)'
  }
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
  const { theme, language, setTheme, setLanguage } = useSettingsStore()
  const isDarkMode = theme !== 'light'

  const t = translations[language]

  // Password validation helpers
  const passwordRequirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    digit: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)
  }

  const isPasswordValid = Object.values(passwordRequirements).every(req => req)

  useEffect(() => {
    validateToken()
  }, [token])

  const handleLanguageChange = (lang) => setLanguage(lang)

  const handleThemeChange = (isDark) => setTheme(isDark ? 'dark' : 'light')

  const validateToken = async () => {
    try {
      const response = await api.get(`/auth/validate-reset-token/${token}`)
      if (response.data.success) {
        setTokenValid(true)
        setEmail(response.data.email)
      } else {
        setError(t.linkExpired)
      }
    } catch (err) {
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
      setError(language === 'id' ? 'Mohon isi semua field' : 'Please fill all fields')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError(t.passwordMismatch)
      setLoading(false)
      return
    }

    if (!isPasswordValid) {
      setError(language === 'id' ? 'Password tidak memenuhi persyaratan' : 'Password does not meet requirements')
      setLoading(false)
      return
    }

    try {
      await api.post(`/auth/reset-password/${token}`, { password })
      navigate('/login', {
        state: { message: t.successMessage }
      })
    } catch (err) {
      setError(
        err.response?.data?.message || (language === 'id' ? 'Gagal mereset password' : 'Failed to reset password')
      )
    } finally {
      setLoading(false)
    }
  }

  const bgClass = isDarkMode ? 'auth-page-bg bg-[#0F0E11]' : 'bg-gradient-to-br from-gray-50 to-gray-100'
  const cardClass = isDarkMode
    ? 'auth-card bg-[#161618] border border-[rgba(255,255,255,0.08)]'
    : 'bg-white border border-gray-200'
  const textPrimaryClass = isDarkMode ? 'text-[#E0E0E2]' : 'text-gray-900'
  const textSecondaryClass = isDarkMode ? 'text-[#8A8A8F]' : 'text-gray-600'
  const inputClass = isDarkMode
    ? 'auth-input bg-[#0F0E11] border border-[rgba(255,255,255,0.1)] text-[#E0E0E2] placeholder-[#4A4A52] focus:ring-[#5E6AD2] focus:border-[#5E6AD2]'
    : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
  const errorBgClass = isDarkMode
    ? 'bg-[#1F0F0F] border-[#F87171]/30 text-[#F87171]'
    : 'bg-red-50 border-red-200 text-red-700'
  const spinnerClass = isDarkMode ? 'text-white' : 'text-blue-600'

  if (validating) {
    return (
      <div className={`${bgClass} min-h-screen flex items-center justify-center px-4`}>
        <div className={`${cardClass} rounded-xl p-8 text-center shadow-lg max-w-sm w-full`}>
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 border-[#5E6AD2] mx-auto mb-4`}></div>
          <p className={`${textPrimaryClass} font-medium`}>{t.validating}</p>
        </div>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className={`${bgClass} min-h-screen flex items-center justify-center px-4`}>
        <div className="w-full max-w-sm animate-slide-up">
          {/* Logo mark */}
          <div className="flex flex-col items-center mb-8">
            <img 
              src="/logo-icon.png" 
              alt="Logo" 
              className="w-9 h-9 mb-4 rounded"
            />
            <h1 className={`text-lg font-semibold ${textPrimaryClass}`}>Test Sambil Ngopi</h1>
            <p className={`text-sm ${textSecondaryClass} mt-0.5`}>{t.workspace}</p>
          </div>

          {/* Theme & Language Toggle */}
          <div className="flex gap-2 justify-center mb-6">
            <button
              onClick={() => handleThemeChange(true)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                isDarkMode ? 'bg-[#5E6AD2] text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              🌙
            </button>
            <button
              onClick={() => handleThemeChange(false)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                !isDarkMode ? 'bg-[#5E6AD2] text-white' : 'bg-[#2A2A2D] text-white'
              }`}
            >
              ☀️
            </button>
            <div className="flex-1"></div>
            <button
              onClick={() => handleLanguageChange(language === 'en' ? 'id' : 'en')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                isDarkMode
                  ? 'bg-[#2A2A2D] text-white hover:bg-[#3A3A3D]'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {language === 'en' ? 'ID' : 'EN'}
            </button>
          </div>

          <div className={`${cardClass} rounded-xl p-6 shadow-lg text-center`}>
            <h2 className={`text-2xl font-bold ${textPrimaryClass} mb-2`}>{t.linkInvalid}</h2>
            <p className={`${textSecondaryClass} mb-6`}>{error}</p>
            <Link
              to="/forgot-password"
              className="inline-block px-6 py-2 bg-[#5E6AD2] hover:bg-[#6B7AE8] text-white rounded-lg transition font-medium"
            >
              {t.requestNew}
            </Link>
          </div>

          <p className={`text-center text-xs ${textSecondaryClass} mt-5`}>
            {t.copyright} &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${bgClass} min-h-screen flex items-center justify-center px-4`}>
      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo mark */}
        <div className="flex flex-col items-center mb-8">
          <img 
            src="/logo-icon.png" 
            alt="Logo" 
            className="w-9 h-9 mb-4 rounded"
          />
          <h1 className={`text-lg font-semibold ${textPrimaryClass}`}>Test Sambil Ngopi</h1>
          <p className={`text-sm ${textSecondaryClass} mt-0.5`}>{t.workspace}</p>
        </div>

        {/* Theme & Language Toggle */}
        <div className="flex gap-2 justify-center mb-6">
          <button
            onClick={() => handleThemeChange(true)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              isDarkMode ? 'bg-[#5E6AD2] text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            🌙
          </button>
          <button
            onClick={() => handleThemeChange(false)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              !isDarkMode ? 'bg-[#5E6AD2] text-white' : 'bg-[#2A2A2D] text-white'
            }`}
          >
            ☀️
          </button>
          <div className="flex-1"></div>
          <button
            onClick={() => handleLanguageChange(language === 'en' ? 'id' : 'en')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              isDarkMode
                ? 'bg-[#2A2A2D] text-white hover:bg-[#3A3A3D]'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {language === 'en' ? 'ID' : 'EN'}
          </button>
        </div>

        {/* Card */}
        <div className={`${cardClass} rounded-xl p-6 shadow-lg`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[#5E6AD2]/20 flex items-center justify-center">
              <Lock size={20} className="text-[#5E6AD2]" />
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${textPrimaryClass}`}>{t.title}</h2>
              <p className={`text-xs ${textSecondaryClass} mt-0.5`}>{t.subtitle}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className={`block text-xs font-medium ${textSecondaryClass} mb-1.5 uppercase tracking-wider`}>
                {t.emailLabel}
              </label>
              <input
                type="email"
                value={email}
                disabled
                className={`${inputClass} w-full px-3 py-2 rounded-md outline-none text-sm opacity-50 cursor-not-allowed`}
              />
            </div>

            <div>
              <label htmlFor="password" className={`block text-xs font-medium ${textSecondaryClass} mb-1.5 uppercase tracking-wider`}>
                {t.passwordLabel}
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                className={`${inputClass} w-full px-3 py-2 rounded-md focus:ring-1 outline-none transition-all text-sm disabled:opacity-50`}
              />
              
              {/* Password Requirements */}
              {password && (
                <div className={`mt-3 p-3 rounded-md ${isDarkMode ? 'bg-[#1A1A1D] border border-[rgba(255,255,255,0.06)]' : 'bg-gray-50 border border-gray-200'}`}>
                  <p className={`text-xs font-semibold ${isDarkMode ? 'text-[#8A8A8F]' : 'text-gray-600'} mb-2`}>
                    {t.requirements}
                  </p>
                  <div className="space-y-1.5">
                    <RequirementItem 
                      met={passwordRequirements.length} 
                      text={t.req8Chars}
                      isDarkMode={isDarkMode}
                    />
                    <RequirementItem 
                      met={passwordRequirements.uppercase} 
                      text={t.reqUppercase}
                      isDarkMode={isDarkMode}
                    />
                    <RequirementItem 
                      met={passwordRequirements.lowercase} 
                      text={t.reqLowercase}
                      isDarkMode={isDarkMode}
                    />
                    <RequirementItem 
                      met={passwordRequirements.digit} 
                      text={t.reqDigit}
                      isDarkMode={isDarkMode}
                    />
                    <RequirementItem 
                      met={passwordRequirements.special} 
                      text={t.reqSpecial}
                      isDarkMode={isDarkMode}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className={`block text-xs font-medium ${textSecondaryClass} mb-1.5 uppercase tracking-wider`}>
                {t.confirmPasswordLabel}
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t.confirmPasswordPlaceholder}
                className={`${inputClass} w-full px-3 py-2 rounded-md focus:ring-1 outline-none transition-all text-sm disabled:opacity-50`}
              />
            </div>

            {error && (
              <div className={`${errorBgClass} p-3 rounded-md border text-sm flex items-center gap-2`}>
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword || password !== confirmPassword || !isPasswordValid}
              className={`w-full py-2 px-4 rounded-md font-medium text-sm text-white ${
                isDarkMode ? 'bg-[#5E6AD2] hover:bg-[#6B7AE8]' : 'bg-blue-600 hover:bg-blue-700'
              } transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2] focus:ring-offset-2 ${
                isDarkMode ? 'focus:ring-offset-[#161618]' : 'focus:ring-offset-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
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

          <div className={`mt-5 pt-5 border-t ${isDarkMode ? 'border-[rgba(255,255,255,0.06)]' : 'border-gray-200'} text-center`}>
            <Link
              to="/login"
              className={`text-xs font-semibold transition-all underline cursor-pointer ${
                isDarkMode ? 'text-[#9BA3F0] hover:text-[#5E6AD2] hover:underline-offset-2' : 'text-blue-600 hover:text-blue-700 hover:underline-offset-2'
              }`}
            >
              {t.backToLogin}
            </Link>
          </div>
        </div>

        <p className={`text-center text-xs ${textSecondaryClass} mt-5`}>
          {t.copyright} &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}

// Helper component for password requirement indicator
function RequirementItem({ met, text, isDarkMode }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <Check size={16} className="text-green-500 shrink-0" />
      ) : (
        <X size={16} className={`${isDarkMode ? 'text-[#4A4A52]' : 'text-gray-400'} shrink-0`} />
      )}
      <span className={`text-xs ${met ? (isDarkMode ? 'text-green-400' : 'text-green-600') : (isDarkMode ? 'text-[#8A8A8F]' : 'text-gray-600')}`}>
        {text}
      </span>
    </div>
  )
}
