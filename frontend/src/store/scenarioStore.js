import { create } from 'zustand'
import apiClient from '../services/api'

export const useScenarioStore = create((set, get) => ({
  // State
  scenarios: [],
  selectedScenario: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  filterType: 'all',
  pagination: {
    total: 0,
    skip: 0,
    take: 10,
    hasMore: false
  },

  // Actions
  fetchScenarios: async (skip = 0, take = 10, search = '', filter = 'all') => {
    set({ isLoading: true, error: null })
    try {
      const params = { skip, take }
      
      if (search) {
        const response = await apiClient.get('/search', { params: { q: search, skip, take } })
        set({ 
          scenarios: response.data.scenarios || [], 
          pagination: response.data.pagination,
          isLoading: false 
        })
      } else {
        const response = await apiClient.get('/scenarios', { params })
        set({ 
          scenarios: response.data.scenarios || [], 
          pagination: response.data.pagination,
          isLoading: false 
        })
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch scenarios'
      set({ error: errorMessage, isLoading: false })
    }
  },

  createScenario: async (name, description, url) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.post('/scenarios', { name, description, url })
      const newScenario = response.data.scenario || response.data
      
      const { scenarios } = get()
      set({ 
        scenarios: [newScenario, ...scenarios], 
        isLoading: false 
      })
      return newScenario
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create scenario'
      set({ error: errorMessage, isLoading: false })
      throw new Error(errorMessage)
    }
  },

  updateScenario: async (scenarioId, name, description, url) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.put(`/scenarios/${scenarioId}`, { name, description, url })
      const updatedScenario = response.data.scenario || response.data
      
      const { scenarios } = get()
      const updated = scenarios.map(s => s.id === scenarioId ? updatedScenario : s)
      set({ 
        scenarios: updated,
        selectedScenario: updatedScenario,
        isLoading: false 
      })
      return updatedScenario
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update scenario'
      set({ error: errorMessage, isLoading: false })
      throw new Error(errorMessage)
    }
  },

  deleteScenario: async (scenarioId) => {
    set({ isLoading: true, error: null })
    try {
      await apiClient.delete(`/scenarios/${scenarioId}`)
      const { scenarios } = get()
      set({ 
        scenarios: scenarios.filter(s => s.id !== scenarioId),
        selectedScenario: null,
        isLoading: false 
      })
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete scenario'
      set({ error: errorMessage, isLoading: false })
      throw new Error(errorMessage)
    }
  },

  getScenarioById: async (scenarioId) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.get(`/scenarios/${scenarioId}`)
      const scenario = response.data.scenario || response.data
      set({ selectedScenario: scenario, isLoading: false })
      return scenario
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch scenario'
      set({ error: errorMessage, isLoading: false })
      throw new Error(errorMessage)
    }
  },

  duplicateScenario: async (scenarioId) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.post(`/scenarios/${scenarioId}/duplicate`)
      const newScenario = response.data.scenario || response.data
      
      const { scenarios } = get()
      set({ 
        scenarios: [newScenario, ...scenarios], 
        isLoading: false 
      })
      return newScenario
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to duplicate scenario'
      set({ error: errorMessage, isLoading: false })
      throw new Error(errorMessage)
    }
  },

  setSelectedScenario: (scenario) => {
    set({ selectedScenario: scenario })
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query })
  },

  setFilterType: (filter) => {
    set({ filterType: filter })
  },

  clearError: () => {
    set({ error: null })
  }
}))
