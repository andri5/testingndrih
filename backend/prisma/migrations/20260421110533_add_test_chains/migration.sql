-- CreateTable
CREATE TABLE "test_chains" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "steps" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "test_chains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chain_steps" (
    "id" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "description" TEXT,
    "runMode" TEXT NOT NULL DEFAULT 'sequential',
    "waitTime" INTEGER NOT NULL DEFAULT 0,
    "retryCount" INTEGER NOT NULL DEFAULT 1,
    "stopOnFail" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "chainId" TEXT NOT NULL,

    CONSTRAINT "chain_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chain_executions" (
    "id" TEXT NOT NULL,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "totalSteps" INTEGER NOT NULL,
    "passedSteps" INTEGER NOT NULL DEFAULT 0,
    "failedSteps" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "chainId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "chain_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chain_step_results" (
    "id" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "status" "ExecutionStatus" NOT NULL,
    "duration" INTEGER,
    "errorMessage" TEXT,
    "executionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "chainStepId" TEXT NOT NULL,
    "chainExecutionId" TEXT NOT NULL,

    CONSTRAINT "chain_step_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "test_chains_userId_idx" ON "test_chains"("userId");

-- CreateIndex
CREATE INDEX "chain_steps_chainId_idx" ON "chain_steps"("chainId");

-- CreateIndex
CREATE INDEX "chain_steps_scenarioId_idx" ON "chain_steps"("scenarioId");

-- CreateIndex
CREATE UNIQUE INDEX "chain_steps_chainId_stepNumber_key" ON "chain_steps"("chainId", "stepNumber");

-- CreateIndex
CREATE INDEX "chain_executions_chainId_idx" ON "chain_executions"("chainId");

-- CreateIndex
CREATE INDEX "chain_executions_userId_idx" ON "chain_executions"("userId");

-- CreateIndex
CREATE INDEX "chain_executions_status_idx" ON "chain_executions"("status");

-- CreateIndex
CREATE INDEX "chain_step_results_chainStepId_idx" ON "chain_step_results"("chainStepId");

-- CreateIndex
CREATE INDEX "chain_step_results_chainExecutionId_idx" ON "chain_step_results"("chainExecutionId");

-- AddForeignKey
ALTER TABLE "test_chains" ADD CONSTRAINT "test_chains_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chain_steps" ADD CONSTRAINT "chain_steps_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES "test_chains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chain_steps" ADD CONSTRAINT "chain_steps_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chain_executions" ADD CONSTRAINT "chain_executions_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES "test_chains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chain_executions" ADD CONSTRAINT "chain_executions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chain_step_results" ADD CONSTRAINT "chain_step_results_chainStepId_fkey" FOREIGN KEY ("chainStepId") REFERENCES "chain_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chain_step_results" ADD CONSTRAINT "chain_step_results_chainExecutionId_fkey" FOREIGN KEY ("chainExecutionId") REFERENCES "chain_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
