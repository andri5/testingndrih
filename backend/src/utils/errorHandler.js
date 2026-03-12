// Error handler middleware tests
export function errorFormatter(error) {
  if (typeof error === 'string') return error
  if (error && error.message) return error.message
  return 'Unknown error'
}

export function statusCodeFromError(error) {
  if (error && error.status) return error.status
  if (error && error.message && error.message.includes('not found')) return 404
  if (error && error.message && error.message.includes('Unauthorized')) return 401
  if (error && error.message && error.message.includes('Invalid')) return 400
  return 500
}
