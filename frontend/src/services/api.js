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
    if (error.response?.status === 401) {
      // Token expired/invalid - clear auth
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      window.location.href = '/login'
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
  
  reorderSteps: (scenarioId, steps) =>
    apiClient.post(`/scenarios/${scenarioId}/steps/reorder`, { steps }),
  
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

  // Import/Export
  validateCSV: (csvContent) =>
    apiClient.post('/import/validate', { content: csvContent }),
  
  importCSV: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post('/import/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  importFromTemplate: (templateId) =>
    apiClient.post(`/import/template/${templateId}`),
  
  exportToCSV: (scenarioId) =>
    apiClient.get(`/import/export/${scenarioId}`, { responseType: 'blob' }),
  
  bulkImport: (scenarios) =>
    apiClient.post('/import/bulk', { scenarios })
}

export const executionAPI = {
  // Execute scenario
  executeScenario: (scenarioId) =>
    apiClient.post(`/executions/scenarios/${scenarioId}`),
  
  // Get execution history
  getHistory: (scenarioId = null, limit = 20, offset = 0) => {
    const params = { limit, offset }
    if (scenarioId) {
      params.scenarioId = scenarioId
    }
    return apiClient.get('/executions', { params })
  },
  
  // Get execution details
  getDetails: (executionId) =>
    apiClient.get(`/executions/${executionId}`),
  
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
  }
}

export default apiClient
