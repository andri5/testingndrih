const VAR_PATTERN = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g

/**
 * Replace {{variableName}} placeholders in text with values from the map.
 * Unknown keys are left unchanged.
 */
export function substituteVariables(text, variables = {}) {
  if (text == null || typeof text !== 'string') return text
  if (!variables || Object.keys(variables).length === 0) return text
  return text.replace(VAR_PATTERN, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(variables, key)) {
      return String(variables[key] ?? '')
    }
    return match
  })
}

/**
 * Apply variable substitution to a test step (value, selector, description).
 */
export function substituteStep(step, variables = {}) {
  if (!step || !variables || Object.keys(variables).length === 0) return step
  return {
    ...step,
    value: substituteVariables(step.value, variables),
    selector: substituteVariables(step.selector, variables),
    description: substituteVariables(step.description, variables)
  }
}

/**
 * Extract {{var}} names referenced in a string.
 */
export function extractVariableNames(text) {
  if (!text || typeof text !== 'string') return []
  const names = new Set()
  let match
  const re = new RegExp(VAR_PATTERN.source, 'g')
  while ((match = re.exec(text)) !== null) {
    names.add(match[1])
  }
  return [...names]
}
