import { create } from 'zustand'

const applyTheme = (theme) => {
  if (theme === 'light') {
    document.documentElement.classList.remove('dark')
  } else {
    document.documentElement.classList.add('dark')
  }
}

// Apply theme immediately on module load (before React first render)
applyTheme(localStorage.getItem('theme') || 'light')

const useSettingsStore = create((set) => ({
  theme: localStorage.getItem('theme') || 'light',
  language: localStorage.getItem('language') || 'en',
  executionTimeout: localStorage.getItem('executionTimeout') || '30',
  autoScreenshot: localStorage.getItem('autoScreenshot') !== 'false',

  setTheme: (theme) => {
    localStorage.setItem('theme', theme)
    applyTheme(theme)
    set({ theme })
  },

  setLanguage: (language) => {
    localStorage.setItem('language', language)
    set({ language })
  },

  setExecutionTimeout: (executionTimeout) => {
    localStorage.setItem('executionTimeout', executionTimeout)
    set({ executionTimeout })
  },

  setAutoScreenshot: (autoScreenshot) => {
    localStorage.setItem('autoScreenshot', autoScreenshot.toString())
    set({ autoScreenshot })
  },

  init: () => {
    const theme = localStorage.getItem('theme') || 'light'
    applyTheme(theme)
  },
}))

export { useSettingsStore }
