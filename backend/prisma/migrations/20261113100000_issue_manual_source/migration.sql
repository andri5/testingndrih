-- AlterTable
ALTER TABLE "issues" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'AUTO';
ALTER TABLE "issues" ADD COLUMN IF NOT EXISTS "scenarioId" TEXT;
ALTER TABLE "issues" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- Make executionId optional
ALTER TABLE "issues" ALTER COLUMN "executionId" DROP NOT NULL;

-- Backfill userId/scenarioId from linked executions
UPDATE "issues" i
SET "userId" = e."userId",
    "scenarioId" = COALESCE(i."scenarioId", e."scenarioId")
FROM "executions" e
WHERE i."executionId" = e."id"
  AND (i."userId" IS NULL OR i."scenarioId" IS NULL);

-- Indexes
CREATE INDEX IF NOT EXISTS "issues_scenarioId_idx" ON "issues"("scenarioId");
CREATE INDEX IF NOT EXISTS "issues_userId_idx" ON "issues"("userId");
CREATE INDEX IF NOT EXISTS "issues_status_idx" ON "issues"("status");

-- Foreign keys (ignore if already exist)
DO $$ BEGIN
  ALTER TABLE "issues" ADD CONSTRAINT "issues_scenarioId_fkey"
    FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "issues" ADD CONSTRAINT "issues_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;