import { create } from 'zustand'
import { authAPI } from '../services/api'
import { WELCOME_SPLASH_STORAGE_KEY } from '../constants/welcomeSplash'

export const useAuthStore = create((set) => ({
  // State
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('authToken'),
  isLoading: false,
  error: null,

  // Actions
  register: async (email, password, name, captchaToken) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authAPI.register(email, password, name, captchaToken)
      const { user, token } = response.data

      // Save to localStorage
      localStorage.setItem('authToken', token)
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem(WELCOME_SPLASH_STORAGE_KEY, user.id)

      // Update store
      set({ user, token, isLoading: false })
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed'
      set({ error: errorMessage, isLoading: false })
      throw new Error(errorMessage)
    }
  },

  login: async (email, password, captchaToken) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authAPI.login(email, password, captchaToken)
      const { user, token } = response.data

      // Save to localStorage
      localStorage.setItem('authToken', token)
      localStorage.setItem('user', JSON.stringify(user))

      // Update store
      set({ user, token, isLoading: false })
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed'
      const errorCode = error.response?.data?.code
      set({ error: errorMessage, isLoading: false })
      const err = new Error(errorMessage)
      err.code = errorCode
      throw err
    }
  },

  logout: () => {
    authAPI.logout()
    set({ user: null, token: null, error: null })
  },

  clearError: () => {
    set({ error: null })
  },

  setUser: (user) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    }
    set({ user })
  },

  refreshUser: async () => {
    const token = localStorage.getItem('authToken')
    if (!token) return null

    try {
      const response = await authAPI.me()
      const user = response.data.user
      localStorage.setItem('user', JSON.stringify(user))
      set({ user })
      return user
    } catch {
      return null
    }
  },

  isAdmin: () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    return user?.role === 'ADMIN'
  },
}))
