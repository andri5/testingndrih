import { Link, useLocation } from 'react-router-dom'
import {
  PlayCircle,
  ClipboardList,
  BarChart2,
  Layers,
  Sparkles,
  GitCompare,
  Zap,
  Globe,
  Clock,
  Link2,
  Activity,
  Shield,
  Gauge,
  Image,
  Webhook,
  ArrowRight,
  CheckCircle2,
  Mic,
  Bot,
} from 'lucide-react'
import LandingNav, { LandingFooter } from '../components/landing/LandingNav'
import LandingFeedbackSection from '../components/landing/LandingFeedbackSection'
import FeaturesCarousel from '../components/landing/FeaturesCarousel'
import useScrollReveal from '../hooks/useScrollReveal'
import { landingCopy, ADVANCED_LABELS } from '../i18n/landingI18n'
import { useLandingSEO } from '../hooks/useLandingSEO'
import { getPublicLang } from '../utils/landingRoutes'

const FEATURE_ICONS = [Mic, ClipboardList, PlayCircle, Sparkles, Layers, BarChart2, GitCompare, Webhook]
const FEATURE_ICON_CLASSES = [
  'lp-icon-indigo', 'lp-icon-teal', 'lp-icon-emerald', 'lp-icon-violet',
  'lp-icon-indigo', 'lp-icon-amber', 'lp-icon-rose', 'lp-icon-sky',
]
const ADVANCED_ICONS = [Link2, Clock, Globe, Activity, Gauge, Shield, Image, Zap]
const STEP_NUMS = ['01', '02', '03', '04']

function HeroMockup({ t }) {
  return (
    <div className="lp-hero-preview relative rounded-2xl overflow-hidden lp-float shadow-xl shadow-indigo-100/80 border border-indigo-100">
      <div className="lp-hero-preview__chrome flex items-center gap-2 px-4 py-2.5 bg-slate-100 border-b border-slate-200">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        <span className="ml-2 text-[10px] sm:text-xs lp-subtle font-mono truncate">testsambilngopi.com/dashboard</span>
      </div>
      <div className="lp-hero-preview__body grid grid-cols-[4.5rem_1fr] sm:grid-cols-[5.5rem_1fr] min-h-[220px] sm:min-h-[260px]">
        <div className="bg-slate-50 border-r border-slate-200 p-2 space-y-1.5 hidden xs:block sm:block">
          {['Dashboard', 'Scenarios', 'Runs'].map((item, i) => (
            <div
              key={item}
              className={`text-[9px] sm:text-[10px] px-2 py-1.5 rounded-md truncate ${
                i === 1 ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-slate-500'
              }`}
            >
              {item}
            </div>
          ))}
        </div>
        <div className="p-3 sm:p-4 space-y-2.5 bg-white">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-semibold lp-hero-title truncate">{t.mockupTitle}</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0">
              PASSED
            </span>
          </div>
          {[
            { step: 'NAVIGATE', time: '1.2s' },
            { step: 'FILL email', time: '0.4s' },
            { step: 'CLICK Submit', time: '0.8s' },
            { step: 'ASSERTION dashboard', time: '0.3s' },
          ].map((row) => (
            <div key={row.step} className="lp-mockup-row flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 rounded-lg">
              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              <span className="text-[10px] sm:text-xs lp-muted flex-1 font-mono truncate">{row.step}</span>
              <span className="text-[10px] lp-subtle shrink-0">{row.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LandingPage({ lang: langProp }) {
  const { pathname } = useLocation()
  const lang = langProp ?? getPublicLang(pathname)
  const t = landingCopy[lang] || landingCopy.en
  useLandingSEO(lang)
  const [stepsRef, stepsVisible] = useScrollReveal(0.1)

  return (
    <div className="landing-page min-h-screen overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 lp-glow" aria-hidden />

      <LandingNav t={t} lang={lang} />

      <section className="relative pt-36 pb-16 sm:pt-40 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="lp-animate-in max-w-xl">
            <p className="inline-flex items-center gap-2 text-xs font-semibold lp-badge rounded-full px-3 py-1.5 mb-6">
              <Bot size={14} />
              {t.badge}
            </p>
            <h1 className="lp-hero-title text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              {t.heroTitle}{' '}
              <span className="lp-gradient-text">{t.heroHighlight}</span>
            </h1>
            <p className="mt-4 sm:mt-5 lp-lead lp-muted max-w-xl">{t.heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="lp-btn-primary inline-flex items-center gap-2 font-medium px-5 py-3 rounded-xl">
                {t.ctaPrimary}
                <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="lp-btn-secondary inline-flex items-center gap-2 font-medium px-5 py-3 rounded-xl">
                {t.ctaSecondary}
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-sm lp-subtle">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" /> {t.trust1}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" /> {t.trust2}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" /> {t.trust3}
              </span>
            </div>
          </div>
          <div className="lp-animate-in lp-delay-2">
            <HeroMockup t={t} />
          </div>
        </div>
      </section>

      <section id="fitur" className="py-16 sm:py-24 px-4 sm:px-6 lp-section-alt">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 lp-animate-in lp-delay-1">
            <h2 className="text-2xl sm:text-3xl font-bold lp-hero-title">{t.featuresTitle}</h2>
            <p className="mt-3 lp-muted text-base">{t.featuresSubtitle}</p>
          </div>
          <FeaturesCarousel
            features={t.features}
            icons={FEATURE_ICONS}
            iconClasses={FEATURE_ICON_CLASSES}
          />
        </div>
      </section>

      <section id="cara-kerja" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto" ref={stepsRef}>
          <h2 className="text-2xl sm:text-3xl font-bold text-center lp-hero-title mb-12 lp-animate-in">
            {t.howTitle}
          </h2>
          <div className={`lp-steps-track ${stepsVisible ? 'lp-steps-track--visible' : ''}`}>
            {t.steps.map((s, i) => (
              <div
                key={s.title}
                className={`lp-step-card lp-step-card--animated ${stepsVisible ? 'lp-step-card--visible' : ''}`}
                style={{ '--step-index': i }}
              >
                <span className="lp-step-num">{STEP_NUMS[i]}</span>
                <h3 className="text-lg font-semibold lp-hero-title mt-2 mb-2">{s.title}</h3>
                <p className="text-sm lp-muted leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto lp-ai-panel rounded-3xl p-8 sm:p-12 lp-animate-in">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-indigo-600 text-sm font-semibold mb-4">
                <Sparkles size={18} />
                {t.aiBadge}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold lp-hero-title">{t.aiTitle}</h2>
              <p className="mt-4 lp-muted leading-relaxed text-base">{t.aiSubtitle}</p>
              <ul className="mt-6 space-y-3">
                {t.aiItems.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm lp-muted">
                    <CheckCircle2 size={16} className="text-indigo-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lp-code p-5 font-mono text-xs">
              <p className="text-indigo-300 mb-2">// Prompt</p>
              <p className="text-slate-100 mb-4">&quot;{t.aiPrompt}&quot;</p>
              <p className="text-teal-300 mb-2">{t.aiGenerated}</p>
              <p className="text-slate-300">NAVIGATE → FILL → FILL → CLICK → WAIT → ASSERTION</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6 lp-section-alt">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl font-bold lp-hero-title mb-3">{t.advancedTitle}</h2>
          <p className="lp-muted text-sm sm:text-base mb-8 max-w-lg mx-auto">{t.advancedSubtitle}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {ADVANCED_LABELS.map((label, i) => {
              const Icon = ADVANCED_ICONS[i]
              return (
                <span key={label} className="lp-pill inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium">
                  <Icon size={14} className="text-indigo-500" />
                  {label}
                </span>
              )
            })}
          </div>
        </div>
      </section>

      <LandingFeedbackSection t={t} lang={lang} />

      <LandingFooter lang={lang} t={t} />
    </div>
  )
}
