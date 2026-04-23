-- CreateTable
CREATE TABLE "test_schedules" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "timeOfDay" TEXT,
    "daysOfWeek" TEXT,
    "cronExpression" TEXT,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "lastExecutionId" TEXT,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "test_schedules_userId_idx" ON "test_schedules"("userId");

-- CreateIndex
CREATE INDEX "test_schedules_scenarioId_idx" ON "test_schedules"("scenarioId");

-- CreateIndex
CREATE INDEX "test_schedules_isActive_idx" ON "test_schedules"("isActive");

-- AddForeignKey
ALTER TABLE "test_schedules" ADD CONSTRAINT "test_schedules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_schedules" ADD CONSTRAINT "test_schedules_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
