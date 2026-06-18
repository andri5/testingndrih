import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'

export function LangSwitch({ lang }) {
  return (
    <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden text-xs font-semibold shrink-0">
      <Link
        to="/"
        className={`px-2 sm:px-2.5 py-1.5 transition ${lang === 'id' ? 'bg-indigo-600 text-white' : 'lp-muted hover:bg-slate-50'}`}
        hrefLang="id"
      >
        ID
      </Link>
      <Link
        to="/en"
        className={`px-2 sm:px-2.5 py-1.5 transition ${lang === 'en' ? 'bg-indigo-600 text-white' : 'lp-muted hover:bg-slate-50'}`}
        hrefLang="en"
      >
        EN
      </Link>
    </div>
  )
}

export default function LandingNav({ lang, t }) {
  const home = lang === 'en' ? '/en' : '/'
  const about = lang === 'en' ? '/en/about' : '/about'

  return (
    <header className="lp-nav fixed top-0 inset-x-0 z-50">
      <div className="lp-nav-inner">
        <Link to={home} className="lp-nav-brand flex items-center gap-2 sm:gap-2.5 shrink min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#5E6AD2] flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <span className="font-semibold lp-hero-title hidden min-[400px]:inline">Test Sambil Ngopi</span>
          <span className="font-semibold lp-hero-title min-[400px]:hidden">TSN</span>
        </Link>
        <nav className="lp-nav-links">
          <a href={`${home}#fitur`} className="hidden md:inline text-sm lp-muted hover:text-[#5E6AD2] transition px-2">
            {t.navFeatures}
          </a>
          <a href={`${home}#cara-kerja`} className="hidden md:inline text-sm lp-muted hover:text-[#5E6AD2] transition px-2">
            {t.navHow}
          </a>
          <Link to={about} className="hidden sm:inline text-sm lp-muted hover:text-[#5E6AD2] transition px-2">
            {t.navAbout}
          </Link>
          <LangSwitch lang={lang} />
          <Link to="/login" className="hidden min-[480px]:inline text-sm lp-muted hover:text-[#5E6AD2] transition px-2 py-1.5">
            {t.navLogin}
          </Link>
          <Link
            to="/register"
            className="text-xs sm:text-sm font-medium lp-btn-primary px-2.5 sm:px-4 py-2 rounded-lg whitespace-nowrap"
          >
            <span className="lp-nav-cta-full">{t.navCta}</span>
            <span className="lp-nav-cta-short">{lang === 'en' ? 'Free' : 'Gratis'}</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}

export function LandingFooter({ lang, t }) {
  const about = lang === 'en' ? '/en/about' : '/about'

  return (
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        <div className="flex items-center gap-2 font-medium shrink-0">
          <ShieldCheck size={16} className="text-indigo-500" />
          <span>Test Sambil Ngopi</span>
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 sm:gap-6">
          <Link to={about} className="hover:text-indigo-600 transition">{t.navAbout}</Link>
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
        <p className="text-xs shrink-0">© {new Date().getFullYear()} Test Sambil Ngopi</p>
      </div>
    </footer>
  )
}
