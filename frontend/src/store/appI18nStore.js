/**
 * Lightweight app i18n foundation (EN default). Expand keys over time.
 * Landing remains in landingI18n.js; this store is for authenticated chrome.
 */
import { create } from 'zustand'

const dictionaries = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.scenarios': 'Cases',
    'nav.execution': 'Execution',
    'nav.reports': 'Reports',
    'nav.analytics': 'Analytics',
    'nav.settings': 'Settings',
    'onboarding.title': 'Getting started',
    'onboarding.create': 'New case (blank / template / import)',
    'onboarding.steps': 'Edit steps in the side panel',
    'onboarding.run': 'Jalankan case or New Test Run',
  },
  id: {
    'nav.dashboard': 'Dashboard',
    'nav.scenarios': 'Cases',
    'nav.execution': 'Eksekusi',
    'nav.reports': 'Laporan',
    'nav.analytics': 'Analitik',
    'nav.settings': 'Pengaturan',
    'onboarding.title': 'Mulai di sini',
    'onboarding.create': 'New case (blank / template / import)',
    'onboarding.steps': 'Edit steps di panel kanan',
    'onboarding.run': 'Jalankan case atau New Test Run',
  },
}

export const useAppI18nStore = create((set, get) => ({
  lang: localStorage.getItem('appLang') || 'en',
  setLang: (lang) => {
    const next = lang === 'id' ? 'id' : 'en'
    localStorage.setItem('appLang', next)
    set({ lang: next })
  },
  t: (key) => {
    const { lang } = get()
    return dictionaries[lang]?.[key] || dictionaries.en[key] || key
  },
}))
