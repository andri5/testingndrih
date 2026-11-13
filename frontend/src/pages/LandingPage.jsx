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
    <div className="lp-hero-preview relative overflow-hidden lp-float border border-white/10 shadow-2xl shadow-black/30 rounded-xl">
      <div className="lp-hero-preview__chrome flex items-center gap-2 px-4 py-2.5 bg-[#0a2425] border-b border-white/10">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-2 text-[10px] sm:text-xs text-teal-100/50 font-mono truncate">testsambilngopi.com/dashboard</span>
      </div>
      <div className="lp-hero-preview__body grid grid-cols-[4.5rem_1fr] sm:grid-cols-[5.5rem_1fr] min-h-[220px] sm:min-h-[260px] bg-white">
        <div className="bg-[#f7fafa] border-r border-[#d5e0e0] p-2 space-y-1.5 hidden xs:block sm:block">
          {['Dashboard', 'Scenarios', 'Runs'].map((item, i) => (
            <div
              key={item}
              className={`text-[9px] sm:text-[10px] px-2 py-1.5 rounded-md truncate ${
                i === 1 ? 'bg-[#ccfbf1] text-[#0f766e] font-semibold' : 'text-slate-500'
              }`}
            >
              {item}
            </div>
          ))}
        </div>
        <div className="p-3 sm:p-4 space-y-2.5 bg-white">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-semibold text-[#12202a] truncate">{t.mockupTitle}</span>
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
            <div key={row.step} className="lp-mockup-row flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 rounded-lg bg-[#f4f7f7]">
              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              <span className="text-[10px] sm:text-xs text-[#5b6b73] flex-1 font-mono truncate">{row.step}</span>
              <span className="text-[10px] text-[#8a9aa2] shrink-0">{row.time}</span>
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
      <section className="lp-hero-band relative">
        <LandingNav t={t} lang={lang} variant="dark" />

        <div className="relative pt-28 pb-16 sm:pt-32 sm:pb-24 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="lp-animate-in max-w-xl">
              <p className="inline-flex items-center gap-2 text-xs font-semibold lp-badge rounded-full px-3 py-1.5 mb-6">
                <Bot size={14} />
                {t.badge}
              </p>
              <h1 className="lp-hero-title text-3xl sm:text-4xl lg:text-5xl leading-tight">
                {t.heroTitle}{' '}
                <span className="lp-gradient-text">{t.heroHighlight}</span>
              </h1>
              <p className="mt-4 sm:mt-5 lp-lead lp-muted max-w-xl">{t.heroSubtitle}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/register" className="lp-btn-primary inline-flex items-center gap-2 px-5 py-3 rounded-xl">
                  {t.ctaPrimary}
                  <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="lp-btn-secondary inline-flex items-center gap-2 font-medium px-5 py-3 rounded-xl">
                  {t.ctaSecondary}
                </Link>
              </div>
            </div>
            <div className="lp-animate-in lp-delay-2">
              <HeroMockup t={t} />
            </div>
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

      <section id="jangkauan" className="py-14 sm:py-20 px-4 sm:px-6 lp-section-alt">
        <div className="max-w-4xl mx-auto text-center lp-animate-in">
          <h2 className="text-xl sm:text-2xl font-bold lp-hero-title mb-3">{t.reachTitle}</h2>
          <p className="lp-muted text-sm sm:text-base leading-relaxed mb-8 max-w-2xl mx-auto">{t.reachSubtitle}</p>

          <div className="grid sm:grid-cols-2 gap-4 text-left mb-8">
            <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500 text-emerald-950 text-xs font-bold uppercase tracking-wide mb-3">
                <Globe size={14} />
                {t.reachPublicLabel}
              </div>
              <ul className="space-y-2">
                {(t.reachPublicItems || []).map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm lp-muted">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-amber-500/45 bg-amber-500/5 p-5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500 text-amber-950 text-xs font-bold uppercase tracking-wide mb-3">
                <Shield size={14} />
                {t.reachInternalLabel}
              </div>
              <ul className="space-y-2">
                {(t.reachInternalItems || []).map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm lp-muted">
                    <CheckCircle2 size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <ul className="text-left space-y-2 max-w-xl mx-auto mb-6">
            {[t.reachBullet1, t.reachBullet2, t.reachBullet3].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm lp-muted">
                <CheckCircle2 size={16} className="text-teal-600 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <a
            href="https://github.com/andri5/testingndrih/blob/main/docs/RUN_INTERNAL.md"
            target="_blank"
            rel="noopener noreferrer"
            className="lp-btn-secondary inline-flex items-center gap-2 font-medium px-4 py-2.5 rounded-xl text-sm"
          >
            {t.reachCta}
            <ArrowRight size={16} />
          </a>
        </div>
      </section>

      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto lp-ai-panel rounded-3xl p-8 sm:p-12 lp-animate-in">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-teal-700 text-sm font-semibold mb-4">
                <Sparkles size={18} />
                {t.aiBadge}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold lp-hero-title">{t.aiTitle}</h2>
              <p className="mt-4 lp-muted leading-relaxed text-base">{t.aiSubtitle}</p>
              <ul className="mt-6 space-y-3">
                {t.aiItems.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm lp-muted">
                    <CheckCircle2 size={16} className="text-teal-600 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lp-code p-5 font-mono text-xs">
              <p className="text-teal-300 mb-2">// Prompt</p>
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
                  <Icon size={14} className="text-teal-600" />
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
