import { Link, useLocation } from 'react-router-dom'
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
import { getPublicLang } from '../utils/landingRoutes'

const FOR_WHO_ICONS = [Users, Code2, Coffee]

export default function AboutPage({ lang: langProp }) {
  const { pathname } = useLocation()
  const lang = langProp ?? getPublicLang(pathname)
  const nav = landingCopy[lang] || landingCopy.id
  const t = aboutCopy[lang] || aboutCopy.id
  useAboutSEO(lang)

  return (
    <div className="landing-page min-h-screen overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 lp-glow" aria-hidden />

      <LandingNav lang={lang} t={nav} />

      <section className="lp-section pt-28 sm:pt-32 pb-8 sm:pb-12">
        <div className="lp-container-narrow text-center lp-animate-in px-0">
          <p className="inline-flex items-center gap-2 text-xs font-semibold lp-badge rounded-full px-3 py-1.5 mb-5 sm:mb-6">
            <Target size={14} />
            {t.badge}
          </p>
          <h1 className="lp-hero-title text-2xl sm:text-3xl md:text-4xl font-bold">{t.title}</h1>
          <p className="mt-4 sm:mt-5 lp-lead lp-muted">{t.subtitle}</p>
        </div>
      </section>

      <section className="lp-section lp-section-alt py-10 sm:py-14">
        <div className="lp-container-narrow">
          <div className="lp-card rounded-2xl p-6 sm:p-8 md:p-10 lp-animate-in">
            <h2 className="text-lg sm:text-xl font-bold lp-hero-title mb-3 sm:mb-4">{t.missionTitle}</h2>
            <p className="lp-lead lp-muted">{t.missionText}</p>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container">
          <h2 className="text-xl sm:text-2xl font-bold text-center lp-hero-title mb-8 sm:mb-10">{t.forWhoTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {t.forWho.map((item, i) => {
              const Icon = FOR_WHO_ICONS[i]
              return (
                <div key={item.title} className="lp-card rounded-2xl p-5 sm:p-6 lp-animate-in h-full">
                  <div className="w-10 h-10 rounded-xl lp-icon-indigo flex items-center justify-center mb-4">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-semibold lp-hero-title text-base sm:text-lg mb-2">{item.title}</h3>
                  <p className="text-sm sm:text-[0.9375rem] lp-muted leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="lp-section lp-section-alt">
        <div className="lp-container-narrow text-center">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold lp-hero-title mb-5 sm:mb-6">{t.builtTitle}</h2>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5">
            {t.builtItems.map((item) => (
              <span key={item} className="lp-pill px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container-prose">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold lp-hero-title mb-5 sm:mb-6 text-center">
            {t.valuesTitle}
          </h2>
          <ul className="space-y-3 sm:space-y-4">
            {t.values.map((value) => (
              <li key={value} className="lp-card lp-value-item">
                <CheckCircle2 size={18} className="text-indigo-500 shrink-0 mt-0.5" />
                <span className="lp-muted">{value}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="lp-section py-10 sm:py-14">
        <div className="lp-live-panel lp-animate-in">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/90 flex items-center justify-center shrink-0 border border-indigo-100">
              <Globe size={22} className="text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold lp-hero-title text-base sm:text-lg">{t.liveTitle}</h3>
              <p className="text-sm sm:text-[0.9375rem] lp-muted mt-1.5 leading-relaxed">{t.liveText}</p>
              <a
                href="https://testsambilngopi.com"
                target="_blank"
                rel="noopener noreferrer"
                className="lp-live-panel__link"
              >
                <Server size={16} className="shrink-0" />
                testsambilngopi.com
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section lp-section-alt">
        <div className="lp-container-narrow text-center lp-animate-in">
          <h2 className="text-xl sm:text-2xl font-bold lp-hero-title">{t.ctaTitle}</h2>
          <p className="mt-3 lp-lead lp-muted">{t.ctaText}</p>
          <Link
            to="/register"
            className="lp-btn-primary inline-flex items-center gap-2 mt-6 sm:mt-8 font-medium px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base"
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
