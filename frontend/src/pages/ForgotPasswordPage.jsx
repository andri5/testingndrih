import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AlertCircle, Mail, ArrowLeft, Loader2, CheckCircle2, ShieldCheck, Moon, Sun, Globe } from 'lucide-react'
import api from '../services/api'
import { useSettingsStore } from '../store/settingsStore'

const translations = {
  en: {
    title: 'Forgot Password?',
    subtitle: 'Enter your email to receive a password reset link.',
    emailLabel: 'Email Address',
    emailPlaceholder: 'your@email.com',
    submitBtn: 'Send Reset Link',
    submitting: 'Sending...',
    backToLogin: 'Back to Login',
    noAccount: "Remember your password? ",
    noAccountLink: 'Login here',
    copyright: 'Test Sambil Ngopi Coy',
    successTitle: 'Email Sent!',
    successMessage: 'We have sent a password reset link to your email. Please check your inbox (including spam folder).',
    errorOccurred: 'An error occurred',
    tryAgain: 'Try Again',
    workspace: 'Sign in to your workspace'
  },
  id: {
    title: 'Lupa Password?',
    subtitle: 'Masukkan email Anda untuk menerima link reset password.',
    emailLabel: 'Alamat Email',
    emailPlaceholder: 'anda@email.com',
    submitBtn: 'Kirim Link Reset',
    submitting: 'Mengirim...',
    backToLogin: 'Kembali ke Login',
    noAccount: 'Ingat passwordnya? ',
    noAccountLink: 'Login di sini',
    copyright: 'Ini Test Sambil Ngopi Coy',
    successTitle: 'Email Terkirim!',
    successMessage: 'Kami telah mengirim link reset password ke email Anda. Silakan cek inbox Anda (termasuk folder spam).',
    errorOccurred: 'Terjadi kesalahan',
    tryAgain: 'Coba Lagi',
    workspace: 'Masuk ke workspace Anda'
  }
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const navigate = useNavigate()
  const { theme, language, setTheme, setLanguage } = useSettingsStore()
  const isDarkMode = theme !== 'light'

  const t = translations[language]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!email || !email.trim()) {
      setError(language === 'id' ? 'Email tidak boleh kosong' : 'Email is required')
      setLoading(false)
      return
    }

    try {
      const response = await api.post('/auth/forgot-password', { email })
      setSubmitted(true)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        (language === 'id' ? 'Gagal mengirim link reset' : 'Failed to send reset link')
      )
    } finally {
      setLoading(false)
    }
  }

  const bgClass = isDarkMode ? 'auth-page-bg bg-[#0F0E11]' : 'bg-gradient-to-br from-gray-50 to-gray-100'
  const cardClass = isDarkMode
    ? 'auth-card bg-[#161618] border border-[rgba(255,255,255,0.08)] shadow-2xl shadow-black/30'
    : 'bg-white border border-gray-200 shadow-2xl shadow-gray-200/50'
  const textPrimaryClass = isDarkMode ? 'text-[#E0E0E2]' : 'text-gray-900'
  const textSecondaryClass = isDarkMode ? 'text-[#8A8A8F]' : 'text-gray-600'
  const inputClass = isDarkMode
    ? 'auth-input bg-[#0F0E11] border border-[rgba(255,255,255,0.1)] text-[#E0E0E2] placeholder-[#4A4A52] focus:ring-[#5E6AD2] focus:border-[#5E6AD2] focus:ring-2 shadow-sm'
    : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 focus:ring-2 shadow-sm'
  const buttonClass = isDarkMode
    ? 'bg-[#5E6AD2] hover:bg-[#6B7AE8] active:bg-[#4D58C1] shadow-lg shadow-[#5E6AD2]/20 hover:shadow-[#6B7AE8]/30 focus:ring-offset-[#161618]'
    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-lg shadow-blue-600/20 hover:shadow-blue-700/30 focus:ring-offset-white'
  const successBgClass = isDarkMode
    ? 'bg-[#0F1F17] border-[#34D399]/30 text-[#34D399]'
    : 'bg-green-50 border-green-200 text-green-700'
  const errorBgClass = isDarkMode
    ? 'bg-[#1F0F0F] border-[#F87171]/30 text-[#F87171]'
    : 'bg-red-50 border-red-200 text-red-700'

  if (submitted) {
    return (
      <div className={`${bgClass} min-h-screen flex items-center justify-center px-4`}>
        <div className="w-full max-w-sm animate-slide-up">
          {/* Logo mark */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-9 h-9 rounded-lg bg-[#5E6AD2] flex items-center justify-center mb-4">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <h1 className={`text-lg font-semibold ${textPrimaryClass}`}>Test Sambil Ngopi Coy</h1>
            <p className={`text-sm ${textSecondaryClass} mt-0.5`}>{t.workspace}</p>
          </div>

          {/* Theme & Language Toggle */}
          <div className="flex justify-center gap-2 mb-8">
            <div className="flex items-center gap-1 bg-gray-200 dark:bg-[#2A2A2D] rounded-lg p-1">
              <button
                onClick={() => setTheme('dark')}
                className={`px-3 py-2 rounded-md transition-all duration-200 flex items-center gap-1.5 ${
                  isDarkMode
                    ? 'bg-[#5E6AD2] text-white shadow-lg shadow-[#5E6AD2]/20'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Moon size={16} />
              </button>
              <button
                onClick={() => setTheme('light')}
                className={`px-3 py-2 rounded-md transition-all duration-200 flex items-center gap-1.5 ${
                  !isDarkMode
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Sun size={16} />
              </button>
            </div>
            <button
              onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                isDarkMode
                  ? 'bg-[#2A2A2D] text-white hover:bg-[#3A3A3D]'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Globe size={16} />
              {language === 'en' ? 'ID' : 'EN'}
            </button>
          </div>

          {/* Card */}
          <div className={`${cardClass} rounded-xl p-6`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[#5E6AD2]/20 flex items-center justify-center">
                <Mail size={20} className="text-[#5E6AD2]" />
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
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  disabled={loading}
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
                disabled={loading}
                className={`w-full py-2 px-4 rounded-md font-medium text-sm text-white ${buttonClass} transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
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
              <span className={`text-xs ${textSecondaryClass}`}>{t.noAccount}</span>
              <Link
                to="/login"
                className={`text-xs font-semibold transition-all underline cursor-pointer ${isDarkMode ? 'text-[#9BA3F0] hover:text-[#5E6AD2] hover:underline-offset-2' : 'text-blue-600 hover:text-blue-700 hover:underline-offset-2'}`}
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

  return (
    <div className={`${bgClass} min-h-screen flex items-center justify-center px-4`}>
      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo mark */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-9 h-9 rounded-lg bg-[#5E6AD2] flex items-center justify-center mb-4">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <h1 className={`text-lg font-semibold ${textPrimaryClass}`}>Test Sambil Ngopi Coy</h1>
          <p className={`text-sm ${textSecondaryClass} mt-0.5`}>{t.workspace}</p>
        </div>

        {/* Theme & Language Toggle */>
        <div className="flex justify-center gap-2 mb-8">
          <div className="flex items-center gap-1 bg-gray-200 dark:bg-[#2A2A2D] rounded-lg p-1">
            <button
              onClick={() => setTheme('dark')}
              className={`px-3 py-2 rounded-md transition-all duration-200 flex items-center gap-1.5 ${
                isDarkMode
                  ? 'bg-[#5E6AD2] text-white shadow-lg shadow-[#5E6AD2]/20'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Moon size={16} />
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`px-3 py-2 rounded-md transition-all duration-200 flex items-center gap-1.5 ${
                !isDarkMode
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Sun size={16} />
            </button>
          </div>
          <button
            onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
              isDarkMode
                ? 'bg-[#2A2A2D] text-white hover:bg-[#3A3A3D]'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Globe size={16} />
            {language === 'en' ? 'ID' : 'EN'}
          </button>
        </div>

        {/* Card */}
        <div className={`${cardClass} rounded-xl p-6`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[#5E6AD2]/20 flex items-center justify-center">
              <Mail size={20} className="text-[#5E6AD2]" />
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
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                disabled={loading}
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
                disabled={loading}
                className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm text-white ${buttonClass} transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
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
            <span className={`text-xs ${textSecondaryClass}`}>{t.noAccount}</span>
            <Link
              to="/login"
              className={`text-xs font-semibold transition-all underline cursor-pointer ${isDarkMode ? 'text-[#9BA3F0] hover:text-[#5E6AD2] hover:underline-offset-2' : 'text-blue-600 hover:text-blue-700 hover:underline-offset-2'}`}
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
