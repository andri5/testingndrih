-- AlterTable scenarios
ALTER TABLE "scenarios" ADD COLUMN "isStress" BOOLEAN DEFAULT false;

-- AlterTable executions
ALTER TABLE "executions" ADD COLUMN "isStressTest" BOOLEAN DEFAULT false,
ADD COLUMN "stressProfile" VARCHAR(50),
ADD COLUMN "concurrencyLevel" INTEGER DEFAULT 1,
ADD COLUMN "iterationCount" INTEGER DEFAULT 1;

-- Add indexes for new columns
CREATE INDEX "scenarios_isStress_idx" ON "scenarios"("isStress");
CREATE INDEX "executions_stressProfile_idx" ON "executions"("stressProfile");

-- CreateTable StressMetrics
CREATE TABLE "stress_metrics" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "responseTimeMin" INTEGER NOT NULL DEFAULT 0,
    "responseTimeAvg" INTEGER NOT NULL DEFAULT 0,
    "responseTimeMax" INTEGER NOT NULL DEFAULT 0,
    "responseTimeP50" INTEGER NOT NULL DEFAULT 0,
    "responseTimeP95" INTEGER NOT NULL DEFAULT 0,
    "responseTimeP99" INTEGER NOT NULL DEFAULT 0,
    "throughput" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "errorRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "failedStepsCount" INTEGER NOT NULL DEFAULT 0,
    "passedStepsCount" INTEGER NOT NULL DEFAULT 0,
    "totalStepsCount" INTEGER NOT NULL DEFAULT 0,
    "cpuUsagePercent" DOUBLE PRECISION DEFAULT 0,
    "memoryUsageMB" DOUBLE PRECISION DEFAULT 0,
    "concurrency" INTEGER NOT NULL DEFAULT 1,
    "iterations" INTEGER NOT NULL DEFAULT 1,
    "duration" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stress_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stress_metrics_executionId_key" ON "stress_metrics"("executionId");

-- AddForeignKey
ALTER TABLE "stress_metrics" ADD CONSTRAINT "stress_metrics_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
