/** Bilingual public routes: / (en default) and /id (Indonesian) */

const ID_PREFIX = '/id'
const LEGACY_EN_PREFIX = '/en'

export function isIndonesianPublicPath(pathname) {
  return pathname === ID_PREFIX || pathname.startsWith(`${ID_PREFIX}/`)
}

export function isEnglishPublicPath(pathname) {
  if (isIndonesianPublicPath(pathname)) return false
  if (pathname === LEGACY_EN_PREFIX || pathname.startsWith(`${LEGACY_EN_PREFIX}/`)) return true
  return true
}

export function getPublicLang(pathname) {
  return isIndonesianPublicPath(pathname) ? 'id' : 'en'
}

function stripLegacyEnglishPrefix(pathname) {
  if (pathname === LEGACY_EN_PREFIX) return '/'
  if (pathname.startsWith(`${LEGACY_EN_PREFIX}/`)) {
    return pathname.slice(LEGACY_EN_PREFIX.length) || '/'
  }
  return pathname
}

function stripIndonesianPrefix(pathname) {
  if (pathname === ID_PREFIX) return '/'
  if (pathname.startsWith(`${ID_PREFIX}/`)) {
    return pathname.slice(ID_PREFIX.length) || '/'
  }
  return pathname
}

/** Normalize to English base path: /, /about, /foo */
export function toEnglishBasePath(pathname) {
  if (isIndonesianPublicPath(pathname)) {
    return stripIndonesianPrefix(pathname)
  }
  return stripLegacyEnglishPrefix(pathname)
}

/** @deprecated use toEnglishBasePath */
export function toIndonesianPublicPath(pathname) {
  return toPublicPath(pathname, 'id')
}

/** @deprecated use toEnglishBasePath */
export function toEnglishPublicPath(pathname) {
  return toPublicPath(pathname, 'en')
}

export function toPublicPath(pathname, lang) {
  const base = toEnglishBasePath(pathname)
  if (lang === 'id') {
    if (base === '/') return ID_PREFIX
    return `${ID_PREFIX}${base}`
  }
  return base
}

export function publicHomePath(lang) {
  return lang === 'id' ? ID_PREFIX : '/'
}

export function publicAboutPath(lang) {
  return lang === 'id' ? `${ID_PREFIX}/about` : '/about'
}

export function isAboutPublicPath(pathname) {
  const base = toEnglishBasePath(pathname)
  return base === '/about'
}

export function isLegacyEnglishRedirect(pathname) {
  return pathname === LEGACY_EN_PREFIX || pathname.startsWith(`${LEGACY_EN_PREFIX}/`)
}

export function legacyEnglishRedirectTarget(pathname) {
  return toEnglishBasePath(pathname)
}
