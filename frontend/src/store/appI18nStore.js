/**
 * Lightweight app i18n foundation (EN default). Expand keys over time.
 * Landing remains in landingI18n.js; this store is for authenticated chrome.
 */
import { create } from 'zustand'

const dictionaries = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.scenarios': 'Scenarios',
    'nav.execution': 'Execution',
    'nav.reports': 'Reports',
    'nav.analytics': 'Analytics',
    'nav.settings': 'Settings',
    'onboarding.title': 'Getting started',
    'onboarding.create': 'Create a scenario',
    'onboarding.steps': 'Add steps or Record',
    'onboarding.run': 'Run (public cloud or local for internal)',
  },
  id: {
    'nav.dashboard': 'Dashboard',
    'nav.scenarios': 'Skenario',
    'nav.execution': 'Eksekusi',
    'nav.reports': 'Laporan',
    'nav.analytics': 'Analitik',
    'nav.settings': 'Pengaturan',
    'onboarding.title': 'Mulai di sini',
    'onboarding.create': 'Buat skenario',
    'onboarding.steps': 'Tambah step atau Record',
    'onboarding.run': 'Run (cloud publik atau lokal untuk internal)',
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
