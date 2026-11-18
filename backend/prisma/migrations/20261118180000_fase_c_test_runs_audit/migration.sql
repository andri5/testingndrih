-- Fase C: multi-case Test Run + case audit history

CREATE TYPE "TestRunStatus" AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE "TestRunItemStatus" AS ENUM ('NOT_RUN', 'PASSED', 'FAILED', 'BLOCKED', 'SKIPPED');

CREATE TABLE IF NOT EXISTS "test_runs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TestRunStatus" NOT NULL DEFAULT 'OPEN',
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "test_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "test_runs_createdById_status_idx" ON "test_runs"("createdById", "status");
CREATE INDEX IF NOT EXISTS "test_runs_createdAt_idx" ON "test_runs"("createdAt");

ALTER TABLE "test_runs"
  DROP CONSTRAINT IF EXISTS "test_runs_createdById_fkey";
ALTER TABLE "test_runs"
  ADD CONSTRAINT "test_runs_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "test_run_items" (
    "id" TEXT NOT NULL,
    "status" "TestRunItemStatus" NOT NULL DEFAULT 'NOT_RUN',
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "testRunId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "executionId" TEXT,

    CONSTRAINT "test_run_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "test_run_items_testRunId_scenarioId_key" ON "test_run_items"("testRunId", "scenarioId");
CREATE INDEX IF NOT EXISTS "test_run_items_testRunId_idx" ON "test_run_items"("testRunId");
CREATE INDEX IF NOT EXISTS "test_run_items_scenarioId_idx" ON "test_run_items"("scenarioId");
CREATE INDEX IF NOT EXISTS "test_run_items_assigneeId_idx" ON "test_run_items"("assigneeId");
CREATE INDEX IF NOT EXISTS "test_run_items_status_idx" ON "test_run_items"("status");

ALTER TABLE "test_run_items"
  DROP CONSTRAINT IF EXISTS "test_run_items_testRunId_fkey";
ALTER TABLE "test_run_items"
  ADD CONSTRAINT "test_run_items_testRunId_fkey"
  FOREIGN KEY ("testRunId") REFERENCES "test_runs"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "test_run_items"
  DROP CONSTRAINT IF EXISTS "test_run_items_scenarioId_fkey";
ALTER TABLE "test_run_items"
  ADD CONSTRAINT "test_run_items_scenarioId_fkey"
  FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "test_run_items"
  DROP CONSTRAINT IF EXISTS "test_run_items_assigneeId_fkey";
ALTER TABLE "test_run_items"
  ADD CONSTRAINT "test_run_items_assigneeId_fkey"
  FOREIGN KEY ("assigneeId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "scenario_audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scenarioId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "scenario_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "scenario_audit_logs_scenarioId_createdAt_idx" ON "scenario_audit_logs"("scenarioId", "createdAt");
CREATE INDEX IF NOT EXISTS "scenario_audit_logs_userId_idx" ON "scenario_audit_logs"("userId");

ALTER TABLE "scenario_audit_logs"
  DROP CONSTRAINT IF EXISTS "scenario_audit_logs_scenarioId_fkey";
ALTER TABLE "scenario_audit_logs"
  ADD CONSTRAINT "scenario_audit_logs_scenarioId_fkey"
  FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "scenario_audit_logs"
  DROP CONSTRAINT IF EXISTS "scenario_audit_logs_userId_fkey";
ALTER TABLE "scenario_audit_logs"
  ADD CONSTRAINT "scenario_audit_logs_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
