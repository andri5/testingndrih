import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import BrandLogo from './BrandLogo'
import {
  getPublicLang,
  publicAboutPath,
  publicHomePath,
  isAboutPublicPath,
  toPublicPath,
} from '../utils/landingRoutes'

export function LangSwitch({ lang }) {
  const { pathname } = useLocation()
  const idPath = toPublicPath(pathname, 'id')
  const enPath = toPublicPath(pathname, 'en')

  return (
    <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden text-xs font-semibold shrink-0">
      <Link
        to={idPath}
        className={`px-2 sm:px-2.5 py-1.5 transition ${lang === 'id' ? 'bg-indigo-600 text-white' : 'lp-muted hover:bg-slate-50'}`}
        hrefLang="id"
      >
        ID
      </Link>
      <Link
        to={enPath}
        className={`px-2 sm:px-2.5 py-1.5 transition ${lang === 'en' ? 'bg-indigo-600 text-white' : 'lp-muted hover:bg-slate-50'}`}
        hrefLang="en"
      >
        EN
      </Link>
    </div>
  )
}

export default function LandingNav({ lang, t }) {
  const { pathname } = useLocation()
  const home = publicHomePath(lang)
  const about = publicAboutPath(lang)
  const onAbout = isAboutPublicPath(pathname)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const mobileLinks = [
    { type: 'anchor', href: `${home}#fitur`, label: t.navFeatures },
    { type: 'anchor', href: `${home}#cara-kerja`, label: t.navHow },
    ...(!onAbout ? [{ type: 'anchor', href: `${home}#saran`, label: t.navFeedback }] : []),
    { type: 'route', to: about, label: t.navAbout, active: onAbout },
    { type: 'route', to: '/login', label: t.navLogin },
  ]

  return (
    <header className="lp-nav fixed top-0 inset-x-0 z-50">
      <div className="lp-nav-inner">
        <Link to={home} className="lp-nav-brand flex items-center gap-2 sm:gap-2.5 shrink min-w-0">
          <BrandLogo size="sm" className="shrink-0 shadow-md shadow-indigo-200" title="Test Sambil Ngopi" />
          <span className="font-semibold lp-hero-title hidden min-[400px]:inline">Test Sambil Ngopi</span>
          <span className="font-semibold lp-hero-title min-[400px]:hidden">TSN</span>
        </Link>

        <nav className="lp-nav-links" aria-label="Main navigation">
          {/* Desktop links */}
          <a href={`${home}#fitur`} className="hidden md:inline text-sm lp-muted hover:text-[#5E6AD2] transition px-2">
            {t.navFeatures}
          </a>
          <a href={`${home}#cara-kerja`} className="hidden md:inline text-sm lp-muted hover:text-[#5E6AD2] transition px-2">
            {t.navHow}
          </a>
          {!onAbout && (
            <a href={`${home}#saran`} className="hidden md:inline text-sm lp-muted hover:text-[#5E6AD2] transition px-2">
              {t.navFeedback}
            </a>
          )}
          <Link
            to={about}
            className={`hidden md:inline text-sm transition px-2 ${onAbout ? 'text-[#5E6AD2] font-medium' : 'lp-muted hover:text-[#5E6AD2]'}`}
            aria-current={onAbout ? 'page' : undefined}
          >
            {t.navAbout}
          </Link>
          <LangSwitch lang={lang} />
          <Link to="/login" className="hidden md:inline text-sm lp-muted hover:text-[#5E6AD2] transition px-2 py-1.5">
            {t.navLogin}
          </Link>
          <Link
            to="/register"
            className="text-xs sm:text-sm font-medium lp-btn-primary px-2.5 sm:px-4 py-2 rounded-lg whitespace-nowrap"
          >
            <span className="lp-nav-cta-full">{t.navCta}</span>
            <span className="lp-nav-cta-short">{lang === 'en' ? 'Free' : 'Gratis'}</span>
          </Link>

          <button
            type="button"
            className="lp-nav-menu-btn md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-controls="lp-mobile-menu"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>
      </div>

      {mobileOpen && (
        <>
          <button
            type="button"
            className="lp-nav-mobile-backdrop md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
          <nav
            id="lp-mobile-menu"
            className="lp-nav-mobile md:hidden"
            aria-label="Mobile navigation"
          >
            {mobileLinks.map((item) =>
              item.type === 'anchor' ? (
                <a
                  key={item.href}
                  href={item.href}
                  className="lp-nav-mobile-link"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`lp-nav-mobile-link ${item.active ? 'lp-nav-mobile-link--active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                  aria-current={item.active ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              )
            )}
            <Link
              to="/register"
              className="lp-btn-primary lp-nav-mobile-cta"
              onClick={() => setMobileOpen(false)}
            >
              {t.navCta}
            </Link>
          </nav>
        </>
      )}
    </header>
  )
}

export function LandingFooter({ lang, t }) {
  const about = publicAboutPath(lang)

  return (
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        <div className="flex items-center gap-2 font-medium shrink-0">
          <BrandLogo variant="mark" size={18} className="text-indigo-500 shrink-0" />
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
