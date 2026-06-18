import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'

export function LangSwitch({ lang }) {
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

export default function LandingNav({ lang, t }) {
  const home = lang === 'en' ? '/en' : '/'
  const about = lang === 'en' ? '/en/about' : '/about'

  return (
    <header className="lp-nav fixed top-0 inset-x-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <Link to={home} className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#5E6AD2] flex items-center justify-center shadow-md shadow-indigo-200">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <span className="font-semibold lp-hero-title text-sm sm:text-base">Test Sambil Ngopi</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <a href={`${home}#fitur`} className="hidden sm:inline text-sm lp-muted hover:text-[#5E6AD2] transition px-2">
            {t.navFeatures}
          </a>
          <a href={`${home}#cara-kerja`} className="hidden sm:inline text-sm lp-muted hover:text-[#5E6AD2] transition px-2">
            {t.navHow}
          </a>
          <Link to={about} className="hidden sm:inline text-sm lp-muted hover:text-[#5E6AD2] transition px-2">
            {t.navAbout}
          </Link>
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

export function LandingFooter({ lang, t }) {
  const about = lang === 'en' ? '/en/about' : '/about'

  return (
    <footer className="lp-footer py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-2 font-medium">
          <ShieldCheck size={16} className="text-indigo-500" />
          <span>Test Sambil Ngopi</span>
        </div>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
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
        <p className="text-xs">© {new Date().getFullYear()} Test Sambil Ngopi</p>
      </div>
    </footer>
  )
}
