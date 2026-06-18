import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { siteAPI } from '../services/api'
import { getPublicLang } from '../utils/landingRoutes'

const TRACKED_PREFIXES = [
  '/',
  '/en',
  '/about',
  '/en/about',
  '/login',
  '/register',
  '/forgot-password',
]

function shouldTrack(pathname) {
  if (TRACKED_PREFIXES.includes(pathname)) return true
  return TRACKED_PREFIXES.some(
    (p) => p !== '/' && p !== '/en' && pathname.startsWith(`${p}/`)
  )
}

export default function SiteTracker() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (!shouldTrack(pathname)) return

    const lang = getPublicLang(pathname)
    siteAPI.track(pathname, lang).catch(() => {})
  }, [pathname])

  return null
}
