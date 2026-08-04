/**
 * Redact secret-looking values before they land in logs / error payloads / screenshots overlays.
 */

const SECRET_KEY_RE = /(password|passwd|secret|token|api[_-]?key|authorization|credential)/i

export function looksLikeSecretKey(key = '') {
  return SECRET_KEY_RE.test(String(key))
}

export function maskSecretValue(value) {
  if (value == null) return value
  const s = String(value)
  if (!s) return s
  if (s.length <= 4) return '****'
  return `${s.slice(0, 2)}***${s.slice(-1)}`
}

/**
 * Mask FILL step values when description/selector hints at a secret field.
 */
export function redactStepForError(step = {}) {
  const out = { ...step }
  const hint = `${step.description || ''} ${step.selector || ''} ${step.type || ''}`
  if (step.type === 'FILL' && (looksLikeSecretKey(hint) || looksLikeSecretKey(step.selector || ''))) {
    out.value = maskSecretValue(step.value)
  }
  return out
}

export function redactObjectSecrets(obj) {
  if (!obj || typeof obj !== 'object') return obj
  const clone = Array.isArray(obj) ? [...obj] : { ...obj }
  for (const [k, v] of Object.entries(clone)) {
    if (looksLikeSecretKey(k) && typeof v === 'string') {
      clone[k] = maskSecretValue(v)
    } else if (v && typeof v === 'object') {
      clone[k] = redactObjectSecrets(v)
    }
  }
  return clone
}
