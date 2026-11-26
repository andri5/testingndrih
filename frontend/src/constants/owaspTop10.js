/** OWASP Top 10:2021 — product Security Test + Admin coverage UI */
export const OWASP_TOP_10_2021 = [
  {
    id: 'A01',
    code: 'A01:2021',
    title: 'Broken Access Control',
    short: 'Access control',
    scanTypes: ['BROKEN_ACCESS_CONTROL', 'BROKEN_API_AUTHORIZATION'],
  },
  {
    id: 'A02',
    code: 'A02:2021',
    title: 'Cryptographic Failures',
    short: 'Crypto',
    scanTypes: ['SSL_TLS_MISCONFIGURATION', 'SENSITIVE_DATA_EXPOSURE', 'INSECURE_JWT'],
  },
  {
    id: 'A03',
    code: 'A03:2021',
    title: 'Injection',
    short: 'Injection',
    scanTypes: [
      'SQL_INJECTION',
      'COMMAND_INJECTION',
      'LDAP_INJECTION',
      'XPATH_INJECTION',
      'TEMPLATE_INJECTION',
      'STORED_XSS',
      'REFLECTED_XSS',
      'DOM_XSS',
    ],
  },
  {
    id: 'A04',
    code: 'A04:2021',
    title: 'Insecure Design',
    short: 'Design',
    scanTypes: ['INSECURE_DESIGN'],
  },
  {
    id: 'A05',
    code: 'A05:2021',
    title: 'Security Misconfiguration',
    short: 'Misconfig',
    scanTypes: ['MISSING_SECURITY_HEADERS'],
  },
  {
    id: 'A06',
    code: 'A06:2021',
    title: 'Vulnerable and Outdated Components',
    short: 'Components',
    scanTypes: ['OUTDATED_COMPONENT'],
  },
  {
    id: 'A07',
    code: 'A07:2021',
    title: 'Identification and Authentication Failures',
    short: 'Authn',
    scanTypes: ['WEAK_AUTHENTICATION', 'SESSION_HIJACKING', 'BRUTE_FORCE_POSSIBLE', 'INSECURE_JWT'],
  },
  {
    id: 'A08',
    code: 'A08:2021',
    title: 'Software and Data Integrity Failures',
    short: 'Integrity',
    scanTypes: ['INSECURE_DESERIALIZATION'],
  },
  {
    id: 'A09',
    code: 'A09:2021',
    title: 'Security Logging and Monitoring Failures',
    short: 'Logging',
    scanTypes: ['LOGGING_FAILURE'],
  },
  {
    id: 'A10',
    code: 'A10:2021',
    title: 'Server-Side Request Forgery (SSRF)',
    short: 'SSRF',
    scanTypes: ['SSRF'],
  },
]

export function matchOwaspCategory(findingCategory = '') {
  const raw = String(findingCategory)
  return OWASP_TOP_10_2021.find((item) => raw.includes(item.code) || raw.startsWith(item.id))
}
