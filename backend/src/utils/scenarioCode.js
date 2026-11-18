import crypto from 'crypto'

/**
 * Build a human-friendly unique scenario code: TSN-{SLUG}-{4HEX}
 * Example: TSN-LOGIN-A3F2
 */
export function buildScenarioCode(name = '') {
  const slug = String(name)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 12) || 'SCN'
  const hex = crypto.randomBytes(2).toString('hex').toUpperCase()
  return `TSN-${slug}-${hex}`
}

export async function allocateScenarioCode(prisma, name, { maxAttempts = 8 } = {}) {
  for (let i = 0; i < maxAttempts; i += 1) {
    const code = buildScenarioCode(name)
    const existing = await prisma.scenario.findUnique({
      where: { scenarioCode: code },
      select: { id: true },
    })
    if (!existing) return code
  }
  // Extremely unlikely fallback
  return `TSN-SCN-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
}
