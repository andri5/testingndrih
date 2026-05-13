import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '../store/settingsStore'
import { ShieldCheck, Clock, LogIn } from 'lucide-react'

const i18n = {
  en: {
    title: 'Session Expired',
    description: 'Your session has timed out due to inactivity. Please sign in again to continue.',
    signInAgain: 'Sign in again',
  },
  id: {
    title: 'Sesi Berakhir',
    description: 'Sesi Anda telah kedaluwarsa karena tidak aktif. Silakan masuk lagi untuk melanjutkan.',
    signInAgain: 'Masuk Lagi',
  },
}

export default function SessionExpiredPage() {
  const navigate = useNavigate()
  const { language } = useSettingsStore()
  const t = i18n[language] || i18n.en

  return (
    <div className="auth-page-bg min-h-screen bg-[#0F0E11] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center animate-slide-up">

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-[#161618] border border-[#2A2A2D] flex items-center justify-center">
              <ShieldCheck size={32} className="text-[#8B8B8E]" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0F0E11] border border-[#2A2A2D] flex items-center justify-center">
              <Clock size={13} className="text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-semibold text-[#E0E0E2] mb-2">{t.title}</h1>

        {/* Description */}
        <p className="text-sm text-[#8B8B8E] mb-8 leading-relaxed">
          {t.description}
        </p>

        {/* Sign in button */}
        <button
          onClick={() => navigate('/login')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#5E6AD2] text-sm font-medium text-white hover:bg-[#4F5BBF] transition-colors"
        >
          <LogIn size={15} />
          {t.signInAgain}
        </button>

      </div>
    </div>
  )
}
