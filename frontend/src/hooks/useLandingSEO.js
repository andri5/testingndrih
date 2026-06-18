import { useEffect } from 'react'
import { LANDING_SEO, ABOUT_SEO, SITE_URL } from '../i18n/landingI18n'

function upsertMeta(attr, key, content) {
  if (!content) return
  let el = document.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel, href, hreflang) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]`
  let el = document.querySelector(selector)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    if (hreflang) el.setAttribute('hreflang', hreflang)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export function usePublicSEO(lang, seoMap, alternatePaths) {
  useEffect(() => {
    const seo = seoMap[lang] || seoMap.id
    const url = `${SITE_URL}${seo.path}`
    const altId = alternatePaths?.id ?? LANDING_SEO.id.path
    const altEn = alternatePaths?.en ?? LANDING_SEO.en.path

    document.documentElement.lang = lang === 'en' ? 'en' : 'id'
    document.title = seo.title

    upsertMeta('name', 'description', seo.description)
    upsertMeta('name', 'keywords', seo.keywords)
    upsertMeta('name', 'robots', 'index, follow')
    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:site_name', 'Test Sambil Ngopi')
    upsertMeta('property', 'og:title', seo.title)
    upsertMeta('property', 'og:description', seo.description)
    upsertMeta('property', 'og:url', url)
    upsertMeta('property', 'og:locale', seo.locale)
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', seo.title)
    upsertMeta('name', 'twitter:description', seo.description)

    upsertLink('canonical', url)
    upsertLink('alternate', `${SITE_URL}${altId}`, 'id')
    upsertLink('alternate', `${SITE_URL}${altEn}`, 'en')
    upsertLink('alternate', `${SITE_URL}${altId}`, 'x-default')

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Test Sambil Ngopi',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web',
      url: SITE_URL,
      description: seo.description,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: [
        'Playwright record and playback',
        'AI test scenario generator',
        'Cross-browser execution',
        'Visual regression testing',
        'CI/CD integration',
      ],
    }

    let script = document.getElementById('landing-jsonld')
    if (!script) {
      script = document.createElement('script')
      script.id = 'landing-jsonld'
      script.type = 'application/ld+json'
      document.head.appendChild(script)
    }
    script.textContent = JSON.stringify(jsonLd)

    return () => {
      const s = document.getElementById('landing-jsonld')
      if (s) s.remove()
    }
  }, [lang, seoMap, alternatePaths])
}

export function useLandingSEO(lang) {
  usePublicSEO(lang, LANDING_SEO, { id: LANDING_SEO.id.path, en: LANDING_SEO.en.path })
}

export function useAboutSEO(lang) {
  usePublicSEO(lang, ABOUT_SEO, { id: ABOUT_SEO.id.path, en: ABOUT_SEO.en.path })
}
