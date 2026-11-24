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
    'onboarding.create': 'Create a case',
    'onboarding.steps': 'Add steps (Manual checklist)',
    'onboarding.run': 'Manual Run or Test Run cycle',
  },
  id: {
    'nav.dashboard': 'Dashboard',
    'nav.scenarios': 'Cases',
    'nav.execution': 'Eksekusi',
    'nav.reports': 'Laporan',
    'nav.analytics': 'Analitik',
    'nav.settings': 'Pengaturan',
    'onboarding.title': 'Mulai di sini',
    'onboarding.create': 'Buat case',
    'onboarding.steps': 'Tambah step (checklist manual)',
    'onboarding.run': 'Manual Run atau siklus Test Run',
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
