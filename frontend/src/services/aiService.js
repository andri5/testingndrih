import axios from 'axios'

const API_BASE_URL = '/api'

// Create axios client with auth interceptor
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

export const aiService = {
  // Ask AI to fix a broken locator
  fixLocator: async (errorData) => {
    try {
      const response = await apiClient.post('/ai/fix-locator', {
        errorMessage: errorData.errorMessage,
        currentLocator: errorData.currentLocator,
        stepDescription: errorData.stepDescription,
        pageUrl: errorData.pageUrl,
        stepType: errorData.stepType
      })
      return response.data
    } catch (error) {
      console.error('AI Service Error:', error.response?.data || error.message)
      throw error.response?.data || { error: 'Failed to get AI suggestion' }
    }
  }
}

export default aiService
