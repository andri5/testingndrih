import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const report = { generatedAt: new Date().toISOString(), tables: {}, issues: [], warnings: [] }

  const tableCounts = {
    users: () => prisma.user.count(),
    scenarios: () => prisma.scenario.count(),
    test_steps: () => prisma.testStep.count(),
    executions: () => prisma.execution.count(),
    step_results: () => prisma.stepResult.count(),
    test_chains: () => prisma.testChain.count(),
    chain_steps: () => prisma.chainStep.count(),
    test_schedules: () => prisma.testSchedule.count(),
    execution_batches: () => prisma.executionBatch.count(),
    matrix_executions: () => prisma.matrixExecution.count(),
    security_scans: () => prisma.securityScan.count(),
    api_tokens: () => prisma.apiToken.count(),
    issues: () => prisma.issue.count(),
    test_environments: () => prisma.testEnvironment.count(),
    visual_baselines: () => prisma.visualBaseline.count(),
  }

  for (const [name, fn] of Object.entries(tableCounts)) {
    report.tables[name] = await fn()
  }

  // Users
  const usersByRole = await prisma.user.groupBy({ by: ['role'], _count: true })
  report.usersByRole = usersByRole
  report.usersNullName = await prisma.user.count({ where: { name: null } })
  report.usersTestAccounts = await prisma.user.count({
    where: {
      OR: [
        { email: { endsWith: '@testingndrih.local' } },
        { email: { endsWith: '@test.local' } },
      ],
    },
  })
  report.usersRealSample = await prisma.user.findMany({
    where: {
      NOT: {
        OR: [
          { email: { endsWith: '@testingndrih.local' } },
          { email: { endsWith: '@test.local' } },
        ],
      },
    },
    select: { email: true, name: true, role: true },
    take: 10,
    orderBy: { createdAt: 'desc' },
  })

  report.expiredResetTokens = await prisma.user.count({
    where: {
      resetToken: { not: null },
      resetTokenExpiry: { lt: new Date() },
    },
  })
  if (report.expiredResetTokens > 0) {
    report.warnings.push(`${report.expiredResetTokens} user(s) have expired reset tokens not cleared`)
  }

  // Orphans & integrity
  const orphanScenarios = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS c FROM scenarios s
    LEFT JOIN users u ON s."userId" = u.id WHERE u.id IS NULL`
  const orphanSteps = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS c FROM test_steps ts
    LEFT JOIN scenarios s ON ts."scenarioId" = s.id WHERE s.id IS NULL`
  const stepMismatch = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS c FROM scenarios sc
    WHERE sc.steps != (
      SELECT COUNT(*)::int FROM test_steps ts WHERE ts."scenarioId" = sc.id
    )`
  const chainStepMismatch = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS c FROM test_chains tc
    WHERE tc.steps != (
      SELECT COUNT(*)::int FROM chain_steps cs WHERE cs."chainId" = tc.id
    )`

  report.integrity = {
    orphanScenarios: orphanScenarios[0]?.c ?? 0,
    orphanTestSteps: orphanSteps[0]?.c ?? 0,
    scenarioStepCountMismatch: stepMismatch[0]?.c ?? 0,
    chainStepCountMismatch: chainStepMismatch[0]?.c ?? 0,
    scenariosWithZeroSteps: await prisma.scenario.count({ where: { steps: 0 } }),
  }

  if (report.integrity.orphanScenarios > 0) {
    report.issues.push(`${report.integrity.orphanScenarios} orphan scenario(s) without user`)
  }
  if (report.integrity.orphanTestSteps > 0) {
    report.issues.push(`${report.integrity.orphanTestSteps} orphan test step(s) without scenario`)
  }
  if (report.integrity.scenarioStepCountMismatch > 0) {
    report.issues.push(
      `${report.integrity.scenarioStepCountMismatch} scenario(s) have steps count mismatch (denormalized field vs actual rows)`
    )
  }
  if (report.integrity.chainStepCountMismatch > 0) {
    report.issues.push(
      `${report.integrity.chainStepCountMismatch} chain(s) have steps count mismatch`
    )
  }

  // Schedules without valid scenario
  const orphanSchedules = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS c FROM test_schedules ts
    LEFT JOIN scenarios s ON ts."scenarioId" = s.id WHERE s.id IS NULL`
  report.integrity.orphanSchedules = orphanSchedules[0]?.c ?? 0
  if (report.integrity.orphanSchedules > 0) {
    report.issues.push(`${report.integrity.orphanSchedules} orphan schedule(s)`)
  }

  report.activeSchedules = await prisma.testSchedule.count({ where: { isActive: true } })

  // Migration status
  const migrations = await prisma.$queryRaw`
    SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5`
  report.recentMigrations = migrations

  const roleColumn = await prisma.$queryRaw`
    SELECT column_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'role'`
  report.usersRoleColumn = roleColumn

  if (report.usersTestAccounts > 50) {
    report.warnings.push(
      `${report.usersTestAccounts} test accounts (@testingndrih.local / @test.local) — consider cleanup in dev DB`
    )
  }

  const emptyByUser = await prisma.scenario.groupBy({
    by: ['userId'],
    where: { steps: 0 },
    _count: true,
    orderBy: { _count: { userId: 'desc' } },
    take: 5,
  })
  report.topEmptyScenarioOwners = await Promise.all(
    emptyByUser.map(async (g) => {
      const u = await prisma.user.findUnique({
        where: { id: g.userId },
        select: { email: true },
      })
      return { email: u?.email, emptyScenarios: g._count }
    })
  )

  const failedMigrations = await prisma.$queryRaw`
    SELECT migration_name, started_at, finished_at
    FROM _prisma_migrations WHERE finished_at IS NULL`
  report.failedMigrations = failedMigrations
  if (failedMigrations.length > 0) {
    report.warnings.push(
      `${failedMigrations.length} failed Prisma migration record(s) in _prisma_migrations (safe to clean if migration later succeeded)`
    )
  }

  if (report.integrity.scenariosWithZeroSteps > 100) {
    report.warnings.push(
      `${report.integrity.scenariosWithZeroSteps} scenarios have 0 steps (mostly test-created empty scenarios — not a schema bug)`
    )
  }

  if (report.activeSchedules > 10) {
    report.warnings.push(
      `${report.activeSchedules} active scheduler jobs running — verify these are intentional (many from integration tests)`
    )
  }

  console.log(JSON.stringify(report, null, 2))
}

main()
  .catch((e) => {
    console.error('Audit failed:', e.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
