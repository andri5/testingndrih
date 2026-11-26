/**
 * Client-side SQL injection pattern check for form submits (UX + defense in depth).
 * Server must still validate — never rely on this alone.
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

export function looksLikeSqlInjection(value) {
  if (value == null) return false
  const str = String(value)
  if (str.length < 3) return false
  return SQLI_PATTERNS.some((re) => re.test(str))
}

/**
 * @param {Record<string, unknown>} fields
 * @returns {{ field: string } | null}
 */
export function findSqlInjectionInForm(fields = {}) {
  for (const [field, value] of Object.entries(fields)) {
    if (looksLikeSqlInjection(value)) return { field }
  }
  return null
}

export const SQLI_REJECT_MESSAGE =
  'Input ditolak: pola SQL injection terdeteksi. Hapus karakter/perintah mencurigakan.'
