import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import BrandLogo from '../BrandLogo'
import useNavScrollSpy from '../../hooks/useNavScrollSpy'
import {
  publicAboutPath,
  publicHomePath,
  isAboutPublicPath,
  toPublicPath,
} from '../../utils/landingRoutes'

export function LangSwitch({ lang }) {
  const { pathname } = useLocation()
  const idPath = toPublicPath(pathname, 'id')
  const enPath = toPublicPath(pathname, 'en')

  return (
    <div className="lp-lang-switch" role="group" aria-label="Language">
      <Link
        to={idPath}
        className={`lp-lang-switch__btn ${lang === 'id' ? 'lp-lang-switch__btn--active' : ''}`}
        hrefLang="id"
      >
        ID
      </Link>
      <Link
        to={enPath}
        className={`lp-lang-switch__btn ${lang === 'en' ? 'lp-lang-switch__btn--active' : ''}`}
        hrefLang="en"
      >
        EN
      </Link>
    </div>
  )
}

function NavLink({ href, active, children }) {
  if (href.includes('#')) {
    return (
      <a href={href} className={`lp-nav-link ${active ? 'lp-nav-link--active' : ''}`}>
        {children}
      </a>
    )
  }
  return (
    <Link to={href} className={`lp-nav-link ${active ? 'lp-nav-link--active' : ''}`}>
      {children}
    </Link>
  )
}

export default function LandingNav({ lang, t }) {
  const { pathname } = useLocation()
  const home = publicHomePath(lang)
  const about = publicAboutPath(lang)
  const onAbout = isAboutPublicPath(pathname)
  const onHome = !onAbout
  const activeSection = useNavScrollSpy()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const centerLinks = [
    ...(onHome
      ? [
          { href: `${home}#fitur`, label: t.navFeatures, active: activeSection === 'fitur' },
          { href: `${home}#cara-kerja`, label: t.navHow, active: activeSection === 'cara-kerja' },
          { href: `${home}#saran`, label: t.navFeedback, active: activeSection === 'saran' },
        ]
      : []),
    { href: about, label: t.navAbout, active: onAbout },
  ]

  return (
    <header className={`lp-nav ${scrolled ? 'lp-nav--scrolled' : ''}`}>
      <div className="lp-nav-shell">
        <Link to={home} className="lp-nav-brand">
          <BrandLogo size="sm" className="lp-nav-brand__logo" title="Test Sambil Ngopi" />
          <span className="lp-nav-brand__text">
            <span className="lp-nav-brand__name hidden min-[420px]:block">Test Sambil Ngopi</span>
            <span className="lp-nav-brand__name min-[420px]:hidden">TSN</span>
            <span className="lp-nav-brand__tagline hidden xl:block">{t.badge}</span>
          </span>
        </Link>

        <nav className="lp-nav-center" aria-label="Main navigation">
          {centerLinks.map((item) => (
            <NavLink key={item.href} href={item.href} active={item.active}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="lp-nav-actions">
          <LangSwitch lang={lang} />
          <Link to="/login" className="lp-nav-login">
            <LogIn size={15} />
            <span className="hidden sm:inline">{t.navLogin}</span>
          </Link>
        </div>
      </div>
    </header>
  )
}

export function LandingFooter({ lang, t }) {
  const home = publicHomePath(lang)
  const about = publicAboutPath(lang)

  const productLinks = [
    { href: `${home}#fitur`, label: t.navFeatures },
    { href: `${home}#cara-kerja`, label: t.navHow },
    { href: `${home}#saran`, label: t.navFeedback },
    { href: about, label: t.navAbout, isRoute: true },
  ]

  return (
    <footer className="lp-footer">
      <div className="lp-footer-glow" aria-hidden />
      <div className="lp-footer-main">
        <div className="lp-footer-grid">
          <div className="lp-footer-brand">
            <Link to={home} className="lp-footer-brand__head">
              <BrandLogo size={36} className="lp-footer-brand__logo" title="Test Sambil Ngopi" />
              <span className="lp-footer-brand__name">Test Sambil Ngopi</span>
            </Link>
            <p className="lp-footer-brand__tagline">{t.footerTagline}</p>
          </div>

          <div className="lp-footer-col">
            <h3 className="lp-footer-col__title">{t.footerProduct}</h3>
            <ul className="lp-footer-col__list">
              {productLinks.map((item) => (
                <li key={item.label}>
                  {item.isRoute ? (
                    <Link to={item.href}>{item.label}</Link>
                  ) : (
                    <a href={item.href}>{item.label}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="lp-footer-bottom">
        <p className="lp-footer-copy">© {new Date().getFullYear()} Test Sambil Ngopi. All rights reserved.</p>
      </div>
    </footer>
  )
}
