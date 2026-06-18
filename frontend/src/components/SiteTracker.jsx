import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { siteAPI } from '../services/api'
import { getPublicLang } from '../utils/landingRoutes'

const TRACKED_EXACT = ['/', '/id', '/about', '/id/about', '/login', '/register', '/forgot-password']

function shouldTrack(pathname) {
  if (TRACKED_EXACT.includes(pathname)) return true
  if (pathname === '/en' || pathname === '/en/about') return true
  return false
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
