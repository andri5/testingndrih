export const NAME_MAX_LENGTH = 30

const NAME_PATTERN = /^[a-zA-Z\s]+$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateFullName(name, messages) {
  const trimmed = (name || '').trim()
  if (!trimmed) {
    return messages.nameRequired
  }
  if (trimmed.length > NAME_MAX_LENGTH) {
    return messages.nameMaxLength
  }
  if (!NAME_PATTERN.test(trimmed)) {
    return messages.nameAlphabetOnly
  }
  return null
}

export function validateEmail(email, messages) {
  const trimmed = (email || '').trim()
  if (!trimmed) {
    return messages.emailRequired
  }
  if (!trimmed.includes('@')) {
    return messages.emailMissingAt
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return messages.emailInvalid
  }
  return null
}
