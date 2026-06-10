export function getPasswordValidationErrors(password) {
  const errors = []

  if (!password) {
    return ['Password is required']
  }

  if (password.length < 8) errors.push('At least 8 characters')
  if (password.length > 64) errors.push('Maximum 64 characters')
  if (!/[A-Z]/.test(password)) errors.push('At least 1 uppercase letter')
  if (!/[a-z]/.test(password)) errors.push('At least 1 lowercase letter')
  if (!/[0-9]/.test(password)) errors.push('At least 1 number')
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('At least 1 special character (!@#$%^&*)')
  }

  return errors
}

export function validatePassword(password) {
  const errors = getPasswordValidationErrors(password)
  if (errors.length === 0) {
    return { valid: true, errors: [], message: null }
  }

  return {
    valid: false,
    errors,
    message: `Password does not meet requirements: ${errors.join(', ')}`,
  }
}
