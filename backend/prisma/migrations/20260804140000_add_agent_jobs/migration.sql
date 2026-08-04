-- P2 harden: durable hybrid local-agent job queue
CREATE TYPE "AgentJobStatus" AS ENUM ('QUEUED', 'CLAIMED', 'COMPLETED', 'FAILED', 'CANCELLED');

CREATE TABLE "agent_jobs" (
    "id" TEXT NOT NULL,
    "status" "AgentJobStatus" NOT NULL DEFAULT 'QUEUED',
    "optionsJson" TEXT,
    "resultJson" TEXT,
    "errorMessage" TEXT,
    "claimedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,

    CONSTRAINT "agent_jobs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "agent_jobs_executionId_key" ON "agent_jobs"("executionId");
CREATE INDEX "agent_jobs_userId_status_idx" ON "agent_jobs"("userId", "status");
CREATE INDEX "agent_jobs_scenarioId_idx" ON "agent_jobs"("scenarioId");
CREATE INDEX "agent_jobs_status_createdAt_idx" ON "agent_jobs"("status", "createdAt");

ALTER TABLE "agent_jobs" ADD CONSTRAINT "agent_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_jobs" ADD CONSTRAINT "agent_jobs_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_jobs" ADD CONSTRAINT "agent_jobs_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
