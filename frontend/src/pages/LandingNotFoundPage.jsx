import { Link, useNavigate } from 'react-router-dom'
import { FileQuestion, ArrowLeft, Home, ArrowRight } from 'lucide-react'
import LandingNav, { LandingFooter } from '../components/LandingNav'
import { landingCopy } from '../i18n/landingI18n'

export default function LandingNotFoundPage({ lang = 'id' }) {
  const t = landingCopy[lang] || landingCopy.id
  const navigate = useNavigate()
  const homePath = lang === 'en' ? '/en' : '/'

  return (
    <div className="landing-page min-h-screen overflow-x-hidden flex flex-col">
      <div className="pointer-events-none fixed inset-0 lp-glow" aria-hidden />

      <LandingNav lang={lang} t={t} />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 pt-24 pb-16">
        <div className="lp-container-prose w-full text-center lp-animate-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl lp-card mb-6">
            <FileQuestion size={32} className="text-[#5E6AD2]" />
          </div>

          <p className="text-6xl font-bold lp-gradient-text mb-2 tracking-tight">404</p>
          <h1 className="text-xl sm:text-2xl font-bold lp-hero-title mb-3">{t.notFoundTitle}</h1>
          <p className="text-sm sm:text-base lp-muted leading-relaxed mb-8">{t.notFoundDesc}</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={homePath}
              className="lp-btn-primary inline-flex items-center justify-center gap-2 font-medium px-5 py-3 rounded-xl"
            >
              <Home size={18} />
              {t.notFoundBack}
            </Link>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="lp-btn-secondary inline-flex items-center justify-center gap-2 font-medium px-5 py-3 rounded-xl"
            >
              <ArrowLeft size={18} />
              {t.notFoundGoBack}
            </button>
          </div>

          <p className="mt-8 text-sm lp-subtle">
            {lang === 'en' ? 'Or' : 'Atau'}{' '}
            <Link to="/login" className="text-[#5E6AD2] font-medium hover:underline">
              {t.notFoundLogin}
            </Link>
            {' · '}
            <Link to="/register" className="text-[#5E6AD2] font-medium hover:underline inline-flex items-center gap-1">
              {t.notFoundRegister}
              <ArrowRight size={14} />
            </Link>
          </p>
        </div>
      </main>

      <LandingFooter lang={lang} t={t} />
    </div>
  )
}
