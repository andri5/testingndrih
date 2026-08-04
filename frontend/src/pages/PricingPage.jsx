import { Link, useLocation } from 'react-router-dom'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import LandingNav, { LandingFooter } from '../components/landing/LandingNav'
import { landingCopy } from '../i18n/landingI18n'
import { pricingCopy, PRICING_SEO } from '../i18n/pricingI18n'
import { getPublicLang } from '../utils/landingRoutes'
import { usePublicSEO } from '../hooks/useLandingSEO'

export default function PricingPage() {
  const { pathname } = useLocation()
  const lang = getPublicLang(pathname)
  const tNav = landingCopy[lang] || landingCopy.en
  const t = pricingCopy[lang] || pricingCopy.en
  usePublicSEO(lang, PRICING_SEO, { id: '/id/pricing', en: '/pricing' })

  return (
    <div className="landing-page min-h-screen overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 lp-glow" aria-hidden />
      <LandingNav t={tNav} lang={lang} />

      <section className="relative pt-36 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center mb-12">
          <h1 className="lp-hero-title text-3xl sm:text-4xl font-bold">{t.title}</h1>
          <p className="mt-4 lp-muted max-w-2xl mx-auto">{t.subtitle}</p>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {t.plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 text-left bg-white/90 shadow-sm ${
                plan.highlight ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'
              }`}
            >
              {plan.badge && (
                <span className="inline-block text-[11px] font-bold uppercase tracking-wide text-indigo-600 mb-2">
                  {plan.badge}
                </span>
              )}
              <h2 className="text-xl font-bold lp-hero-title">{plan.name}</h2>
              <p className="mt-1 text-3xl font-bold text-slate-900">
                {plan.price}
                <span className="text-sm font-medium text-slate-500"> {plan.period}</span>
              </p>
              <p className="mt-3 text-sm lp-muted">{plan.desc}</p>
              <ul className="mt-5 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-slate-600">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {plan.ctaTo.startsWith('http') ? (
                <a
                  href={plan.ctaTo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-6 inline-flex items-center gap-2 font-medium px-4 py-2.5 rounded-xl text-sm ${
                    plan.highlight ? 'lp-btn-primary' : 'lp-btn-secondary'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight size={16} />
                </a>
              ) : (
                <Link
                  to={plan.ctaTo}
                  className={`mt-6 inline-flex items-center gap-2 font-medium px-4 py-2.5 rounded-xl text-sm ${
                    plan.highlight ? 'lp-btn-primary' : 'lp-btn-secondary'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight size={16} />
                </Link>
              )}
            </div>
          ))}
        </div>

        <p className="max-w-3xl mx-auto mt-10 text-center text-sm lp-subtle">{t.footnote}</p>
      </section>

      <LandingFooter lang={lang} t={tNav} />
    </div>
  )
}
