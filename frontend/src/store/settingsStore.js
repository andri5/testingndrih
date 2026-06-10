import { create } from 'zustand'

const APP_THEME = 'dark'
const APP_LANGUAGE = 'en'

const applyTheme = () => {
  document.documentElement.classList.add('theme-dark')
  document.documentElement.classList.remove('theme-light')
}

// Always dark theme + English on load
applyTheme()
localStorage.setItem('theme', APP_THEME)
localStorage.setItem('language', APP_LANGUAGE)

const useSettingsStore = create((set) => ({
  theme: APP_THEME,
  language: APP_LANGUAGE,
  executionTimeout: localStorage.getItem('executionTimeout') || '30',
  autoScreenshot: localStorage.getItem('autoScreenshot') !== 'false',
  selectedEnvironmentId: localStorage.getItem('selectedEnvironmentId') || '',

  setTheme: () => {
    applyTheme()
    localStorage.setItem('theme', APP_THEME)
    set({ theme: APP_THEME })
  },

  setLanguage: () => {
    localStorage.setItem('language', APP_LANGUAGE)
    set({ language: APP_LANGUAGE })
  },

  setExecutionTimeout: (executionTimeout) => {
    localStorage.setItem('executionTimeout', executionTimeout)
    set({ executionTimeout })
  },

  setAutoScreenshot: (autoScreenshot) => {
    localStorage.setItem('autoScreenshot', autoScreenshot.toString())
    set({ autoScreenshot })
  },

  setSelectedEnvironmentId: (selectedEnvironmentId) => {
    localStorage.setItem('selectedEnvironmentId', selectedEnvironmentId || '')
    set({ selectedEnvironmentId: selectedEnvironmentId || '' })
  },

  init: () => {
    applyTheme()
    localStorage.setItem('theme', APP_THEME)
    localStorage.setItem('language', APP_LANGUAGE)
    set({ theme: APP_THEME, language: APP_LANGUAGE })
  },
}))

export { useSettingsStore }
