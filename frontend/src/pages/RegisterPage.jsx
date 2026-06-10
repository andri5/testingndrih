import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import TurnstileWidget from '../components/TurnstileWidget'
import { useTurnstileSiteKey } from '../hooks/useTurnstileSiteKey'
import { validateEmail, validateFullName, NAME_MAX_LENGTH } from '../utils/validation'
import AuthPageHeader from '../components/AuthPageHeader'

const translations = {
  en: {
    createAccount: 'Create your account',
    fullName: 'Full Name',
    fullNamePlaceholder: 'John Doe',
    email: 'Email',
    emailPlaceholder: 'your@email.com',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    passwordStrengthWeak: 'Weak',
    passwordStrengthFair: 'Fair',
    passwordStrengthStrong: 'Strong',
    passwordStrengthVeryStrong: 'Very Strong',
    passwordsDoNotMatch: 'Passwords do not match',
    createAccountBtn: 'Create Account',
    creatingAccount: 'Creating account...',
    alreadyHaveAccount: 'Already have an account? ',
    signIn: 'Sign in',
    copyright: 'Test Sambil Ngopi',
    fieldRequired: 'All fields are required',
    passwordNotMeet: 'Password does not meet all security requirements',
    passwordDoNotMatch: 'Passwords do not match',
    rule8Chars: 'At least 8 characters',
    ruleMax64: 'Maximum 64 characters',
    ruleUppercase: 'At least 1 uppercase letter (A-Z)',
    ruleLowercase: 'At least 1 lowercase letter (a-z)',
    ruleNumber: 'At least 1 number (0-9)',
    ruleSpecial: 'At least 1 special character (!@#$%^&*)',
    nameRequired: 'Full name is required',
    nameMaxLength: 'Full name must be at most 30 characters',
    nameAlphabetOnly: 'Full name may only contain letters and spaces',
    emailRequired: 'Email is required',
    emailMissingAt: 'Email must contain @ (example: user@email.com)',
    emailInvalid: 'Email format is invalid (example: user@email.com)',
    captchaRequired: 'Please complete the captcha verification',
  },
  id: {
    createAccount: 'Buat akun Anda',
    fullName: 'Nama Lengkap',
    fullNamePlaceholder: 'John Doe',
    email: 'Email',
    emailPlaceholder: 'anda@email.com',
    password: 'Password',
    confirmPassword: 'Konfirmasi Password',
    passwordStrengthWeak: 'Lemah',
    passwordStrengthFair: 'Cukup',
    passwordStrengthStrong: 'Kuat',
    passwordStrengthVeryStrong: 'Sangat Kuat',
    passwordsDoNotMatch: 'Password tidak cocok',
    createAccountBtn: 'Buat Akun',
    creatingAccount: 'Membuat akun...',
    alreadyHaveAccount: 'Sudah punya akun? ',
    signIn: 'Masuk',
    copyright: 'Test Sambil Ngopi',
    fieldRequired: 'Semua field wajib diisi',
    passwordNotMeet: 'Password tidak memenuhi semua persyaratan keamanan',
    passwordDoNotMatch: 'Password tidak cocok',
    rule8Chars: 'Setidaknya 8 karakter',
    ruleMax64: 'Maksimal 64 karakter',
    ruleUppercase: 'Setidaknya 1 huruf besar (A-Z)',
    ruleLowercase: 'Setidaknya 1 huruf kecil (a-z)',
    ruleNumber: 'Setidaknya 1 angka (0-9)',
    ruleSpecial: 'Setidaknya 1 karakter spesial (!@#$%^&*)',
    nameRequired: 'Nama lengkap wajib diisi',
    nameMaxLength: 'Nama lengkap maksimal 30 karakter',
    nameAlphabetOnly: 'Nama lengkap hanya boleh huruf dan spasi',
    emailRequired: 'Email wajib diisi',
    emailMissingAt: 'Email harus mengandung @ (contoh: user@email.com)',
    emailInvalid: 'Format email tidak valid (contoh: user@email.com)',
    captchaRequired: 'Selesaikan verifikasi captcha terlebih dahulu',
  }
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const register = useAuthStore((state) => state.register)
  const isLoading = useAuthStore((state) => state.isLoading)
  const error = useAuthStore((state) => state.error)
  const clearError = useAuthStore((state) => state.clearError)
  const turnstileSiteKey = useTurnstileSiteKey()
  const t = translations.en

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const [captchaResetKey, setCaptchaResetKey] = useState(0)

  const validationMessages = {
    nameRequired: t.nameRequired,
    nameMaxLength: t.nameMaxLength,
    nameAlphabetOnly: t.nameAlphabetOnly,
    emailRequired: t.emailRequired,
    emailMissingAt: t.emailMissingAt,
    emailInvalid: t.emailInvalid,
  }

  const handleNameChange = (value) => {
    const filtered = value.replace(/[^a-zA-Z\s]/g, '').slice(0, NAME_MAX_LENGTH)
    setName(filtered)
  }

  const resetCaptcha = () => {
    setCaptchaToken('')
    setCaptchaResetKey((key) => key + 1)
  }

  const passwordRules = [
    { test: (p) => p.length >= 8,                                               label: t.rule8Chars },
    { test: (p) => p.length <= 64,                                              label: t.ruleMax64 },
    { test: (p) => /[A-Z]/.test(p),                                             label: t.ruleUppercase },
    { test: (p) => /[a-z]/.test(p),                                             label: t.ruleLowercase },
    { test: (p) => /[0-9]/.test(p),                                             label: t.ruleNumber },
    { test: (p) => /[!@#$%^&*()_+\-=\[\]{};'"\\|,.<>\/?]/.test(p),            label: t.ruleSpecial },
  ]

  const getPasswordStrength = () => {
    if (!password) return { score: 0, label: '', color: '' }
    const passed = passwordRules.filter((r) => r.test(password)).length
    if (passed <= 2) return { score: passed, label: t.passwordStrengthWeak,        color: 'bg-[#F87171]' }
    if (passed <= 4) return { score: passed, label: t.passwordStrengthFair,        color: 'bg-[#FBBF24]' }
    if (passed <= 5) return { score: passed, label: t.passwordStrengthStrong,      color: 'bg-[#5E6AD2]' }
    return             { score: passed, label: t.passwordStrengthVeryStrong, color: 'bg-[#34D399]' }
  }

  const strength = getPasswordStrength()
  const allRulesPassed = password && passwordRules.every((r) => r.test(password))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')
    clearError()

    const nameError = validateFullName(name, validationMessages)
    if (nameError) { setLocalError(nameError); return }

    const emailError = validateEmail(email, validationMessages)
    if (emailError) { setLocalError(emailError); return }

    if (!password || !confirmPassword) { setLocalError(t.fieldRequired); return }
    if (!allRulesPassed) { setLocalError(t.passwordNotMeet); return }
    if (password !== confirmPassword) { setLocalError(t.passwordDoNotMatch); return }
    if (turnstileSiteKey && !captchaToken) { setLocalError(t.captchaRequired); return }

    try {
      await register(email.trim(), password, name.trim(), captchaToken || undefined)
      navigate('/dashboard')
    } catch (err) {
      setLocalError(err.message)
      resetCaptcha()
    }
  }

  const inputCls = 'auth-input w-full px-3 py-2 bg-[#0F0E11] border border-[rgba(255,255,255,0.1)] rounded-md focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] outline-none transition-all text-[#E0E0E2] placeholder-[#4A4A52] text-sm disabled:opacity-50'
  const labelCls = 'block text-xs font-medium text-[#8A8A8F] mb-1.5 uppercase tracking-wider'

  return (
    <div className="auth-page-bg min-h-screen bg-[#0F0E11] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm animate-slide-up">
        <AuthPageHeader subtitle={t.createAccount} />

        <div className="auth-card bg-[#161618] border border-[rgba(255,255,255,0.08)] rounded-xl p-6">
          {(localError || error) && (
            <div className="mb-4 p-3 rounded-md bg-[#1F0F0F] border border-[#F87171]/30 text-[#F87171] text-sm flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />{localError || error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className={labelCls}>{t.fullName}</label>
              <input id="name" type="text" value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder={t.fullNamePlaceholder} disabled={isLoading} maxLength={NAME_MAX_LENGTH} className={inputCls} />
            </div>
            <div>
              <label htmlFor="email" className={labelCls}>{t.email}</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.emailPlaceholder} disabled={isLoading} className={inputCls} />
            </div>
            <div>
              <label htmlFor="password" className={labelCls}>{t.password}</label>
              <div className="relative">
                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" disabled={isLoading} maxLength={64} className={inputCls + ' pr-10'} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#4A4A52] hover:text-[#8A8A8F] transition-colors" tabIndex={-1}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {password && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                      <div className={"h-full rounded-full transition-all duration-300 " + strength.color} style={{ width: ((strength.score / passwordRules.length) * 100) + "%" }} />
                    </div>
                    <span className="text-[10px] font-medium text-[#8A8A8F]">{strength.label}</span>
                  </div>
                  <ul className="space-y-0.5">
                    {passwordRules.map((rule, i) => (
                      <li key={i} className={"text-[11px] flex items-center gap-1.5 " + (rule.test(password) ? 'text-[#34D399]' : 'text-[#4A4A52]')}>
                        {rule.test(password)
                          ? <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          : <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                        }
                        {rule.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className={labelCls}>{t.confirmPassword}</label>
              <div className="relative">
                <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" disabled={isLoading} maxLength={64} className={inputCls + ' pr-10'} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#4A4A52] hover:text-[#8A8A8F] transition-colors" tabIndex={-1}>
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-xs text-[#F87171]">{t.passwordsDoNotMatch}</p>
              )}
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
            <button type="submit" disabled={isLoading} className="w-full py-2 px-4 rounded-md font-medium text-sm text-white bg-[#5E6AD2] hover:bg-[#6B7AE8] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2] focus:ring-offset-2 focus:ring-offset-[#161618] disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? <span className="flex items-center justify-center gap-2"><Loader2 size={15} className="animate-spin" />{t.creatingAccount}</span> : t.createAccountBtn}
            </button>
          </form>
          <div className="mt-5 pt-5 border-t border-[rgba(255,255,255,0.06)] text-center">
            <span className="text-xs text-[#8A8A8F]">{t.alreadyHaveAccount}</span>
            <Link to="/login" className="text-xs text-[#9BA3F0] hover:text-[#5E6AD2] font-medium transition-colors">{t.signIn}</Link>
          </div>
        </div>
        <p className="text-center text-xs text-[#4A4A52] mt-5">{t.copyright} &copy; {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}
