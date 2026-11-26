/**
 * Defense-in-depth SQL injection pattern detection for form / query inputs.
 * Prisma already parameterizes queries — this rejects obvious attack payloads early.
 */

const SQLI_PATTERNS = [
  /('\s*or\s+'?\d+'?\s*=\s*'?\d+)/i,
  /('\s*or\s+'1'\s*=\s*'1)/i,
  /(\bor\b\s+1\s*=\s*1)/i,
  /(union\s+(all\s+)?select)/i,
  /(;\s*(drop|delete|truncate|alter|insert|update)\s)/i,
  /(--\s*$|--\s+)/,
  /\/\*[\s\S]*?\*\//,
  /(xp_cmdshell|information_schema|pg_sleep|sleep\s*\(|benchmark\s*\()/i,
  /(waitfor\s+delay)/i,
  /(\bexec\s*\(|\bexecute\s+)/i,
  /(0x[0-9a-f]{8,})/i,
]

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function looksLikeSqlInjection (value) {
  if (value == null) return false
  const str = String(value)
  if (str.length < 3) return false
  return SQLI_PATTERNS.some((re) => re.test(str))
}

/**
 * Scan an object of fields; return first offending key or null.
 * @param {Record<string, unknown>} fields
 * @returns {{ field: string, value: string } | null}
 */
export function findSqlInjectionField (fields = {}) {
  for (const [field, value] of Object.entries(fields)) {
    if (looksLikeSqlInjection(value)) {
      return { field, value: String(value) }
    }
  }
  return null
}

/**
 * Express middleware — reject requests whose body/query/params match SQLi patterns.
 * @param {{ body?: string[], query?: string[], params?: string[] }} fields
 */
export function rejectSqlInjection (fields = {}) {
  const bodyKeys = fields.body || []
  const queryKeys = fields.query || []
  const paramKeys = fields.params || []

  return (req, res, next) => {
    const candidates = {}
    for (const key of bodyKeys) {
      if (req.body?.[key] != null) candidates[`body.${key}`] = req.body[key]
    }
    for (const key of queryKeys) {
      if (req.query?.[key] != null) candidates[`query.${key}`] = req.query[key]
    }
    for (const key of paramKeys) {
      if (req.params?.[key] != null) candidates[`params.${key}`] = req.params[key]
    }

    const hit = findSqlInjectionField(candidates)
    if (hit) {
      return res.status(400).json({
        success: false,
        message: 'Input ditolak: pola SQL injection terdeteksi',
        field: hit.field,
        code: 'SQL_INJECTION_REJECTED',
      })
    }
    return next()
  }
}
