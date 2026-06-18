import {
  getPublicLang,
  isIndonesianPublicPath,
  isEnglishPublicPath,
  toPublicPath,
  publicHomePath,
  publicAboutPath,
  isAboutPublicPath,
  toEnglishBasePath,
  legacyEnglishRedirectTarget,
} from '../landingRoutes.js'

describe('landingRoutes', () => {
  it('detects language paths', () => {
    expect(isIndonesianPublicPath('/id')).toBe(true)
    expect(isIndonesianPublicPath('/id/about')).toBe(true)
    expect(isEnglishPublicPath('/')).toBe(true)
    expect(isEnglishPublicPath('/about')).toBe(true)
    expect(isEnglishPublicPath('/en')).toBe(true)
    expect(isIndonesianPublicPath('/en')).toBe(false)
  })

  it('defaults to english for root paths', () => {
    expect(getPublicLang('/')).toBe('en')
    expect(getPublicLang('/about')).toBe('en')
    expect(getPublicLang('/id')).toBe('id')
    expect(getPublicLang('/id/about')).toBe('id')
  })

  it('switches about paths between languages', () => {
    expect(toPublicPath('/about', 'id')).toBe('/id/about')
    expect(toPublicPath('/id/about', 'en')).toBe('/about')
  })

  it('switches home paths between languages', () => {
    expect(toPublicPath('/', 'id')).toBe('/id')
    expect(toPublicPath('/id', 'en')).toBe('/')
  })

  it('preserves unknown public paths for 404', () => {
    expect(toPublicPath('/foo', 'id')).toBe('/id/foo')
    expect(toPublicPath('/id/foo', 'en')).toBe('/foo')
  })

  it('publicAboutPath', () => {
    expect(publicAboutPath('id')).toBe('/id/about')
    expect(publicAboutPath('en')).toBe('/about')
  })

  it('isAboutPublicPath', () => {
    expect(isAboutPublicPath('/about')).toBe(true)
    expect(isAboutPublicPath('/id/about')).toBe(true)
    expect(isAboutPublicPath('/')).toBe(false)
  })

  it('legacy english redirects', () => {
    expect(legacyEnglishRedirectTarget('/en')).toBe('/')
    expect(legacyEnglishRedirectTarget('/en/about')).toBe('/about')
    expect(toEnglishBasePath('/en/about')).toBe('/about')
  })
})
