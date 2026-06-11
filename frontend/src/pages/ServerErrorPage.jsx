import { useNavigate } from 'react-router-dom'
import { ServerCrash, RefreshCw, Home } from 'lucide-react'

const i18n = {
    title: 'Server error',
    description: "Something went wrong on our end. We're working on it.",
    status: 'Service temporarily unavailable',
    tryAgain: 'Try again',
    backToDashboard: 'Back to Dashboard',
  
}

export default function ServerErrorPage() {
  const navigate = useNavigate()  const t = i18n

  return (
    <div className="auth-page-bg min-h-screen bg-[#0F0E11] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center animate-slide-up">

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#161618] border border-[#2A2A2D] flex items-center justify-center">
            <ServerCrash size={32} className="text-orange-400" />
          </div>
        </div>

        {/* Code */}
        <p className="text-6xl font-bold text-orange-400 mb-2 tracking-tight">500</p>

        {/* Title */}
        <h1 className="text-xl font-semibold text-[#E0E0E2] mb-2">{t.title}</h1>

        {/* Description */}
        <p className="text-sm text-[#8B8B8E] mb-8 leading-relaxed">
          {t.description}
        </p>

        {/* Status badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161618] border border-[#2A2A2D] text-xs text-[#8B8B8E] mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          {t.status}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#2A2A2D] bg-[#161618] text-sm font-medium text-[#E0E0E2] hover:border-[#5E6AD2] transition-colors"
          >
            <RefreshCw size={15} />
            {t.tryAgain}
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#5E6AD2] text-sm font-medium text-white hover:bg-[#4F5BBF] transition-colors"
          >
            <Home size={15} />
            {t.backToDashboard}
          </button>
        </div>

      </div>
    </div>
  )
}
