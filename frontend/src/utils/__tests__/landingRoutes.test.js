import {
  getPublicLang,
  isEnglishPublicPath,
  toIndonesianPublicPath,
  toEnglishPublicPath,
  toPublicPath,
  publicHomePath,
  publicAboutPath,
  isAboutPublicPath,
} from '../utils/landingRoutes.js'

describe('landingRoutes', () => {
  it('detects english paths', () => {
    expect(isEnglishPublicPath('/en')).toBe(true)
    expect(isEnglishPublicPath('/en/about')).toBe(true)
    expect(isEnglishPublicPath('/about')).toBe(false)
  })

  it('switches about paths between languages', () => {
    expect(toPublicPath('/about', 'en')).toBe('/en/about')
    expect(toPublicPath('/en/about', 'id')).toBe('/about')
  })

  it('switches home paths between languages', () => {
    expect(toPublicPath('/', 'en')).toBe('/en')
    expect(toPublicPath('/en', 'id')).toBe('/')
  })

  it('preserves unknown public paths for 404', () => {
    expect(toPublicPath('/foo', 'en')).toBe('/en/foo')
    expect(toPublicPath('/en/foo', 'id')).toBe('/foo')
  })

  it('getPublicLang from pathname', () => {
    expect(getPublicLang('/en/about')).toBe('en')
    expect(getPublicLang('/about')).toBe('id')
  })

  it('publicAboutPath', () => {
    expect(publicAboutPath('id')).toBe('/about')
    expect(publicAboutPath('en')).toBe('/en/about')
  })

  it('isAboutPublicPath', () => {
    expect(isAboutPublicPath('/about')).toBe(true)
    expect(isAboutPublicPath('/en/about')).toBe(true)
    expect(isAboutPublicPath('/en')).toBe(false)
  })

  it('toIndonesianPublicPath and toEnglishPublicPath', () => {
    expect(toIndonesianPublicPath('/en/about')).toBe('/about')
    expect(toEnglishPublicPath('/about')).toBe('/en/about')
  })
})
