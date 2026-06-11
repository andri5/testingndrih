import { useNavigate } from 'react-router-dom'
import { FileQuestion, ArrowLeft, Home } from 'lucide-react'

const i18n = {
    title: 'Page not found',
    description: "The page you are looking for doesn't exist or has been moved.",
    goBack: 'Go back',
    backToDashboard: 'Back to Dashboard',
  
}

export default function NotFoundPage() {
  const navigate = useNavigate()  const t = i18n

  return (
    <div className="auth-page-bg min-h-screen bg-[#0F0E11] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center animate-slide-up">

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#161618] border border-[#2A2A2D] flex items-center justify-center">
            <FileQuestion size={32} className="text-[#5E6AD2]" />
          </div>
        </div>

        {/* Code */}
        <p className="text-6xl font-bold text-[#5E6AD2] mb-2 tracking-tight">404</p>

        {/* Title */}
        <h1 className="text-xl font-semibold text-[#E0E0E2] mb-2">{t.title}</h1>

        {/* Description */}
        <p className="text-sm text-[#8B8B8E] mb-8 leading-relaxed">
          {t.description}
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#2A2A2D] bg-[#161618] text-sm font-medium text-[#E0E0E2] hover:border-[#5E6AD2] transition-colors"
          >
            <ArrowLeft size={15} />
            {t.goBack}
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
