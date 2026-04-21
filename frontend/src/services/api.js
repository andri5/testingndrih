import axios from 'axios'

const API_BASE = '/api'

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests if it exists
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const currentPath = window.location.pathname
    const isAuthPage = ['/login', '/register', '/session-expired'].includes(currentPath)

    if (status === 401) {
      // Token expired/invalid - clear auth and redirect
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      if (!isAuthPage) {
        window.location.href = '/session-expired'
      }
    } else if (status === 403) {
      if (!isAuthPage) {
        window.location.href = '/forbidden'
      }
    } else if (status >= 500) {
      if (!isAuthPage) {
        window.location.href = '/server-error'
      }
    } else if (!error.response) {
      // Network error / timeout — only redirect if not already on an error page
      const isErrorPage = ['/session-expired', '/forbidden', '/server-error', '/maintenance'].includes(currentPath)
      if (!isAuthPage && !isErrorPage) {
        // Let components handle network errors inline; don't hard-redirect
        // (offline banner handles UI feedback)
      }
    }

    return Promise.reject(error)
  }
)

export const authAPI = {
  register: (email, password, name) =>
    apiClient.post('/auth/register', { email, password, name }),
  
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),
  
  me: () =>
    apiClient.get('/auth/me'),
  
  logout: () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
  }
}

export const scenarioAPI = {
  // Scenario CRUD
  create: (name, description, url) =>
    apiClient.post('/scenarios', { name, description, url }),
  
  getAll: (skip = 0, take = 10) =>
    apiClient.get('/scenarios', { params: { skip, take } }),
  
  getById: (id) =>
    apiClient.get(`/scenarios/${id}`),
  
  update: (id, name, description, url) =>
    apiClient.put(`/scenarios/${id}`, { name, description, url }),
  
  delete: (id) =>
    apiClient.delete(`/scenarios/${id}`),
  
  duplicate: (id) =>
    apiClient.post(`/scenarios/${id}/duplicate`),
  
  getStats: () =>
    apiClient.get('/scenarios/stats'),

  // Search
  search: (query, skip = 0, take = 10) =>
    apiClient.get('/search', { params: { q: query, skip, take } }),
  
  searchAdvanced: (params) =>
    apiClient.post('/search/advanced', params),

  // Test Steps
  getSteps: (scenarioId, skip = 0, take = 10) =>
    apiClient.get(`/scenarios/${scenarioId}/steps`, { params: { skip, take } }),
  
  createStep: (scenarioId, stepNumber, type, description, selector, value, metadata) =>
    apiClient.post(`/scenarios/${scenarioId}/steps`, { stepNumber, type, description, selector, value, metadata }),
  
  updateStep: (scenarioId, stepId, step) =>
    apiClient.put(`/scenarios/${scenarioId}/steps/${stepId}`, step),
  
  deleteStep: (scenarioId, stepId) =>
    apiClient.delete(`/scenarios/${scenarioId}/steps/${stepId}`),
  
  bulkDeleteSteps: (scenarioId, stepIds) =>
    apiClient.post(`/scenarios/${scenarioId}/steps/bulk-delete`, { stepIds }),
  
  reorderSteps: (scenarioId, stepOrders) =>
    apiClient.put(`/scenarios/${scenarioId}/steps/reorder`, { stepOrders }),

  batchUpdateSteps: (scenarioId, data) =>
    apiClient.put(`/scenarios/${scenarioId}/steps/batch-update`, data),

  getStepTypes: () =>
    apiClient.get('/step-types'),

  // Files & Templates
  uploadFile: (formData) =>
    apiClient.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  createTemplate: (name, description, steps) =>
    apiClient.post('/files/templates', { name, description, steps }),
  
  getTemplate: (id) =>
    apiClient.get(`/files/templates/${id}`),
  
  listTemplates: () =>
    apiClient.get('/files/templates'),
  
  deleteTemplate: (id) =>
    apiClient.delete(`/files/templates/${id}`),
}

export const executionAPI = {
  // Execute scenario (long timeout: execution can take minutes for many steps)
  executeScenario: (scenarioId, options = {}) =>
    apiClient.post(`/executions/scenarios/${scenarioId}`, options, { timeout: 300000 }),

  // Get execution details (may include heavy step results)
  getDetails: (executionId) =>
    apiClient.get(`/executions/${executionId}`, { timeout: 30000 }),
  
  // Get execution history
  getHistory: (scenarioId = null, limit = 20, offset = 0) => {
    const params = { limit, offset }
    if (scenarioId) {
      params.scenarioId = scenarioId
    }
    return apiClient.get('/executions', { params })
  },
  

  
  // Cancel execution
  cancel: (executionId) =>
    apiClient.post(`/executions/${executionId}/cancel`),
  
  // Delete execution
  delete: (executionId) =>
    apiClient.delete(`/executions/${executionId}`),
  
  // Get execution statistics
  getStats: (scenarioId = null) => {
    const params = {}
    if (scenarioId) {
      params.scenarioId = scenarioId
    }
    return apiClient.get('/executions/stats/summary', { params })
  },

  // Get available browsers for cross-browser testing
  getBrowsers: () =>
    apiClient.get('/executions/browsers')
}

export const recorderAPI = {
  start: (scenarioId, url) =>
    apiClient.post('/recorder/start', { scenarioId, url }),

  stop: (scenarioId) =>
    apiClient.post('/recorder/stop', { scenarioId }),

  status: (scenarioId) =>
    apiClient.get(`/recorder/status/${scenarioId}`),

  save: (scenarioId, steps) =>
    apiClient.post(`/recorder/save/${scenarioId}`, { steps })
}

export const analyticsAPI = {
  // Get overall analytics summary
  getSummary: () =>
    apiClient.get('/analytics/summary'),

  // Get execution history (paginated)
  getExecutionHistory: (limit = 50, offset = 0) =>
    apiClient.get('/analytics/executions', { params: { limit, offset } }),

  // Get scenario performance metrics
  getScenarioMetrics: (scenarioId) =>
    apiClient.get(`/analytics/scenarios/${scenarioId}`),

  // Export analytics data
  exportData: (format = 'json') =>
    apiClient.get('/analytics/export', { params: { format }, responseType: format === 'csv' ? 'blob' : 'json' })
}

export const chainAPI = {
  // Chain CRUD
  create: (name, description) =>
    apiClient.post('/chains', { name, description }),

  getAll: (limit = 20, offset = 0) =>
    apiClient.get('/chains', { params: { limit, offset } }),

  getById: (chainId) =>
    apiClient.get(`/chains/${chainId}`),

  update: (chainId, name, description, isActive) =>
    apiClient.put(`/chains/${chainId}`, { name, description, isActive }),

  delete: (chainId) =>
    apiClient.delete(`/chains/${chainId}`),

  // Chain Steps
  addStep: (chainId, scenarioId, description, stepNumber, runMode = 'sequential', waitTime = 0, retryCount = 1, stopOnFail = true) =>
    apiClient.post(`/chains/${chainId}/steps`, { scenarioId, description, stepNumber, runMode, waitTime, retryCount, stopOnFail }),

  getSteps: (chainId) =>
    apiClient.get(`/chains/${chainId}/steps`),

  updateStep: (stepId, description, runMode, waitTime, retryCount, stopOnFail) =>
    apiClient.put(`/chains/step/${stepId}`, { description, runMode, waitTime, retryCount, stopOnFail }),

  deleteStep: (stepId) =>
    apiClient.delete(`/chains/step/${stepId}`),

  // Chain Execution
  execute: (chainId, headless = false) =>
    apiClient.post(`/chains/${chainId}/execute`, { headless }, { timeout: 600000 }), // 10 min timeout

  getExecutionHistory: (chainId, limit = 20, offset = 0) =>
    apiClient.get(`/chains/${chainId}/executions`, { params: { limit, offset } }),

  getExecutionDetails: (executionId) =>
    apiClient.get(`/chains/execution/${executionId}`)
}

export default apiClient
