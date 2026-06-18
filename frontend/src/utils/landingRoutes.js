/** Bilingual public routes: / (id) and /en (en) prefixes */

const EN_PREFIX = '/en'

export function isEnglishPublicPath(pathname) {
  return pathname === EN_PREFIX || pathname.startsWith(`${EN_PREFIX}/`)
}

export function getPublicLang(pathname) {
  return isEnglishPublicPath(pathname) ? 'en' : 'id'
}

/** Strip /en prefix; /en → /, /en/about → /about */
export function toIndonesianPublicPath(pathname) {
  if (!isEnglishPublicPath(pathname)) return pathname
  if (pathname === EN_PREFIX) return '/'
  return pathname.slice(EN_PREFIX.length) || '/'
}

/** Add /en prefix; / → /en, /about → /en/about */
export function toEnglishPublicPath(pathname) {
  const base = toIndonesianPublicPath(pathname)
  if (base === '/') return EN_PREFIX
  return `${EN_PREFIX}${base}`
}

export function toPublicPath(pathname, lang) {
  return lang === 'en' ? toEnglishPublicPath(pathname) : toIndonesianPublicPath(pathname)
}

export function publicHomePath(lang) {
  return lang === 'en' ? EN_PREFIX : '/'
}

export function publicAboutPath(lang) {
  return lang === 'en' ? `${EN_PREFIX}/about` : '/about'
}

export function isAboutPublicPath(pathname) {
  const normalized = toIndonesianPublicPath(pathname)
  return normalized === '/about'
}
