import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  PlayCircle,
  ClipboardList,
  BarChart2,
  Layers,
  Sparkles,
  GitCompare,
  Star,
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
import { landingCopy, ADVANCED_LABELS } from '../i18n/landingI18n'
import { useLandingSEO } from '../hooks/useLandingSEO'

const FEATURE_ICONS = [Mic, ClipboardList, PlayCircle, Sparkles, Layers, BarChart2, GitCompare, Webhook]
const FEATURE_ICON_CLASSES = [
  'lp-icon-indigo', 'lp-icon-teal', 'lp-icon-emerald', 'lp-icon-violet',
  'lp-icon-indigo', 'lp-icon-amber', 'lp-icon-rose', 'lp-icon-sky',
]
const ADVANCED_ICONS = [Link2, Clock, Globe, Activity, Gauge, Shield, Image, Zap]
const STAGGER = ['lp-delay-1', 'lp-delay-2', 'lp-delay-3', 'lp-delay-4']
const STEP_NUMS = ['01', '02', '03', '04']

function LangSwitch({ lang }) {
  return (
    <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden text-xs font-semibold">
      <Link
        to="/"
        className={`px-2.5 py-1.5 transition ${lang === 'id' ? 'bg-indigo-600 text-white' : 'lp-muted hover:bg-slate-50'}`}
        hrefLang="id"
      >
        ID
      </Link>
      <Link
        to="/en"
        className={`px-2.5 py-1.5 transition ${lang === 'en' ? 'bg-indigo-600 text-white' : 'lp-muted hover:bg-slate-50'}`}
        hrefLang="en"
      >
        EN
      </Link>
    </div>
  )
}

function Nav({ t, lang }) {
  return (
    <header className="lp-nav fixed top-0 inset-x-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <Link to={lang === 'en' ? '/en' : '/'} className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#5E6AD2] flex items-center justify-center shadow-md shadow-indigo-200">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <span className="font-semibold lp-hero-title text-sm sm:text-base">Test Sambil Ngopi</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <a href="#fitur" className="hidden sm:inline text-sm lp-muted hover:text-[#5E6AD2] transition px-2">
            {t.navFeatures}
          </a>
          <a href="#cara-kerja" className="hidden sm:inline text-sm lp-muted hover:text-[#5E6AD2] transition px-2">
            {t.navHow}
          </a>
          <LangSwitch lang={lang} />
          <Link to="/login" className="hidden xs:inline text-sm lp-muted hover:text-[#5E6AD2] transition px-2 py-1.5">
            {t.navLogin}
          </Link>
          <Link to="/register" className="text-sm font-medium lp-btn-primary px-3 sm:px-4 py-2 rounded-lg whitespace-nowrap">
            {t.navCta}
          </Link>
        </nav>
      </div>
    </header>
  )
}

function HeroMockup({ t }) {
  return (
    <div className="lp-mockup relative rounded-2xl overflow-hidden lp-float">
      <div className="lp-mockup-bar flex items-center gap-2 px-4 py-3">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        <span className="ml-3 text-xs lp-subtle font-mono">execution — scenario run</span>
      </div>
      <div className="p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold lp-hero-title">{t.mockupTitle}</span>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
            PASSED
          </span>
        </div>
        {[
          { step: 'NAVIGATE', time: '1.2s' },
          { step: 'FILL email', time: '0.4s' },
          { step: 'CLICK Submit', time: '0.8s' },
          { step: 'ASSERTION dashboard', time: '0.3s' },
        ].map((row) => (
          <div key={row.step} className="lp-mockup-row flex items-center gap-3 px-3 py-2.5 rounded-lg">
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
            <span className="text-xs lp-muted flex-1 font-mono">{row.step}</span>
            <span className="text-[10px] lp-subtle">{row.time}</span>
          </div>
        ))}
        <div className="flex gap-2 pt-1">
          <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center gap-1">
            <Star size={10} /> Favorite
          </span>
          <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-violet-50 text-violet-600 border border-violet-100 flex items-center gap-1">
            <Sparkles size={10} /> AI
          </span>
          <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1">
            <GitCompare size={10} /> Diff
          </span>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage({ lang = 'id' }) {
  const t = landingCopy[lang] || landingCopy.id
  useLandingSEO(lang)

  return (
    <div className="landing-page min-h-screen overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 lp-glow" aria-hidden />

      <Nav t={t} lang={lang} />

      <section className="relative pt-28 pb-16 sm:pt-32 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="lp-animate-in">
            <p className="inline-flex items-center gap-2 text-xs font-semibold lp-badge rounded-full px-3 py-1.5 mb-6">
              <Bot size={14} />
              {t.badge}
            </p>
            <h1 className="lp-hero-title text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              {t.heroTitle}{' '}
              <span className="lp-gradient-text">{t.heroHighlight}</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg lp-muted leading-relaxed max-w-xl">{t.heroSubtitle}</p>
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {t.features.map((f, i) => {
              const Icon = FEATURE_ICONS[i]
              return (
                <div key={f.title} className={`lp-card rounded-2xl p-5 lp-animate-in ${STAGGER[i % 4]}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${FEATURE_ICON_CLASSES[i]}`}>
                    <Icon size={20} />
                  </div>
                  <h3 className="font-semibold lp-hero-title mb-2">{f.title}</h3>
                  <p className="text-sm lp-muted leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="cara-kerja" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center lp-hero-title mb-12 lp-animate-in">
            {t.howTitle}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {t.steps.map((s, i) => (
              <div key={s.title} className={`lp-step-card lp-animate-in ${STAGGER[i]}`}>
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

      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center lp-animate-in">
          <h2 className="text-2xl sm:text-3xl font-bold lp-hero-title">{t.ctaFinalTitle}</h2>
          <p className="mt-4 lp-muted text-base">{t.ctaFinalSubtitle}</p>
          <Link
            to="/register"
            className="lp-btn-primary inline-flex items-center gap-2 mt-8 font-medium px-8 py-3.5 rounded-xl"
          >
            {t.ctaFinalButton}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="lp-footer py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck size={16} className="text-indigo-500" />
            <span>Test Sambil Ngopi</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <Link to="/login" className="hover:text-indigo-600 transition">{t.navLogin}</Link>
            <Link to="/register" className="hover:text-indigo-600 transition">{t.navCta}</Link>
            <a
              href="https://testsambilngopi.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-600 transition"
            >
              {t.footerProduction}
            </a>
          </div>
          <p className="text-xs">© {new Date().getFullYear()} Test Sambil Ngopi</p>
        </div>
      </footer>
    </div>
  )
}
