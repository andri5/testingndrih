/**
 * Reorganize eRispro case folders into Testiny-style hierarchy:
 *   eRispro / {Modul} / {Fitur}
 *
 * Usage (from backend/):
 *   node scripts/reorganize-erispro-folders.js
 *   node scripts/reorganize-erispro-folders.js --apply
 *
 * Default is dry-run (prints plan only).
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const APPLY = process.argv.includes('--apply')

const TARGET_EMAIL = (process.env.SEED_EMAIL || process.env.ADMIN_EMAIL || 'faizalandri04@gmail.com')
  .trim()
  .toLowerCase()

/** Desired tree under product root */
const TREE = {
  name: 'eRispro',
  aliases: ['eRispro', 'Apl. Erispro', 'Apl Erispro', 'Erispro', 'e-Rispro'],
  modules: [
    {
      name: 'Auth & Access',
      aliases: ['Auth & Access', 'Auth', 'Login'],
      features: [
        { name: 'Login', match: (s) => /login|wrong\s*email|wrong\s*password|valid\s*email|sign\s*in|koffice\/site\/login/i.test(hay(s)) },
        { name: 'Logout', match: (s) => /logout|sign\s*out/i.test(hay(s)) && !/login/i.test(hay(s)) },
      ],
    },
    {
      name: 'Backoffice',
      aliases: ['Backoffice eRispro', 'Backoffice', 'Back office'],
      features: [
        { name: 'Umum', match: (s) => /backoffice|back\s*office|koffice/i.test(hay(s)) && !/login|penerima|proposal/i.test(hay(s)) },
      ],
    },
    {
      name: 'Penerima Manfaat',
      aliases: ['Penerima Manfaat', 'Penerima'],
      features: [
        {
          name: 'Daftar & Detail',
          match: (s) => /penerima\s*manfaat|penerima/i.test(hay(s)) && !/proposal/i.test(hay(s)),
        },
      ],
    },
    {
      name: 'Proposal',
      aliases: ['Proposal'],
      features: [
        { name: 'Alur Proposal', match: (s) => /proposal/i.test(hay(s)) },
      ],
    },
  ],
}

function hay(scenario) {
  return [scenario.name, scenario.description, scenario.url].filter(Boolean).join(' ')
}

async function ensureFolder(userId, name, parentId, sortOrder) {
  const existing = await prisma.scenarioFolder.findFirst({
    where: { userId, parentId: parentId ?? null, name },
  })
  if (existing) return existing
  if (!APPLY) return { id: `dry:${parentId || 'root'}:${name}`, name, parentId, _dry: true }
  return prisma.scenarioFolder.create({
    data: { userId, name, parentId: parentId ?? null, sortOrder },
  })
}

async function findByAliases(userId, aliases, parentId = undefined) {
  const folders = await prisma.scenarioFolder.findMany({
    where: {
      userId,
      ...(parentId === undefined ? {} : { parentId: parentId ?? null }),
      name: { in: aliases, mode: 'insensitive' },
    },
  })
  // Prefer exact case-insensitive alias order
  const lower = aliases.map((a) => a.toLowerCase())
  folders.sort((a, b) => lower.indexOf(a.name.toLowerCase()) - lower.indexOf(b.name.toLowerCase()))
  return folders[0] || null
}

async function moveScenarios(ids, folderId) {
  if (!ids.length) return
  if (!APPLY) {
    console.log(`  [dry-run] move ${ids.length} case(s) → folder ${folderId}`)
    return
  }
  await prisma.scenario.updateMany({
    where: { id: { in: ids } },
    data: { folderId },
  })
  console.log(`  moved ${ids.length} case(s) → ${folderId}`)
}

async function main() {
  console.log(APPLY ? 'APPLY mode — writing changes' : 'DRY-RUN — no writes (pass --apply to commit)')
  console.log(`User email: ${TARGET_EMAIL}`)

  const user = await prisma.user.findUnique({ where: { email: TARGET_EMAIL } })
  if (!user) {
    throw new Error(`User not found: ${TARGET_EMAIL}`)
  }

  const scenarios = await prisma.scenario.findMany({
    where: { userId: user.id },
    select: { id: true, name: true, description: true, url: true, folderId: true },
  })
  console.log(`Cases: ${scenarios.length}`)

  // Root product folder
  let root =
    (await findByAliases(user.id, TREE.aliases, null)) ||
    (await findByAliases(user.id, TREE.aliases))
  if (root && root.parentId) {
    // If found nested, still use it as product root conceptually — move to top if apply
    if (APPLY && root.parentId) {
      root = await prisma.scenarioFolder.update({
        where: { id: root.id },
        data: { parentId: null, name: TREE.name },
      })
    }
  }
  if (!root) {
    root = await ensureFolder(user.id, TREE.name, null, 0)
  } else if (APPLY && root.name !== TREE.name) {
    root = await prisma.scenarioFolder.update({
      where: { id: root.id },
      data: { name: TREE.name },
    })
  }
  console.log(`Root: ${root.name} (${root.id})`)

  const assigned = new Set()
  let moduleOrder = 0

  for (const mod of TREE.modules) {
    moduleOrder += 1
    let moduleFolder =
      (await findByAliases(user.id, mod.aliases, root.id)) ||
      (await findByAliases(user.id, mod.aliases))

    // If module exists under old root names / top-level, reparent under eRispro
    if (moduleFolder && APPLY && moduleFolder.parentId !== root.id) {
      moduleFolder = await prisma.scenarioFolder.update({
        where: { id: moduleFolder.id },
        data: { parentId: root.id, name: mod.name, sortOrder: moduleOrder },
      })
    }
    if (!moduleFolder) {
      moduleFolder = await ensureFolder(user.id, mod.name, root.id, moduleOrder)
    } else if (APPLY && moduleFolder.name !== mod.name) {
      moduleFolder = await prisma.scenarioFolder.update({
        where: { id: moduleFolder.id },
        data: { name: mod.name },
      })
    }
    console.log(`\nModule: ${mod.name}`)

    let featureOrder = 0
    for (const feat of mod.features) {
      featureOrder += 1
      let featureFolder = await prisma.scenarioFolder.findFirst({
        where: { userId: user.id, parentId: moduleFolder.id, name: feat.name },
      })
      if (!featureFolder) {
        featureFolder = await ensureFolder(user.id, feat.name, moduleFolder.id, featureOrder)
      }
      const matches = scenarios.filter((s) => !assigned.has(s.id) && feat.match(s))
      matches.forEach((s) => assigned.add(s.id))
      console.log(`  Fitur ${feat.name}: ${matches.length} case(s)`)
      matches.forEach((s) => console.log(`    - ${s.name}`))
      await moveScenarios(
        matches.map((s) => s.id),
        featureFolder.id
      )
    }

    // Remaining cases already in this module's old folder → leave under first feature or "Umum"
    // Handled after all feature matchers via leftovers under module aliases
  }

  const leftovers = scenarios.filter((s) => !assigned.has(s.id))
  if (leftovers.length) {
    console.log(`\nUnmatched (${leftovers.length}) — leave as-is / review manually:`)
    leftovers.forEach((s) => console.log(`  - ${s.name} (folderId=${s.folderId || 'null'})`))
  }

  // Soft-clean: rename empty confusing top-level duplicates is left to user
  console.log('\nDone.')
  if (!APPLY) console.log('Re-run with --apply to write changes.')
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
