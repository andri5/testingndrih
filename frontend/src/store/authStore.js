import { create } from 'zustand'
import { authAPI } from '../services/api'

export const useAuthStore = create((set) => ({
  // State
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('authToken'),
  isLoading: false,
  error: null,

  // Actions
  register: async (email, password, name) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authAPI.register(email, password, name)
      const { user, token } = response.data

      // Save to localStorage
      localStorage.setItem('authToken', token)
      localStorage.setItem('user', JSON.stringify(user))

      // Update store
      set({ user, token, isLoading: false })
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed'
      set({ error: errorMessage, isLoading: false })
      throw new Error(errorMessage)
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authAPI.login(email, password)
      const { user, token } = response.data

      // Save to localStorage
      localStorage.setItem('authToken', token)
      localStorage.setItem('user', JSON.stringify(user))

      // Update store
      set({ user, token, isLoading: false })
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed'
      set({ error: errorMessage, isLoading: false })
      throw new Error(errorMessage)
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
    set({ user })
  }
}))
