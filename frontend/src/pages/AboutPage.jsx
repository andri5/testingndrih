import { Link } from 'react-router-dom'
import {
  Target,
  Users,
  Code2,
  Coffee,
  CheckCircle2,
  ArrowRight,
  Globe,
  Server,
} from 'lucide-react'
import LandingNav, { LandingFooter } from '../components/LandingNav'
import { landingCopy, aboutCopy } from '../i18n/landingI18n'
import { useAboutSEO } from '../hooks/useLandingSEO'

const FOR_WHO_ICONS = [Users, Code2, Coffee]

export default function AboutPage({ lang = 'id' }) {
  const nav = landingCopy[lang] || landingCopy.id
  const t = aboutCopy[lang] || aboutCopy.id
  useAboutSEO(lang)

  return (
    <div className="landing-page min-h-screen overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 lp-glow" aria-hidden />

      <LandingNav lang={lang} t={nav} />

      <section className="relative pt-28 pb-12 sm:pt-32 sm:pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center lp-animate-in">
          <p className="inline-flex items-center gap-2 text-xs font-semibold lp-badge rounded-full px-3 py-1.5 mb-6">
            <Target size={14} />
            {t.badge}
          </p>
          <h1 className="lp-hero-title text-3xl sm:text-4xl font-bold">{t.title}</h1>
          <p className="mt-5 text-base sm:text-lg lp-muted leading-relaxed">{t.subtitle}</p>
        </div>
      </section>

      <section className="py-12 sm:py-16 px-4 sm:px-6 lp-section-alt">
        <div className="max-w-3xl mx-auto lp-card rounded-2xl p-8 sm:p-10 lp-animate-in">
          <h2 className="text-xl font-bold lp-hero-title mb-4">{t.missionTitle}</h2>
          <p className="lp-muted leading-relaxed text-base">{t.missionText}</p>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center lp-hero-title mb-10">{t.forWhoTitle}</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {t.forWho.map((item, i) => {
              const Icon = FOR_WHO_ICONS[i]
              return (
                <div key={item.title} className="lp-card rounded-2xl p-6 lp-animate-in">
                  <div className="w-10 h-10 rounded-xl lp-icon-indigo flex items-center justify-center mb-4">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-semibold lp-hero-title mb-2">{item.title}</h3>
                  <p className="text-sm lp-muted leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6 lp-section-alt">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl font-bold lp-hero-title mb-6">{t.builtTitle}</h2>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {t.builtItems.map((item) => (
              <span key={item} className="lp-pill px-4 py-2 rounded-full text-sm font-medium">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold lp-hero-title mb-6 text-center">{t.valuesTitle}</h2>
          <ul className="space-y-4">
            {t.values.map((value) => (
              <li key={value} className="flex items-start gap-3 lp-card rounded-xl p-4 sm:p-5">
                <CheckCircle2 size={18} className="text-indigo-500 shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base lp-muted leading-relaxed">{value}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto lp-ai-panel rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center">
              <Globe size={24} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold lp-hero-title">{t.liveTitle}</h3>
              <p className="text-sm lp-muted mt-1">{t.liveText}</p>
            </div>
          </div>
          <a
            href="https://testsambilngopi.com"
            target="_blank"
            rel="noopener noreferrer"
            className="lp-btn-secondary inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium sm:ml-auto"
          >
            <Server size={16} />
            testsambilngopi.com
          </a>
        </div>
      </section>

      <section className="py-16 sm:py-24 px-4 sm:px-6 lp-section-alt">
        <div className="max-w-xl mx-auto text-center lp-animate-in">
          <h2 className="text-2xl font-bold lp-hero-title">{t.ctaTitle}</h2>
          <p className="mt-3 lp-muted">{t.ctaText}</p>
          <Link
            to="/register"
            className="lp-btn-primary inline-flex items-center gap-2 mt-8 font-medium px-8 py-3.5 rounded-xl"
          >
            {t.ctaButton}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <LandingFooter lang={lang} t={nav} />
    </div>
  )
}
