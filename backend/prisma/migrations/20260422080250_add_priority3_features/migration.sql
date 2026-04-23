-- AlterTable
ALTER TABLE "executions" ADD COLUMN     "executionBatchId" TEXT;

-- CreateTable
CREATE TABLE "execution_batches" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "scenarioCount" INTEGER NOT NULL,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "execution_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matrix_executions" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "browsers" TEXT[],
    "results" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scenarioId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "matrix_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "execution_batches_userId_idx" ON "execution_batches"("userId");

-- CreateIndex
CREATE INDEX "execution_batches_status_idx" ON "execution_batches"("status");

-- CreateIndex
CREATE INDEX "matrix_executions_userId_idx" ON "matrix_executions"("userId");

-- CreateIndex
CREATE INDEX "matrix_executions_scenarioId_idx" ON "matrix_executions"("scenarioId");

-- CreateIndex
CREATE INDEX "matrix_executions_status_idx" ON "matrix_executions"("status");

-- CreateIndex
CREATE INDEX "executions_executionBatchId_idx" ON "executions"("executionBatchId");

-- AddForeignKey
ALTER TABLE "executions" ADD CONSTRAINT "executions_executionBatchId_fkey" FOREIGN KEY ("executionBatchId") REFERENCES "execution_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_batches" ADD CONSTRAINT "execution_batches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matrix_executions" ADD CONSTRAINT "matrix_executions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matrix_executions" ADD CONSTRAINT "matrix_executions_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
