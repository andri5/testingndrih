import { create } from 'zustand'
import { executionAPI } from '../services/api'

export const useExecutionStore = create((set, get) => ({
  // State
  executions: [],
  currentExecution: null,
  isRunning: false,
  isLoading: false,
  error: null,
  stats: {
    total: 0,
    passed: 0,
    failed: 0,
    successRate: 0,
    averageDuration: 0
  },
  pagination: {
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false
  },

  // Actions
  executeScenario: async (scenarioId) => {
    set({ isRunning: true, error: null })
    try {
      const response = await executionAPI.executeScenario(scenarioId)
      const execution = response.data.execution

      set({ currentExecution: execution, isRunning: false })
      
      // Refresh execution history
      await get().fetchExecutions()
      
      return execution
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Execution failed'
      set({ error: errorMessage, isRunning: false })
      throw new Error(errorMessage)
    }
  },

  fetchExecutions: async (scenarioId = null, limit = 20, offset = 0) => {
    set({ isLoading: true, error: null })
    try {
      const response = await executionAPI.getHistory(scenarioId, limit, offset)
      
      set({
        executions: response.data.executions || [],
        pagination: {
          total: response.data.total,
          limit: response.data.limit,
          offset: response.data.offset,
          hasMore: response.data.hasMore
        },
        isLoading: false
      })
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch executions'
      set({ error: errorMessage, isLoading: false })
    }
  },

  getExecutionDetails: async (executionId) => {
    set({ isLoading: true, error: null })
    try {
      const response = await executionAPI.getDetails(executionId)
      const execution = response.data.execution

      set({ currentExecution: execution, isLoading: false })
      return execution
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch execution'
      set({ error: errorMessage, isLoading: false })
      throw new Error(errorMessage)
    }
  },

  cancelExecution: async (executionId) => {
    set({ isLoading: true, error: null })
    try {
      await executionAPI.cancel(executionId)
      
      // Update current execution
      const { currentExecution } = get()
      if (currentExecution?.id === executionId) {
        set({ currentExecution: { ...currentExecution, status: 'FAILED' } })
      }
      
      set({ isLoading: false })
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to cancel execution'
      set({ error: errorMessage, isLoading: false })
      throw new Error(errorMessage)
    }
  },

  deleteExecution: async (executionId) => {
    set({ isLoading: true, error: null })
    try {
      await executionAPI.delete(executionId)
      
      const { executions } = get()
      const updated = executions.filter(e => e.id !== executionId)
      
      set({
        executions: updated,
        currentExecution: null,
        isLoading: false
      })
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete execution'
      set({ error: errorMessage, isLoading: false })
      throw new Error(errorMessage)
    }
  },

  fetchExecutionStats: async (scenarioId = null) => {
    try {
      const response = await executionAPI.getStats(scenarioId)
      
      set({ stats: response.data.stats || {} })
    } catch (error) {
      console.error('Failed to fetch execution stats:', error)
    }
  },

  setCurrentExecution: (execution) => {
    set({ currentExecution: execution })
  },

  clearError: () => {
    set({ error: null })
  },

  reset: () => {
    set({
      executions: [],
      currentExecution: null,
      isRunning: false,
      isLoading: false,
      error: null
    })
  }
}))
