import { create } from 'zustand'
import apiClient from '../services/api'

export const useQaseStore = create((set, get) => ({
  // State
  isConnected: false,
  projectCode: null,
  lastSyncedAt: null,
  syncedCases: [],
  projectDetails: null,
  isLoading: false,
  error: null,

  // Actions
  connectQase: async (apiKey, projectCode) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.post('/qase/connect', {
        apiKey,
        projectCode
      })

      set({
        isConnected: true,
        projectCode,
        isLoading: false
      })

      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to connect to Qase'
      set({ error: errorMessage, isLoading: false })
      throw new Error(errorMessage)
    }
  },

  getQaseStatus: async () => {
    try {
      const response = await apiClient.get('/qase/status')

      set({
        isConnected: response.data.connected,
        projectCode: response.data.projectCode,
        lastSyncedAt: response.data.lastSyncedAt
      })

      return response.data
    } catch (error) {
      console.error('Failed to fetch Qase status:', error)
    }
  },

  syncCases: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.post('/qase/sync')

      set({
        lastSyncedAt: new Date(),
        isLoading: false
      })

      // Fetch cases after sync
      await get().fetchSyncedCases()

      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to sync cases'
      set({ error: errorMessage, isLoading: false })
      throw new Error(errorMessage)
    }
  },

  fetchSyncedCases: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.get('/qase/cases')

      set({
        syncedCases: response.data.cases || [],
        isLoading: false
      })

      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch synced cases'
      set({ error: errorMessage, isLoading: false })
      throw new Error(errorMessage)
    }
  },

  fetchProjectDetails: async () => {
    try {
      const response = await apiClient.get('/qase/project')

      set({ projectDetails: response.data.project })

      return response.data
    } catch (error) {
      console.error('Failed to fetch project details:', error)
    }
  },

  pushExecution: async (executionId) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.post(`/qase/push/${executionId}`)

      set({ isLoading: false })

      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to push execution'
      set({ error: errorMessage, isLoading: false })
      throw new Error(errorMessage)
    }
  },

  pushAllExecutions: async (scenarioId = null) => {
    set({ isLoading: true, error: null })
    try {
      const params = {}
      if (scenarioId) {
        params.scenarioId = scenarioId
      }

      const response = await apiClient.post('/qase/push-all', null, { params })

      set({ isLoading: false })

      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to push executions'
      set({ error: errorMessage, isLoading: false })
      throw new Error(errorMessage)
    }
  },

  createScenarioFromCase: async (qaseCaseId) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.post(`/qase/create-scenario/${qaseCaseId}`)

      set({ isLoading: false })

      return response.data.scenario
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create scenario'
      set({ error: errorMessage, isLoading: false })
      throw new Error(errorMessage)
    }
  },

  disconnectQase: async () => {
    set({ isLoading: true, error: null })
    try {
      await apiClient.post('/qase/disconnect')

      set({
        isConnected: false,
        projectCode: null,
        syncedCases: [],
        projectDetails: null,
        isLoading: false
      })
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to disconnect'
      set({ error: errorMessage, isLoading: false })
      throw new Error(errorMessage)
    }
  },

  clearError: () => {
    set({ error: null })
  }
}))
