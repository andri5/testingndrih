import { errorFormatter, statusCodeFromError } from '../errorHandler.js'

describe('Error Handler Utils', () => {
  describe('errorFormatter', () => {
    it('should return string as is', () => {
      expect(errorFormatter('Error message')).toBe('Error message')
    })

    it('should extract message from error objects', () => {
      const error = new Error('Test error')
      expect(errorFormatter(error)).toBe('Test error')
    })

    it('should handle null/undefined', () => {
      expect(errorFormatter(null)).toBe('Unknown error')
      expect(errorFormatter(undefined)).toBe('Unknown error')
    })
  })

  describe('statusCodeFromError', () => {
    it('should use error.status if provided', () => {
      const error = new Error('Custom')
      error.status = 403
      expect(statusCodeFromError(error)).toBe(403)
    })

    it('should return 404 for not found errors', () => {
      const error = new Error('Scenario not found')
      expect(statusCodeFromError(error)).toBe(404)
    })

    it('should return 401 for unauthorized errors', () => {
      const error = new Error('Unauthorized access')
      expect(statusCodeFromError(error)).toBe(401)
    })

    it('should return 400 for invalid errors', () => {
      const error = new Error('Invalid input')
      expect(statusCodeFromError(error)).toBe(400)
    })

    it('should default to 500', () => {
      const error = new Error('Some random error')
      expect(statusCodeFromError(error)).toBe(500)
    })
  })
})
