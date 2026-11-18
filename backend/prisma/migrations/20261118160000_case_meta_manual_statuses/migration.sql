-- AlterEnum: manual QA outcomes
ALTER TYPE "ExecutionStatus" ADD VALUE IF NOT EXISTS 'BLOCKED';
ALTER TYPE "ExecutionStatus" ADD VALUE IF NOT EXISTS 'SKIPPED';

-- Scenario Testiny-style case fields
ALTER TABLE "scenarios" ADD COLUMN IF NOT EXISTS "precondition" TEXT;
ALTER TABLE "scenarios" ADD COLUMN IF NOT EXISTS "priority" TEXT NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE "scenarios" ADD COLUMN IF NOT EXISTS "caseType" TEXT DEFAULT 'Functional';
ALTER TABLE "scenarios" ADD COLUMN IF NOT EXISTS "ownerId" TEXT;

-- Backfill PIC = creator
UPDATE "scenarios" SET "ownerId" = "userId" WHERE "ownerId" IS NULL;

CREATE INDEX IF NOT EXISTS "scenarios_ownerId_idx" ON "scenarios"("ownerId");

ALTER TABLE "scenarios"
  DROP CONSTRAINT IF EXISTS "scenarios_ownerId_fkey";

ALTER TABLE "scenarios"
  ADD CONSTRAINT "scenarios_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Step expected result
ALTER TABLE "test_steps" ADD COLUMN IF NOT EXISTS "expectedResult" TEXT;
