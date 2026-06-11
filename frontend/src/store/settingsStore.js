import { create } from 'zustand'

const applyLightTheme = () => {
  document.documentElement.classList.add('theme-light')
  document.documentElement.classList.remove('theme-dark')
}

applyLightTheme()

const useSettingsStore = create((set) => ({
  executionTimeout: localStorage.getItem('executionTimeout') || '30',
  autoScreenshot: localStorage.getItem('autoScreenshot') !== 'false',
  selectedEnvironmentId: localStorage.getItem('selectedEnvironmentId') || '',

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
    applyLightTheme()
    localStorage.removeItem('theme')
    localStorage.removeItem('language')
  },
}))

export { useSettingsStore }
