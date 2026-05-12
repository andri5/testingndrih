-- AlterEnum
ALTER TYPE "ExecutionStatus" ADD VALUE 'SMOKE_PASSED' AFTER 'PASSED';
ALTER TYPE "ExecutionStatus" ADD VALUE 'SMOKE_FAILED' AFTER 'FAILED';

-- AlterTable executions
ALTER TABLE "executions" ADD COLUMN "testType" VARCHAR(50) DEFAULT 'STANDARD',
ADD COLUMN "isSmokeTest" BOOLEAN DEFAULT false;

-- AlterTable scenarios
ALTER TABLE "scenarios" ADD COLUMN "isSmoke" BOOLEAN DEFAULT false;

-- Add indexes for new columns
CREATE INDEX "executions_testType_idx" ON "executions"("testType");
CREATE INDEX "scenarios_isSmoke_idx" ON "scenarios"("isSmoke");
