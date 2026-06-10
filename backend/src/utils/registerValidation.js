export const NAME_MAX_LENGTH = 30

const NAME_PATTERN = /^[a-zA-Z\s]+$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateRegistrationName(name) {
  const trimmed = (name || '').trim()
  if (!trimmed) {
    return 'Full name is required'
  }
  if (trimmed.length > NAME_MAX_LENGTH) {
    return `Full name must be at most ${NAME_MAX_LENGTH} characters`
  }
  if (!NAME_PATTERN.test(trimmed)) {
    return 'Full name may only contain letters and spaces'
  }
  return null
}

export function validateRegistrationEmail(email) {
  const trimmed = (email || '').trim()
  if (!trimmed) {
    return 'Email is required'
  }
  if (!trimmed.includes('@')) {
    return 'Email must contain @ (example: user@email.com)'
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return 'Email format is invalid (example: user@email.com)'
  }
  return null
}
