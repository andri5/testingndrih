import { create } from 'zustand'

const applyTheme = (theme) => {
  if (theme === 'light') {
    document.documentElement.classList.add('theme-light')
  } else {
    document.documentElement.classList.remove('theme-light')
  }
}

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
