import { useNavigate } from 'react-router-dom'
import { X, ChevronRight, Sparkles } from 'lucide-react'
import { welcomeSplashContent as c } from '../constants/welcomeSplash'

export default function WelcomeSplashModal({ userName, onClose }) {
  const navigate = useNavigate()

  const handleCreateScenario = () => {
    onClose()
    navigate('/scenarios')
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-splash-title"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-[rgba(255,255,255,0.08)] bg-[#161618] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative px-6 pt-6 pb-4 overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-[#5E6AD2]/15 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-[#FBBF24]/10 blur-2xl pointer-events-none" />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-md text-[#8A8A8F] hover:text-[#E0E0E2] hover:bg-[rgba(255,255,255,0.06)] transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#9BA3F0] bg-[#5E6AD2]/15 border border-[#5E6AD2]/25 px-2.5 py-1 rounded-full">
              <Sparkles size={11} />
              {c.badge}
            </span>
          </div>

          <div className="text-4xl mb-3 select-none" aria-hidden>
            ☕
          </div>

          <h2 id="welcome-splash-title" className="text-xl font-semibold text-[#E0E0E2] leading-snug">
            {c.title(userName)}
          </h2>
          <p className="text-sm font-medium text-[#9BA3F0] mt-2">{c.headline}</p>
          <p className="text-sm text-[#8A8A8F] mt-2 leading-relaxed">{c.description}</p>
        </div>

        <div className="px-6 pb-2 space-y-3">
          {c.tips.map((tip) => (
            <div
              key={tip.title}
              className="flex gap-3 p-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]"
            >
              <span className="text-lg shrink-0 leading-none mt-0.5" aria-hidden>
                {tip.emoji}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#E0E0E2]">{tip.title}</p>
                <p className="text-xs text-[#8A8A8F] mt-0.5 leading-relaxed">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-5 border-t border-[rgba(255,255,255,0.06)] space-y-3">
          <button
            type="button"
            onClick={handleCreateScenario}
            className="w-full py-2.5 px-4 rounded-lg font-medium text-sm text-white bg-[#5E6AD2] hover:bg-[#6B7AE8] transition-colors flex items-center justify-center gap-2"
          >
            {c.ctaPrimary}
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-sm text-[#8A8A8F] hover:text-[#E0E0E2] transition-colors"
          >
            {c.ctaSecondary}
          </button>
          <p className="text-[11px] text-center text-[#4A4A52] italic">{c.footnote}</p>
        </div>
      </div>
    </div>
  )
}
